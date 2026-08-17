/**
 * REPARACIÓN de los recibos pendientes de Codecontrol SAS:
 *
 *   R-00056 — cobro en efectivo sin caja asignada: se le asigna CAJA-01, se crea el movimiento
 *             de caja, se ajusta el saldo esperado de la sesión abierta y se genera el asiento.
 *   R-00061 — cobro con cheque sin asiento: se genera el asiento (valores a depositar).
 *   R-00081 — cobro con 3 cheques sin asiento: se genera el asiento, se marca como depositado el
 *             cheque que ya tenía su movimiento bancario y se genera el asiento del depósito.
 *
 * Cada recibo se repara en su propia transacción. Es idempotente: lo ya hecho se saltea.
 *
 * Uso:
 *   npx tsx scripts/repair-pending-receipts.ts           # dry-run
 *   npx tsx scripts/repair-pending-receipts.ts --apply   # aplica
 */
import * as fs from 'fs';
import * as path from 'path';

if (process.env.DATABASE_URL_PROD) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_PROD;
}

const APPLY = process.argv.includes('--apply');
const COMPANY_NAME = 'Codecontrol SAS';

async function main() {
  const { prisma } = await import('@/shared/lib/prisma');
  const { createJournalEntryForReceipt } = await import('@/modules/accounting/features/integrations/commercial');
  const { createJournalEntryForCheckDeposit } = await import('@/modules/accounting/features/integrations/treasury');

  console.log(APPLY ? '### MODO APLICAR ###' : '### DRY-RUN — no se escribe nada ###');
  console.log(`Base: ${(process.env.DATABASE_URL ?? '').replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}\n`);

  const company = await prisma.company.findFirst({ where: { name: COMPANY_NAME }, select: { id: true } });
  if (!company) throw new Error('Empresa no encontrada');
  const companyId = company.id;

  const getReceipt = async (fullNumber: string) =>
    prisma.receipt.findFirst({
      where: { companyId, fullNumber },
      include: { payments: true, withholdings: true },
    });

  const r56 = await getReceipt('R-00056');
  const r61 = await getReceipt('R-00061');
  const r81 = await getReceipt('R-00081');
  if (!r56 || !r61 || !r81) throw new Error('Falta alguno de los recibos a reparar');

  const register = await prisma.cashRegister.findFirst({
    where: { companyId, code: 'CAJA-01' },
    select: { id: true, code: true },
  });
  if (!register) throw new Error('No existe la caja CAJA-01');

  const session = await prisma.cashRegisterSession.findFirst({
    where: { cashRegisterId: register.id, status: 'OPEN' },
    select: { id: true, expectedBalance: true, openedAt: true },
  });
  if (!session) throw new Error('No hay sesión abierta en CAJA-01');

  const cashPayment = r56.payments[0];
  const checkPaymentWithBank = r81.payments.find((p) => p.bankAccountId);
  const depositMovement = await prisma.bankMovement.findFirst({
    where: { receiptId: r81.id },
    select: { id: true, amount: true, date: true, bankAccountId: true, type: true },
  });
  const checkToDeposit = checkPaymentWithBank
    ? await prisma.check.findFirst({
        where: { receiptPaymentId: checkPaymentWithBank.id },
        select: { id: true, checkNumber: true, status: true, amount: true, bankAccountId: true, depositedAt: true },
      })
    : null;

  // ---- Plan ----
  console.log('PLAN');
  console.log(`  R-00056 ($${r56.totalAmount.toString()}, efectivo)`);
  console.log(
    `    ${cashPayment.cashRegisterId ? '[SALTEA] ya tiene caja' : `[ASIGNA] caja ${register.code} al pago de $${cashPayment.amount.toString()}`}`
  );
  const existingCashMovements = await prisma.cashMovement.count({
    where: { cashRegisterId: register.id, reference: r56.fullNumber },
  });
  console.log(
    `    ${existingCashMovements > 0 ? '[SALTEA] ya tiene movimiento de caja' : `[CREA]   movimiento de caja INCOME $${cashPayment.amount.toString()} (${r56.date.toISOString().slice(0, 10)})`}`
  );
  console.log(
    `    ${existingCashMovements > 0 ? '[SALTEA] saldo ya ajustado' : `[AJUSTA] saldo esperado de la sesión: ${session.expectedBalance.toString()} + ${cashPayment.amount.toString()}`}`
  );
  console.log(`    ${r56.journalEntryId ? '[SALTEA] ya tiene asiento' : '[CREA]   asiento contable'}`);

  console.log(`\n  R-00061 ($${r61.totalAmount.toString()}, cheque)`);
  console.log(`    ${r61.journalEntryId ? '[SALTEA] ya tiene asiento' : '[CREA]   asiento contable (valores a depositar)'}`);

  console.log(`\n  R-00081 ($${r81.totalAmount.toString()}, 3 cheques)`);
  console.log(`    ${r81.journalEntryId ? '[SALTEA] ya tiene asiento' : '[CREA]   asiento contable (valores a depositar)'}`);
  if (checkToDeposit && depositMovement) {
    console.log(
      `    ${checkToDeposit.status === 'DEPOSITED' ? '[SALTEA] cheque ya depositado' : `[MARCA]  cheque Nº${checkToDeposit.checkNumber} ($${checkToDeposit.amount.toString()}) como DEPOSITED en la cuenta del movimiento ${depositMovement.type} del ${depositMovement.date.toISOString().slice(0, 10)}`}`
    );
    console.log(`    [CREA]   asiento del depósito del cheque (banco contra valores a depositar)`);
  } else {
    console.log('    [AVISO]  no se encontró el cheque o el movimiento bancario asociado');
  }

  if (!APPLY) {
    console.log('\nDry-run terminado. Volvé a correrlo con --apply para aplicar.');
    await prisma.$disconnect();
    return;
  }

  // ---- Backup ----
  const backup = {
    takenAt: new Date().toISOString(),
    receipts: [r56, r61, r81].map((r) => ({
      id: r.id,
      fullNumber: r.fullNumber,
      journalEntryId: r.journalEntryId,
      payments: r.payments.map((p) => ({
        id: p.id,
        paymentMethod: p.paymentMethod,
        amount: p.amount.toString(),
        cashRegisterId: p.cashRegisterId,
        bankAccountId: p.bankAccountId,
      })),
    })),
    session: { id: session.id, expectedBalance: session.expectedBalance.toString() },
    check: checkToDeposit
      ? { ...checkToDeposit, amount: checkToDeposit.amount.toString() }
      : null,
  };
  const backupPath = path.join(process.cwd(), `backup-pending-receipts-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2), 'utf-8');
  console.log(`\nBackup escrito en: ${backupPath}\n`);

  const TX_OPTS = { timeout: 60_000, maxWait: 20_000 } as const;

  // ---- R-00056 ----
  await prisma.$transaction(async (tx) => {
    if (!cashPayment.cashRegisterId) {
      await tx.receiptPayment.update({ where: { id: cashPayment.id }, data: { cashRegisterId: register.id } });
      console.log('R-00056: caja asignada al pago');
    }

    if (existingCashMovements === 0) {
      await tx.cashMovement.create({
        data: {
          companyId,
          cashRegisterId: register.id,
          sessionId: session.id,
          type: 'INCOME',
          amount: cashPayment.amount,
          date: r56.date,
          description: `Cobro de ${r56.fullNumber}`,
          reference: r56.fullNumber,
          createdBy: r56.confirmedBy ?? r56.createdBy,
        },
      });
      await tx.cashRegisterSession.update({
        where: { id: session.id },
        data: { expectedBalance: { increment: cashPayment.amount } },
      });
      console.log('R-00056: movimiento de caja creado y saldo esperado ajustado');
    }

    if (!r56.journalEntryId) {
      const entryId = await createJournalEntryForReceipt(r56.id, companyId, tx);
      if (!entryId) throw new Error('R-00056: no se pudo generar el asiento');
      await tx.receipt.update({ where: { id: r56.id }, data: { journalEntryId: entryId } });
      console.log(`R-00056: asiento creado ${entryId}`);
    }
  }, TX_OPTS);

  // ---- R-00061 ----
  await prisma.$transaction(async (tx) => {
    if (!r61.journalEntryId) {
      const entryId = await createJournalEntryForReceipt(r61.id, companyId, tx);
      if (!entryId) throw new Error('R-00061: no se pudo generar el asiento');
      await tx.receipt.update({ where: { id: r61.id }, data: { journalEntryId: entryId } });
      console.log(`R-00061: asiento creado ${entryId}`);
    }
  }, TX_OPTS);

  // ---- R-00081 ----
  await prisma.$transaction(async (tx) => {
    if (!r81.journalEntryId) {
      const entryId = await createJournalEntryForReceipt(r81.id, companyId, tx);
      if (!entryId) throw new Error('R-00081: no se pudo generar el asiento');
      await tx.receipt.update({ where: { id: r81.id }, data: { journalEntryId: entryId } });
      console.log(`R-00081: asiento del recibo creado ${entryId}`);
    }

    if (checkToDeposit && depositMovement && checkToDeposit.status !== 'DEPOSITED') {
      await tx.check.update({
        where: { id: checkToDeposit.id },
        data: {
          status: 'DEPOSITED',
          bankAccountId: depositMovement.bankAccountId,
          bankMovementId: depositMovement.id,
          depositedAt: depositMovement.date,
        },
      });
      console.log(`R-00081: cheque Nº${checkToDeposit.checkNumber} marcado como DEPOSITED`);

      const depositEntryId = await createJournalEntryForCheckDeposit(checkToDeposit.id, companyId, tx);
      if (!depositEntryId) throw new Error('R-00081: no se pudo generar el asiento del depósito del cheque');
      console.log(`R-00081: asiento del depósito creado ${depositEntryId}`);
    }
  }, TX_OPTS);

  // ---- Verificación ----
  console.log('\nVERIFICACIÓN');
  for (const num of ['R-00056', 'R-00061', 'R-00081']) {
    const r = await prisma.receipt.findFirst({
      where: { companyId, fullNumber: num },
      select: {
        totalAmount: true,
        journalEntry: {
          select: { number: true, status: true, lines: { select: { debit: true, credit: true, account: { select: { code: true, name: true } } } } },
        },
      },
    });
    console.log(`\n  ${num}  $${r?.totalAmount.toString()}`);
    if (!r?.journalEntry) {
      console.log('    *** SIN ASIENTO ***');
      continue;
    }
    console.log(`    asiento #${r.journalEntry.number} [${r.journalEntry.status}]`);
    let d = 0;
    let c = 0;
    for (const l of r.journalEntry.lines) {
      d += Number(l.debit);
      c += Number(l.credit);
      console.log(`      ${l.account.code.padEnd(10)} ${l.account.name.padEnd(30).slice(0, 30)} debe ${Number(l.debit).toFixed(2).padStart(13)} haber ${Number(l.credit).toFixed(2).padStart(13)}`);
    }
    console.log(`      balanceado: ${Math.abs(d - c) < 0.01 ? 'SÍ' : '*** NO ***'}`);
  }

  const checkAfter = checkToDeposit
    ? await prisma.check.findUnique({
        where: { id: checkToDeposit.id },
        select: { checkNumber: true, status: true, depositedAt: true, bankAccount: { select: { bankName: true } } },
      })
    : null;
  if (checkAfter) {
    console.log(
      `\n  Cheque Nº${checkAfter.checkNumber}: ${checkAfter.status} en ${checkAfter.bankAccount?.bankName ?? '—'} el ${checkAfter.depositedAt?.toISOString().slice(0, 10) ?? '—'}`
    );
  }

  const sessionAfter = await prisma.cashRegisterSession.findUnique({
    where: { id: session.id },
    select: { expectedBalance: true },
  });
  console.log(`  Saldo esperado de CAJA-01: ${sessionAfter?.expectedBalance.toString()}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
