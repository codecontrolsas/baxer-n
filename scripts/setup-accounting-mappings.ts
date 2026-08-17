/**
 * CONFIGURACIÓN CONTABLE: crea las cuentas faltantes del plan y mapea las cuentas bancarias,
 * la caja y la cuenta de valores a depositar.
 *
 *   1. Crea 1.1.1.5 Banco Galicia y 1.1.1.6 Valores a Depositar (hijas de 1.1.1 Cajas y Bancos)
 *   2. Mapea cada cuenta bancaria a su cuenta contable (Santander, BPN, Galicia)
 *   3. Mapea la caja a 1.1.1.1 Caja en Pesos
 *   4. Configura checksReceivedAccountId con la cuenta de valores a depositar
 *
 * Es idempotente: si una cuenta ya existe o ya está mapeada, la saltea.
 *
 * Uso:
 *   npx tsx scripts/setup-accounting-mappings.ts           # dry-run
 *   npx tsx scripts/setup-accounting-mappings.ts --apply   # aplica
 */
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const COMPANY_NAME = 'Codecontrol SAS';
const APPLY = process.argv.includes('--apply');

/** Cuentas nuevas a crear bajo 1.1.1 */
const NEW_ACCOUNTS = [
  { code: '1.1.1.5', name: 'Banco Galicia' },
  { code: '1.1.1.6', name: 'Valores a Depositar' },
];

/** Mapeo cuenta bancaria (por número) → código contable */
const BANK_MAPPING: Record<string, string> = {
  '126-033216/1': '1.1.1.3', // Banco Santander
  '1085628-1': '1.1.1.4', // BPN
  '0003620-9 349-1': '1.1.1.5', // Banco Galicia
};

