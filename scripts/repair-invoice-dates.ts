/**
 * REPARACIÓN del desfase de un día en las fechas de facturas de compra importadas de AFIP.
 *
 * Las importaciones guardaban la fecha a medianoche UTC en vez de medianoche de Argentina, así
 * que en pantalla se veían un día antes. Se le suman 3 horas para dejarlas en la misma
 * convención que el resto del sistema (03:00 UTC), sin alterar el día real del comprobante.
 *
 * Corrige también los asientos contables de esas facturas, para que no queden con fechas
 * distintas a las del comprobante. Sólo toca asientos en DRAFT: los POSTED son inmutables.
 *
 * Es idempotente: una vez corregidas, ya no cumplen la condición de medianoche UTC.
 *
 * Uso:
 *   npx tsx scripts/repair-invoice-dates.ts           # dry-run
 *   npx tsx scripts/repair-invoice-dates.ts --apply   # aplica
 */
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const APPLY = process.argv.includes('--apply');
const AR = { timeZone: 'America/Argentina/Buenos_Aires' } as const;

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

  // Estado previo
  const facturas = await prisma.$queryRaw<{ id: string; full_number: string; issue_date: Date }[]>`
    SELECT id, full_number, issue_date
    FROM purchase_invoices
    WHERE issue_date::time = '00:00:00'
    ORDER BY issue_date
  `;
  const asientos = await prisma.$queryRaw<{ id: string; number: number; date: Date; status: string }[]>`
    SELECT je.id, je.number, je.date, je.status::text AS status
    FROM purchase_invoices pi
    JOIN journal_entries je ON je.id = pi.journal_entry_id
    WHERE pi.issue_date::time = '00:00:00' AND je.date::time = '00:00:00'
    ORDER BY je.date
  `;

  const asientosDraft = asientos.filter((a) => a.status === 'DRAFT');
  const asientosBloqueados = asientos.filter((a) => a.status !== 'DRAFT');

  console.log(`Facturas de compra a corregir : ${facturas.length}`);
  console.log(`Asientos DRAFT a corregir     : ${asientosDraft.length}`);
  if (asientosBloqueados.length > 0) {
    console.log(`Asientos NO modificables      : ${asientosBloqueados.length} (POSTED/REVERSED, se dejan como están)`);
    for (const a of asientosBloqueados) console.log(`    #${a.number} [${a.status}] ${a.date.toISOString().slice(0, 10)}`);
  }

  if (facturas.length === 0) {
    console.log('\nNo hay nada que corregir.');
    await prisma.$disconnect();
    return;
  }

  const primera = facturas[0];
  const ultima = facturas[facturas.length - 1];
  console.log(`\nRango de fechas afectado: ${primera.issue_date.toISOString().slice(0, 10)} → ${ultima.issue_date.toISOString().slice(0, 10)}`);
  console.log('\nEjemplos (se suman 3 horas, el día pasa a mostrarse correctamente):');
  for (const f of facturas.slice(-5)) {
    const antes = f.issue_date.toLocaleDateString('es-AR', AR);
    const despues = new Date(f.issue_date.getTime() + 3 * 3600 * 1000).toLocaleDateString('es-AR', AR);
    console.log(`  ${f.full_number.padEnd(18)} ${antes.padStart(10)} → ${despues}`);
  }

  if (!APPLY) {
    console.log('\nDry-run terminado. Volvé a correrlo con --apply para aplicar.');
    await prisma.$disconnect();
    return;
  }

  // Backup del estado previo
  const backup = {
    takenAt: new Date().toISOString(),
    nota: 'issue_date de facturas de compra y date de sus asientos, antes de sumarles 3 horas',
    facturas: facturas.map((f) => ({ id: f.id, fullNumber: f.full_number, issueDate: f.issue_date.toISOString() })),
    asientos: asientosDraft.map((a) => ({ id: a.id, number: a.number, date: a.date.toISOString() })),
  };
  const backupDir = path.join(process.cwd(), 'backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `backup-invoice-dates-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2), 'utf-8');
  console.log(`\nBackup escrito en: ${backupPath}`);

  await prisma.$transaction(
    async (tx) => {
      const asientosActualizados = await tx.$executeRaw`
        UPDATE journal_entries
        SET date = date + INTERVAL '3 hours'
        WHERE status = 'DRAFT'
          AND date::time = '00:00:00'
          AND id IN (
            SELECT journal_entry_id FROM purchase_invoices
            WHERE issue_date::time = '00:00:00' AND journal_entry_id IS NOT NULL
          )
      `;
      console.log(`Asientos actualizados: ${asientosActualizados}`);

      const facturasActualizadas = await tx.$executeRaw`
        UPDATE purchase_invoices
        SET issue_date = issue_date + INTERVAL '3 hours'
        WHERE issue_date::time = '00:00:00'
      `;
      console.log(`Facturas actualizadas: ${facturasActualizadas}`);
    },
    { timeout: 120_000, maxWait: 20_000 }
  );

  // Verificación
  const restantes = await prisma.$queryRaw<{ cantidad: bigint }[]>`
    SELECT COUNT(*)::bigint AS cantidad FROM purchase_invoices WHERE issue_date::time = '00:00:00'
  `;
  console.log(`\nVERIFICACIÓN`);
  console.log(`  Facturas que siguen a medianoche UTC: ${restantes[0]?.cantidad}`);

  const muestra = await prisma.$queryRaw<{ full_number: string; issue_date: Date }[]>`
    SELECT full_number, issue_date FROM purchase_invoices
    WHERE issue_date::time = '03:00:00'
    ORDER BY issue_date DESC LIMIT 5
  `;
  console.log('  Últimas corregidas:');
  for (const m of muestra) {
    console.log(`    ${m.full_number.padEnd(18)} ahora se ve ${m.issue_date.toLocaleDateString('es-AR', AR)}`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
