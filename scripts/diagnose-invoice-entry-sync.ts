/**
 * VERIFICACIÓN READ-ONLY: la fecha de cada factura de compra coincide con la de su asiento.
 * Uso: npx tsx scripts/diagnose-invoice-entry-sync.ts
 */
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

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

  const desalineados = await prisma.$queryRaw<
    { full_number: string; factura: Date; asiento: Date; numero: number; status: string }[]
  >`
    SELECT pi.full_number, pi.issue_date AS factura, je.date AS asiento, je.number AS numero, je.status::text AS status
    FROM purchase_invoices pi
    JOIN journal_entries je ON je.id = pi.journal_entry_id
    WHERE pi.issue_date::date <> je.date::date
    ORDER BY pi.issue_date DESC
    LIMIT 20
  `;
  console.log(`FACTURAS CON FECHA DISTINTA A LA DE SU ASIENTO: ${desalineados.length}`);
  for (const d of desalineados) {
    console.log(
      `  ${d.full_number.padEnd(18)} factura ${d.factura.toISOString().slice(0, 10)}  asiento #${d.numero} ${d.asiento.toISOString().slice(0, 10)} [${d.status}]`
    );
  }

  const horas = await prisma.$queryRaw<{ hora: string; cantidad: bigint }[]>`
    SELECT to_char(issue_date, 'HH24:MI') AS hora, COUNT(*)::bigint AS cantidad
    FROM purchase_invoices GROUP BY 1 ORDER BY 2 DESC
  `;
  console.log('\nDISTRIBUCIÓN HORARIA DE purchase_invoices.issue_date (UTC)');
  for (const h of horas) console.log(`  ${h.hora} → ${h.cantidad}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
