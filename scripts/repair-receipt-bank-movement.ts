/**
 * REPARACIÓN de un recibo confirmado al que le falta el movimiento bancario y/o el asiento
 * contable, por haberse confirmado sin cuenta bancaria asignada.
 *
 * Reconstruye exactamente lo que habría hecho confirmReceipt():
 *   1. BankMovement DEPOSIT ligado al recibo (reconciliado, igual que el flujo normal)
 *   2. Saldo de la cuenta bancaria sincronizado con la suma real de sus movimientos
 *   3. Asiento contable vía createJournalEntryForReceipt() — la misma función del flujo normal
 *
 * NO toca facturas, items ni totales: esa parte del recibo ya quedó correcta.
 * Es idempotente: si el movimiento o el asiento ya existen, los saltea.
 *
 * Uso:
 *   npx tsx scripts/repair-receipt-bank-movement.ts R-00076           # dry-run (no escribe)
 *   npx tsx scripts/repair-receipt-bank-movement.ts R-00076 --apply   # aplica los cambios
 */
import * as fs from 'fs';
import * as path from 'path';

// El módulo de contabilidad usa el cliente singleton, que lee DATABASE_URL.
// Se apunta a la base indicada por DATABASE_URL_PROD antes de importarlo.
if (process.env.DATABASE_URL_PROD) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_PROD;
}

const RECEIPT_NUMBER = process.argv[2] ?? 'R-00076';
const APPLY = process.argv.includes('--apply');

const INCOME_TYPES = ['DEPOSIT', 'TRANSFER_IN', 'INTEREST', 'CHECK'];

