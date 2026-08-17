/**
 * VERIFICACIÓN READ-ONLY del asiento contable generado para un recibo.
 * Muestra sus líneas, cuentas y comprueba que esté balanceado.
 *
 * Uso: npx tsx scripts/diagnose-receipt-entry.ts R-00076
 */
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const RECEIPT_NUMBER = process.argv[2] ?? 'R-00076';

async function main() {
  const connectionString = process.env.DATABASE_URL_PROD ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error('Falta DATABASE_URL_PROD / DATABASE_URL');

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  const receipt = await prisma.receipt.findFirst({
    where: { fullNumber: RECEIPT_NUMBER },
    select: { id: true, fullNumber: true, totalAmount: true, date: true, journalEntryId: true },
  });
  if (!receipt) throw new Error(`No existe ${RECEIPT_NUMBER}`);
  if (!receipt.journalEntryId) throw new Error(`${RECEIPT_NUMBER} sigue sin asiento`);

  const entry = await prisma.journalEntry.findUnique({
    where: { id: receipt.journalEntryId },
    select: {
      number: true,
      date: true,
      description: true,
      status: true,
      fiscalYearId: true,
      periodId: true,
      lines: {
        select: {
          debit: true,
          credit: true,
          description: true,
          account: { select: { code: true, name: true, nature: true } },
        },
      },
    },
  });

  console.log(`ASIENTO #${entry?.number}  ${entry?.date.toISOString().slice(0, 10)}  [${entry?.status}]`);
  console.log(`  ${entry?.description}`);
  console.log(`  ejercicio: ${entry?.fiscalYearId ?? 'NULL'}   período: ${entry?.periodId ?? 'NULL'}`);
  console.log('\n  LÍNEAS');

  let totalDebit = 0;
  let totalCredit = 0;
  for (const l of entry?.lines ?? []) {
    totalDebit += Number(l.debit);
    totalCredit += Number(l.credit);
    console.log(
      `    ${l.account.code.padEnd(12)} ${l.account.name.padEnd(32).slice(0, 32)}  debe ${Number(l.debit).toFixed(2).padStart(14)}  haber ${Number(l.credit).toFixed(2).padStart(14)}`
    );
    console.log(`      ${l.description}`);
  }

  console.log(`\n  TOTAL DEBE : ${totalDebit.toFixed(2)}`);
  console.log(`  TOTAL HABER: ${totalCredit.toFixed(2)}`);
  console.log(`  Balanceado : ${Math.abs(totalDebit - totalCredit) < 0.01 ? 'SÍ' : '*** NO ***'}`);
  console.log(
    `  Coincide con el total del recibo ($${receipt.totalAmount.toString()}): ${
      Math.abs(totalDebit - Number(receipt.totalAmount)) < 0.01 ? 'SÍ' : '*** NO ***'
    }`
  );

  const movements = await prisma.bankMovement.findMany({
    where: { receiptId: receipt.id },
    select: { type: true, amount: true, date: true, description: true, reconciled: true, bankAccount: { select: { bankName: true } } },
  });
  console.log(`\n  MOVIMIENTOS BANCARIOS: ${movements.length}`);
  for (const m of movements) {
    console.log(
      `    ${m.type} $${m.amount.toString()} en ${m.bankAccount.bankName} el ${m.date.toISOString().slice(0, 10)} — ${m.description} ${m.reconciled ? '(conciliado)' : ''}`
    );
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
