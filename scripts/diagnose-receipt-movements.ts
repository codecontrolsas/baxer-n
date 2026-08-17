/**
 * DIAGNÓSTICO READ-ONLY: recibos confirmados con cuenta bancaria asignada pero SIN
 * movimiento bancario asociado. Sirve para distinguir un caso aislado de una falla sistémica.
 *
 * Uso: npx tsx scripts/diagnose-receipt-movements.ts
 */
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const COMPANY_NAME = 'Codecontrol SAS';

async function main() {
  const connectionString = process.env.DATABASE_URL_PROD ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error('Falta DATABASE_URL_PROD / DATABASE_URL');

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  const company = await prisma.company.findFirst({ where: { name: COMPANY_NAME }, select: { id: true } });
  if (!company) throw new Error(`No existe la empresa ${COMPANY_NAME}`);

  // Configuración contable: explica los asientos faltantes
  const settings = await prisma.accountingSettings.findFirst({
    where: { companyId: company.id },
    select: { receivablesAccountId: true, defaultBankAccountId: true, defaultCashAccountId: true },
  });
  console.log('CONFIGURACIÓN CONTABLE');
  console.log(`  receivablesAccountId  : ${settings?.receivablesAccountId ?? '*** NULL ***'}`);
  console.log(`  defaultBankAccountId  : ${settings?.defaultBankAccountId ?? '*** NULL ***'}`);
  console.log(`  defaultCashAccountId  : ${settings?.defaultCashAccountId ?? '*** NULL ***'}`);

  const receipts = await prisma.receipt.findMany({
    where: { companyId: company.id, status: 'CONFIRMED' },
    select: {
      id: true,
      fullNumber: true,
      date: true,
      totalAmount: true,
      confirmedAt: true,
      updatedAt: true,
      journalEntryId: true,
      payments: { select: { paymentMethod: true, amount: true, bankAccountId: true, cashRegisterId: true } },
    },
    orderBy: { number: 'asc' },
  });

  console.log(`\nRECIBOS CONFIRMADOS: ${receipts.length}`);

  const withoutMovement: typeof receipts = [];
  const withoutEntry: typeof receipts = [];

  for (const r of receipts) {
    const expectsBankMovement = r.payments.some(
      (p) => p.bankAccountId && p.paymentMethod !== 'ECHEQ' && !p.cashRegisterId
    );
    if (expectsBankMovement) {
      const count = await prisma.bankMovement.count({ where: { receiptId: r.id } });
      if (count === 0) withoutMovement.push(r);
    }
    if (!r.journalEntryId) withoutEntry.push(r);
  }

  console.log(`\n>>> Esperaban movimiento bancario y NO lo tienen: ${withoutMovement.length}`);
  for (const r of withoutMovement) {
    const p = r.payments[0];
    const editedAfter = r.confirmedAt && r.updatedAt.getTime() - r.confirmedAt.getTime() > 1000;
    console.log(
      `  - ${r.fullNumber}  ${r.date.toISOString().slice(0, 10)}  $${r.totalAmount.toString()}  ${p?.paymentMethod}` +
        `  confirmado ${r.confirmedAt?.toISOString().slice(0, 16) ?? '—'}` +
        `  actualizado ${r.updatedAt.toISOString().slice(0, 16)}${editedAfter ? '  <-- EDITADO DESPUÉS DE CONFIRMAR' : ''}`
    );
  }

  console.log(`\n>>> Sin asiento contable: ${withoutEntry.length}`);
  for (const r of withoutEntry) {
    console.log(`  - ${r.fullNumber}  ${r.date.toISOString().slice(0, 10)}  $${r.totalAmount.toString()}`);
  }

  // Contraste: recibos con transferencia que SÍ generaron movimiento, para ubicar desde cuándo funciona
  console.log('\n>>> Últimos 10 recibos TRANSFER que SÍ tienen movimiento bancario');
  let shown = 0;
  for (const r of [...receipts].reverse()) {
    if (shown >= 10) break;
    if (!r.payments.some((p) => p.paymentMethod === 'TRANSFER' && p.bankAccountId)) continue;
    const count = await prisma.bankMovement.count({ where: { receiptId: r.id } });
    if (count > 0) {
      console.log(
        `  - ${r.fullNumber}  ${r.date.toISOString().slice(0, 10)}  confirmado ${r.confirmedAt?.toISOString().slice(0, 16) ?? '—'}  (${count} mov.)`
      );
      shown++;
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
