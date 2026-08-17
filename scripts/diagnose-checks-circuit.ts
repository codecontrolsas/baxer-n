/**
 * VERIFICACIÓN READ-ONLY del circuito contable de cheques de terceros:
 * saldo de "Valores a Depositar" contra los cheques efectivamente en cartera.
 *
 * Uso: npx tsx scripts/diagnose-checks-circuit.ts
 */
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const COMPANY_NAME = 'Codecontrol SAS';

async function main() {
  const connectionString = process.env.DATABASE_URL_PROD ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error('Falta DATABASE_URL_PROD / DATABASE_URL');

  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
      connectionTimeoutMillis: 30_000,
      statement_timeout: 120_000,
      query_timeout: 120_000,
    }),
  });

  const company = await prisma.company.findFirst({ where: { name: COMPANY_NAME }, select: { id: true } });
  if (!company) throw new Error('Empresa no encontrada');

  const account = await prisma.account.findFirst({
    where: { companyId: company.id, code: '1.1.1.6' },
    select: { id: true, code: true, name: true },
  });
  if (!account) throw new Error('No existe 1.1.1.6');

  const lines = await prisma.journalEntryLine.findMany({
    where: { accountId: account.id },
    select: {
      debit: true,
      credit: true,
      description: true,
      entry: { select: { number: true, date: true, description: true, status: true } },
    },
  });

  console.log(`MOVIMIENTOS CONTABLES DE ${account.code} ${account.name}`);
  let saldo = 0;
  for (const l of lines.sort((a, b) => a.entry.date.getTime() - b.entry.date.getTime())) {
    saldo += Number(l.debit) - Number(l.credit);
    console.log(
      `  #${String(l.entry.number).padEnd(5)} ${l.entry.date.toISOString().slice(0, 10)}  debe ${Number(l.debit).toFixed(2).padStart(13)}  haber ${Number(l.credit).toFixed(2).padStart(13)}  ${l.entry.description}`
    );
  }
  console.log(`  SALDO CONTABLE: ${saldo.toFixed(2)}`);

  const portfolio = await prisma.check.findMany({
    where: { companyId: company.id, type: 'THIRD_PARTY', status: 'PORTFOLIO' },
    select: { checkNumber: true, amount: true, bankName: true, dueDate: true },
  });
  const totalPortfolio = portfolio.reduce((s, c) => s + Number(c.amount), 0);
  console.log(`\nCHEQUES DE TERCEROS EN CARTERA: ${portfolio.length}`);
  for (const c of portfolio) {
    console.log(`  Nº${c.checkNumber} $${c.amount.toString()} ${c.bankName} vence ${c.dueDate.toISOString().slice(0, 10)}`);
  }
  console.log(`  TOTAL EN CARTERA: ${totalPortfolio.toFixed(2)}`);

  console.log(
    `\n  ¿Coincide el saldo contable con los cheques en cartera? ${Math.abs(saldo - totalPortfolio) < 0.01 ? 'SÍ' : `NO — diferencia ${(saldo - totalPortfolio).toFixed(2)}`}`
  );

  const deposited = await prisma.check.findMany({
    where: { companyId: company.id, type: 'THIRD_PARTY', status: 'DEPOSITED' },
    select: { checkNumber: true, amount: true, depositedAt: true, bankAccount: { select: { bankName: true } } },
  });
  console.log(`\nCHEQUES DEPOSITADOS: ${deposited.length}`);
  for (const c of deposited) {
    console.log(
      `  Nº${c.checkNumber} $${c.amount.toString()} → ${c.bankAccount?.bankName ?? '—'} el ${c.depositedAt?.toISOString().slice(0, 10) ?? '—'}`
    );
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
