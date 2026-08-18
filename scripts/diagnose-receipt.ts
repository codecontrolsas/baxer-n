/**
 * DIAGNÓSTICO READ-ONLY de un recibo de cobro.
 * No escribe absolutamente nada. Solo reporta el estado real en la base.
 *
 * Uso: npx tsx scripts/diagnose-receipt.ts [R-00076]
 */
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const RECEIPT_NUMBER = process.argv[2] ?? 'R-00076';

async function main() {
  const connectionString = process.env.DATABASE_URL_PROD ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error('Falta DATABASE_URL_PROD / DATABASE_URL');

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  const companies = await prisma.company.findMany({ select: { id: true, name: true } });
  console.log('EMPRESAS EN ESTA BASE');
  for (const c of companies) {
    const count = await prisma.receipt.count({ where: { companyId: c.id } });
    console.log(`  - ${c.name} (${c.id}) — ${count} recibos`);
  }

  const receipt = await prisma.receipt.findFirst({
    where: { fullNumber: RECEIPT_NUMBER },
    include: {
      company: { select: { id: true, name: true } },
      customer: { select: { name: true } },
      payments: true,
      items: {
        include: {
          invoice: { select: { id: true, fullNumber: true, total: true, status: true } },
        },
      },
      withholdings: true,
      journalEntry: { select: { id: true, number: true, status: true } },
    },
  });

  if (!receipt) {
    console.log(`\nNo se encontró el recibo ${RECEIPT_NUMBER}. Últimos 15 recibos cargados:`);
    const recent = await prisma.receipt.findMany({
      select: { fullNumber: true, date: true, totalAmount: true, status: true, company: { select: { name: true } } },
      orderBy: { number: 'desc' },
      take: 15,
    });
    for (const r of recent) {
      console.log(
        `  - ${r.fullNumber}  ${r.date.toISOString().slice(0, 10)}  $${r.totalAmount.toString()}  ${r.status}  [${r.company.name}]`
      );
    }
    await prisma.$disconnect();
    return;
  }

  console.log('\n' + '='.repeat(70));
  console.log(`RECIBO ${receipt.fullNumber}`);
  console.log('='.repeat(70));
  console.log(`  id           : ${receipt.id}`);
  console.log(`  empresa      : ${receipt.company.name} (${receipt.companyId})`);
  console.log(`  cliente      : ${receipt.customer.name}`);
  console.log(`  fecha        : ${receipt.date.toISOString().slice(0, 10)}`);
  console.log(`  total        : ${receipt.totalAmount.toString()}`);
  console.log(`  estado       : ${receipt.status}`);
  console.log(`  confirmadoAt : ${receipt.confirmedAt?.toISOString() ?? '—'}`);
  console.log(`  confirmadoBy : ${receipt.confirmedBy ?? '—'}`);
  console.log(
    `  asiento      : ${receipt.journalEntryId ? `${receipt.journalEntry?.number} (${receipt.journalEntry?.status})` : '*** NULL — SIN ASIENTO CONTABLE ***'}`
  );

  console.log('\nFORMAS DE PAGO');
  for (const p of receipt.payments) {
    console.log(`  - ${p.paymentMethod}  $${p.amount.toString()}`);
    console.log(`      paymentId      : ${p.id}`);
    console.log(`      cashRegisterId : ${p.cashRegisterId ?? '*** NULL ***'}`);
    console.log(`      bankAccountId  : ${p.bankAccountId ?? '*** NULL ***'}`);
    console.log(`      reference      : ${p.reference ?? '—'}`);
  }

  console.log('\nFACTURAS IMPUTADAS');
  for (const item of receipt.items) {
    console.log(
      `  - ${item.invoice.fullNumber}  imputado $${item.amount.toString()} / total $${item.invoice.total.toString()}  → estado ${item.invoice.status}`
    );
  }

  if (receipt.withholdings.length > 0) {
    console.log('\nRETENCIONES');
    for (const w of receipt.withholdings) {
      console.log(`  - ${w.taxType}  $${w.amount.toString()}`);
    }
  }

  const movements = await prisma.bankMovement.findMany({
    where: { receiptId: receipt.id },
    select: { id: true, type: true, amount: true, date: true, bankAccountId: true, description: true },
  });
  console.log(`\nMOVIMIENTOS BANCARIOS LIGADOS AL RECIBO: ${movements.length}`);
  for (const m of movements) {
    console.log(`  - ${m.type} $${m.amount.toString()} cuenta ${m.bankAccountId} — ${m.description}`);
  }

  const orphans = await prisma.bankMovement.findMany({
    where: { companyId: receipt.companyId, reference: receipt.fullNumber, receiptId: null },
    select: { id: true, type: true, amount: true, bankAccountId: true },
  });
  console.log(`MOVIMIENTOS HUÉRFANOS con reference=${receipt.fullNumber}: ${orphans.length}`);
  for (const m of orphans) {
    console.log(`  - ${m.id} ${m.type} $${m.amount.toString()} cuenta ${m.bankAccountId}`);
  }

  console.log('\nCUENTAS BANCARIAS DE LA EMPRESA');
  const accounts = await prisma.bankAccount.findMany({
    where: { companyId: receipt.companyId },
    select: { id: true, bankName: true, accountNumber: true, balance: true, status: true, accountId: true },
    orderBy: { bankName: 'asc' },
  });

  const INCOME_TYPES = ['DEPOSIT', 'TRANSFER_IN', 'INTEREST', 'CHECK'];
  for (const a of accounts) {
    const movs = await prisma.bankMovement.findMany({
      where: { bankAccountId: a.id },
      select: { type: true, amount: true },
    });
    const calculated = movs.reduce(
      (acc, m) => (INCOME_TYPES.includes(m.type) ? acc + Number(m.amount) : acc - Number(m.amount)),
      0
    );
    console.log(`  - ${a.bankName} / ${a.accountNumber} (${a.status})`);
    console.log(`      id                : ${a.id}`);
    console.log(`      cuenta contable   : ${a.accountId ?? '*** NULL — sin cuenta contable asociada ***'}`);
    console.log(`      balance guardado  : ${a.balance.toString()}`);
    console.log(`      balance calculado : ${calculated.toFixed(2)}  (${movs.length} movimientos)`);
  }

  console.log('\nOTROS DOCUMENTOS CONFIRMADOS CON EL MISMO PROBLEMA');
  const brokenReceipts = await prisma.receipt.findMany({
    where: {
      companyId: receipt.companyId,
      status: 'CONFIRMED',
      payments: {
        some: { paymentMethod: { in: ['CASH', 'TRANSFER', 'DEBIT_CARD'] }, cashRegisterId: null, bankAccountId: null },
      },
    },
    select: { fullNumber: true, date: true, totalAmount: true, journalEntryId: true },
    orderBy: { number: 'asc' },
  });
  console.log(`  Recibos afectados: ${brokenReceipts.length}`);
  for (const r of brokenReceipts) {
    console.log(
      `    - ${r.fullNumber}  ${r.date.toISOString().slice(0, 10)}  $${r.totalAmount.toString()}  asiento: ${r.journalEntryId ?? 'NULL'}`
    );
  }

  const brokenOrders = await prisma.paymentOrder.findMany({
    where: {
      companyId: receipt.companyId,
      status: 'CONFIRMED',
      payments: {
        some: { paymentMethod: { in: ['CASH', 'TRANSFER'] }, cashRegisterId: null, bankAccountId: null },
      },
    },
    select: { fullNumber: true, date: true, totalAmount: true, journalEntryId: true },
    orderBy: { number: 'asc' },
  });
  console.log(`  Órdenes de pago afectadas: ${brokenOrders.length}`);
  for (const o of brokenOrders) {
    console.log(
      `    - ${o.fullNumber}  ${o.date.toISOString().slice(0, 10)}  $${o.totalAmount.toString()}  asiento: ${o.journalEntryId ?? 'NULL'}`
    );
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