async function main() {
  const { prisma } = await import('@/shared/lib/prisma');
  const { createJournalEntryForReceipt } = await import('@/modules/accounting/features/integrations/commercial');

  console.log(APPLY ? '### MODO APLICAR — se escribirá en la base ###' : '### DRY-RUN — no se escribe nada ###');
  // Dejar explícito contra qué base se corre: .env define DATABASE_URL_PROD además de DATABASE_URL
  const target = (process.env.DATABASE_URL ?? '').replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
  console.log(`Base destino   : ${target}`);
  console.log(`Recibo objetivo: ${RECEIPT_NUMBER}\n`);

  const receipt = await prisma.receipt.findFirst({
    where: { fullNumber: RECEIPT_NUMBER },
    include: {
      company: { select: { id: true, name: true } },
      customer: { select: { name: true } },
      payments: true,
      items: { include: { invoice: { select: { fullNumber: true, status: true } } } },
    },
  });

  if (!receipt) throw new Error(`No existe el recibo ${RECEIPT_NUMBER}`);

  // ---- Guard rails: sólo se repara lo que está en el estado esperado ----
  if (receipt.status !== 'CONFIRMED') {
    throw new Error(`El recibo está en estado ${receipt.status}; este script sólo repara recibos CONFIRMED`);
  }

  const bankPayments = receipt.payments.filter((p) => p.bankAccountId && p.paymentMethod !== 'ECHEQ' && !p.cashRegisterId);
  if (bankPayments.length === 0) {
    throw new Error('El recibo no tiene pagos bancarios que requieran movimiento. Revisar el caso a mano.');
  }

  const existingMovements = await prisma.bankMovement.count({ where: { receiptId: receipt.id } });

  console.log(`Empresa   : ${receipt.company.name}`);
  console.log(`Cliente   : ${receipt.customer.name}`);
  console.log(`Fecha     : ${receipt.date.toISOString().slice(0, 10)}`);
  console.log(`Total     : $${receipt.totalAmount.toString()}`);
  console.log(`Asiento   : ${receipt.journalEntryId ?? 'NULL (falta)'}`);
  console.log(`Movimientos bancarios existentes: ${existingMovements}`);
  console.log('\nFacturas imputadas (NO se tocan):');
  for (const item of receipt.items) {
    console.log(`  - ${item.invoice.fullNumber}  $${item.amount.toString()}  [${item.invoice.status}]`);
  }

  console.log('\nAcciones a realizar:');
  const plan: string[] = [];

  for (const p of bankPayments) {
    const account = await prisma.bankAccount.findUnique({
      where: { id: p.bankAccountId! },
      select: { id: true, bankName: true, accountNumber: true, balance: true },
    });
    if (!account) throw new Error(`La cuenta bancaria ${p.bankAccountId} del pago no existe`);

    if (existingMovements > 0) {
      plan.push(`  [SALTEA] El recibo ya tiene ${existingMovements} movimiento(s); no se crea otro`);
    } else {
      plan.push(
        `  [CREA]   BankMovement DEPOSIT $${p.amount.toString()} en ${account.bankName} (${account.accountNumber}) fecha ${receipt.date.toISOString().slice(0, 10)}`
      );
      plan.push(
        `  [AJUSTA] Saldo de ${account.bankName}: ${account.balance.toString()} + ${p.amount.toString()} (increment atómico)`
      );
    }
  }

  if (receipt.journalEntryId) {
    plan.push('  [SALTEA] El recibo ya tiene asiento contable');
  } else {
    plan.push('  [CREA]   Asiento contable del recibo (createJournalEntryForReceipt)');
  }

  console.log(plan.join('\n'));

  if (!APPLY) {
    console.log('\nDry-run terminado. Volvé a correrlo con --apply para aplicar.');
    await prisma.$disconnect();
    return;
  }

  // ---- Backup de las filas afectadas antes de escribir ----
  const affectedAccountIds = [...new Set(bankPayments.map((p) => p.bankAccountId!))];
  const backup = {
    takenAt: new Date().toISOString(),
    receipt: {
      id: receipt.id,
      fullNumber: receipt.fullNumber,
      status: receipt.status,
      journalEntryId: receipt.journalEntryId,
    },
    payments: receipt.payments.map((p) => ({
      id: p.id,
      paymentMethod: p.paymentMethod,
      amount: p.amount.toString(),
      bankAccountId: p.bankAccountId,
      cashRegisterId: p.cashRegisterId,
    })),
    bankAccounts: await prisma.bankAccount.findMany({
      where: { id: { in: affectedAccountIds } },
      select: { id: true, bankName: true, accountNumber: true, balance: true },
    }),
    bankMovementsBefore: await prisma.bankMovement.findMany({ where: { receiptId: receipt.id } }),
  };

  const backupPath = path.join(
    process.cwd(),
    `backup-${receipt.fullNumber}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  );
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2, ), 'utf-8');
  console.log(`\nBackup escrito en: ${backupPath}`);

  // ---- Reparación ----
  // La base puede estar en uso: la transacción se mantiene corta y el saldo se ajusta con un
  // increment atómico (igual que confirmReceipt), en vez de recalcular sobre cientos de filas
  // y pisar escrituras concurrentes. El timeout se amplía por la latencia contra el server remoto.
  const startedAt = Date.now();
  await prisma.$transaction(
    async (tx) => {
      if (existingMovements === 0) {
        for (const p of bankPayments) {
          await tx.bankMovement.create({
            data: {
              companyId: receipt.companyId,
              bankAccountId: p.bankAccountId!,
              type: 'DEPOSIT',
              amount: p.amount,
              date: receipt.date,
              description: `Cobro de ${receipt.fullNumber}`,
              reference: receipt.fullNumber,
              receiptId: receipt.id,
              reconciled: true,
              reconciledAt: new Date(),
              reconciledBy: receipt.confirmedBy ?? receipt.createdBy,
              createdBy: receipt.confirmedBy ?? receipt.createdBy,
            },
          });

          await tx.bankAccount.update({
            where: { id: p.bankAccountId! },
            data: { balance: { increment: p.amount } },
          });
        }
      }

      if (!receipt.journalEntryId) {
        const journalEntryId = await createJournalEntryForReceipt(receipt.id, receipt.companyId, tx);
        if (journalEntryId) {
          await tx.receipt.update({ where: { id: receipt.id }, data: { journalEntryId } });
          console.log(`Asiento contable creado: ${journalEntryId}`);
        } else {
          throw new Error('No se pudo crear el asiento contable (revisar configuración contable). Se revierte todo.');
        }
      }
    },
    { timeout: 60_000, maxWait: 20_000 }
  );
  console.log(`Transacción completada en ${Date.now() - startedAt} ms`);

  // ---- Verificación posterior ----
  console.log('\nVERIFICACIÓN POSTERIOR');
  const after = await prisma.receipt.findUnique({
    where: { id: receipt.id },
    select: {
      journalEntryId: true,
      journalEntry: { select: { number: true, status: true } },
    },
  });
  const movsAfter = await prisma.bankMovement.findMany({
    where: { receiptId: receipt.id },
    select: { type: true, amount: true, bankAccountId: true, date: true },
  });
  console.log(`  Movimientos bancarios: ${movsAfter.length}`);
  for (const m of movsAfter) {
    console.log(`    - ${m.type} $${m.amount.toString()} cuenta ${m.bankAccountId} fecha ${m.date.toISOString().slice(0, 10)}`);
  }
  console.log(
    `  Asiento contable: ${after?.journalEntryId ? `#${after.journalEntry?.number} (${after.journalEntry?.status})` : 'NULL'}`
  );

  for (const accountId of affectedAccountIds) {
    const account = await prisma.bankAccount.findUnique({
      where: { id: accountId },
      select: { bankName: true, balance: true },
    });
    const movs = await prisma.bankMovement.findMany({
      where: { bankAccountId: accountId },
      select: { type: true, amount: true },
    });
    const calculated = movs.reduce(
      (acc, m) => (INCOME_TYPES.includes(m.type) ? acc + Number(m.amount) : acc - Number(m.amount)),
      0
    );
    console.log(`  ${account?.bankName}: guardado ${account?.balance.toString()} / calculado ${calculated.toFixed(2)}`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