async function main() {
  const connectionString = process.env.DATABASE_URL_PROD ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error('Falta DATABASE_URL_PROD / DATABASE_URL');

  console.log(APPLY ? '### MODO APLICAR ###' : '### DRY-RUN — no se escribe nada ###');
  console.log(`Base: ${connectionString.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}\n`);

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

  const parent = await prisma.account.findFirst({
    where: { companyId: company.id, code: '1.1.1' },
    select: { id: true, type: true, nature: true, currency: true },
  });
  if (!parent) throw new Error('No existe la cuenta padre 1.1.1');

  const plan: string[] = [];

  // ---- 1. Cuentas nuevas ----
  for (const acc of NEW_ACCOUNTS) {
    const existing = await prisma.account.findFirst({
      where: { companyId: company.id, code: acc.code },
      select: { id: true, name: true },
    });
    plan.push(
      existing
        ? `  [SALTEA] ${acc.code} ya existe (${existing.name})`
        : `  [CREA]   ${acc.code} ${acc.name}  (${parent.type}/${parent.nature}, hija de 1.1.1)`
    );
  }

  // ---- 2. Mapeo de bancos ----
  const banks = await prisma.bankAccount.findMany({
    where: { companyId: company.id },
    select: { id: true, bankName: true, accountNumber: true, accountId: true },
  });
  for (const b of banks) {
    const code = BANK_MAPPING[b.accountNumber];
    if (!code) {
      plan.push(`  [AVISO]  ${b.bankName} (${b.accountNumber}) no está en el mapeo — se deja como está`);
      continue;
    }
    plan.push(
      b.accountId
        ? `  [SALTEA] ${b.bankName} ya tiene cuenta contable`
        : `  [MAPEA]  ${b.bankName} (${b.accountNumber}) → ${code}`
    );
  }

  // ---- 3. Caja ----
  const registers = await prisma.cashRegister.findMany({
    where: { companyId: company.id },
    select: { id: true, code: true, name: true, accountId: true },
  });
  for (const r of registers) {
    plan.push(
      r.accountId ? `  [SALTEA] Caja ${r.code} ya tiene cuenta contable` : `  [MAPEA]  Caja ${r.code} → 1.1.1.1 Caja en Pesos`
    );
  }

  // ---- 4. checksReceivedAccountId ----
  const settings = await prisma.accountingSettings.findUnique({
    where: { companyId: company.id },
    select: {
      id: true,
      checksReceivedAccountId: true,
      withholdingGananciasSufferedAccountId: true,
      withholdingIvaSufferedAccountId: true,
      withholdingIibbSufferedAccountId: true,
      withholdingSussSufferedAccountId: true,
    },
  });
  if (!settings) throw new Error('No hay configuración contable');
  plan.push(
    settings.checksReceivedAccountId
      ? '  [SALTEA] checksReceivedAccountId ya configurado'
      : '  [CONFIG] checksReceivedAccountId → 1.1.1.6 Valores a Depositar'
  );

  console.log('Acciones:\n' + plan.join('\n'));

  // ---- Chequeo informativo: cuentas de retenciones sufridas ----
  console.log('\nCUENTAS DE RETENCIONES SUFRIDAS (necesarias para asentar recibos con retención)');
  for (const [label, id] of [
    ['GANANCIAS', settings.withholdingGananciasSufferedAccountId],
    ['IVA', settings.withholdingIvaSufferedAccountId],
    ['IIBB', settings.withholdingIibbSufferedAccountId],
    ['SUSS', settings.withholdingSussSufferedAccountId],
  ] as const) {
    const acc = id ? await prisma.account.findUnique({ where: { id }, select: { code: true, name: true } }) : null;
    console.log(`  ${label.padEnd(10)}: ${acc ? `${acc.code} ${acc.name}` : '*** NULL — sin configurar ***'}`);
  }

  if (!APPLY) {
    console.log('\nDry-run terminado. Volvé a correrlo con --apply para aplicar.');
    await prisma.$disconnect();
    return;
  }

  await prisma.$transaction(
    async (tx) => {
      // 1. Crear cuentas
      for (const acc of NEW_ACCOUNTS) {
        const existing = await tx.account.findFirst({ where: { companyId: company.id, code: acc.code } });
        if (existing) continue;
        await tx.account.create({
          data: {
            companyId: company.id,
            code: acc.code,
            name: acc.name,
            type: parent.type,
            nature: parent.nature,
            parentId: parent.id,
            currency: parent.currency,
            isLeaf: true,
            isActive: true,
          },
        });
        console.log(`Creada ${acc.code} ${acc.name}`);
      }

      // El padre pasa a no ser imputable si tiene hijas
      await tx.account.update({ where: { id: parent.id }, data: { isLeaf: false } });

      // 2. Mapear bancos
      for (const b of banks) {
        if (b.accountId) continue;
        const code = BANK_MAPPING[b.accountNumber];
        if (!code) continue;
        const account = await tx.account.findFirst({ where: { companyId: company.id, code }, select: { id: true } });
        if (!account) throw new Error(`No se encontró la cuenta ${code} para ${b.bankName}`);
        await tx.bankAccount.update({ where: { id: b.id }, data: { accountId: account.id } });
        console.log(`Mapeado ${b.bankName} → ${code}`);
      }

      // 3. Mapear caja
      const cashAccount = await tx.account.findFirst({
        where: { companyId: company.id, code: '1.1.1.1' },
        select: { id: true },
      });
      for (const r of registers) {
        if (r.accountId || !cashAccount) continue;
        await tx.cashRegister.update({ where: { id: r.id }, data: { accountId: cashAccount.id } });
        console.log(`Mapeada caja ${r.code} → 1.1.1.1`);
      }

      // 4. checksReceivedAccountId
      if (!settings.checksReceivedAccountId) {
        const valores = await tx.account.findFirst({
          where: { companyId: company.id, code: '1.1.1.6' },
          select: { id: true },
        });
        if (!valores) throw new Error('No se encontró 1.1.1.6 Valores a Depositar');
        await tx.accountingSettings.update({
          where: { id: settings.id },
          data: { checksReceivedAccountId: valores.id },
        });
        console.log('Configurado checksReceivedAccountId → 1.1.1.6');
      }
    },
    { timeout: 60_000, maxWait: 20_000 }
  );

  // ---- Verificación ----
  console.log('\nVERIFICACIÓN');
  const banksAfter = await prisma.bankAccount.findMany({
    where: { companyId: company.id },
    select: { bankName: true, account: { select: { code: true, name: true } } },
    orderBy: { bankName: 'asc' },
  });
  for (const b of banksAfter) {
    console.log(`  ${b.bankName.padEnd(32)} → ${b.account ? `${b.account.code} ${b.account.name}` : '*** SIN MAPEAR ***'}`);
  }
  const regsAfter = await prisma.cashRegister.findMany({
    where: { companyId: company.id },
    select: { code: true, account: { select: { code: true, name: true } } },
  });
  for (const r of regsAfter) {
    console.log(`  Caja ${r.code.padEnd(27)} → ${r.account ? `${r.account.code} ${r.account.name}` : '*** SIN MAPEAR ***'}`);
  }
  const settingsAfter = await prisma.accountingSettings.findUnique({
    where: { companyId: company.id },
    select: { checksReceivedAccount: { select: { code: true, name: true } } },
  });
  console.log(
    `  checksReceivedAccountId          → ${settingsAfter?.checksReceivedAccount ? `${settingsAfter.checksReceivedAccount.code} ${settingsAfter.checksReceivedAccount.name}` : '*** NULL ***'}`
  );

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
