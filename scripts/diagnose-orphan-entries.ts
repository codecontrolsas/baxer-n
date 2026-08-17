/**
 * DIAGNÓSTICO READ-ONLY: recibos sin journalEntryId que en realidad YA tienen su asiento creado,
 * sólo que sin el vínculo guardado. Evita generar asientos duplicados al reparar.
 *
 * Uso: npx tsx scripts/diagnose-orphan-entries.ts
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

  const sinVinculo = await prisma.receipt.findMany({
    where: { companyId: company.id, status: 'CONFIRMED', journalEntryId: null },
    select: { id: true, fullNumber: true, date: true, totalAmount: true },
    orderBy: { number: 'asc' },
  });

  console.log(`RECIBOS CONFIRMADOS SIN journalEntryId: ${sinVinculo.length}\n`);

  let conAsientoHuerfano = 0;
  let sinAsientoReal = 0;

  for (const r of sinVinculo) {
    // El generador describe el asiento como "Recibo de cobro R-000XX"
    const entries = await prisma.journalEntry.findMany({
      where: { companyId: company.id, description: { contains: r.fullNumber } },
      select: { id: true, number: true, date: true, status: true, description: true, lines: { select: { debit: true, credit: true } } },
    });

    if (entries.length > 0) {
      conAsientoHuerfano++;
      for (const e of entries) {
        const debit = e.lines.reduce((s, l) => s + Number(l.debit), 0);
        console.log(
          `  ${r.fullNumber}  $${r.totalAmount.toString()}  →  ASIENTO EXISTE #${e.number} (${e.date.toISOString().slice(0, 10)}, ${e.status}, debe $${debit.toFixed(2)}, ${e.lines.length} líneas) — falta sólo el vínculo`
        );
      }
    } else {
      sinAsientoReal++;
      console.log(`  ${r.fullNumber}  $${r.totalAmount.toString()}  →  sin asiento real, hay que generarlo`);
    }
  }

  console.log(`\nRESUMEN`);
  console.log(`  con asiento huérfano (sólo falta vincular): ${conAsientoHuerfano}`);
  console.log(`  sin asiento real (hay que generarlo)      : ${sinAsientoReal}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
