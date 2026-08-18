/**
 * DIAGNÓSTICO READ-ONLY del desfase de un día en fechas importadas.
 *
 * Las fechas cargadas por importación quedaron a medianoche UTC, mientras que el resto del
 * sistema guarda medianoche de Argentina (03:00 UTC). En pantalla, las primeras se ven un día
 * antes. Este script cuantifica cuántos registros están afectados y en qué tablas.
 *
 * Uso: npx tsx scripts/diagnose-movement-dates.ts
 */
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

async function main() {
  const connectionString = process.env.DATABASE_URL_PROD ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error('Falta DATABASE_URL_PROD / DATABASE_URL');
  console.log(`Base: ${connectionString.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}\n`);

  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
      connectionTimeoutMillis: 30_000,
      statement_timeout: 120_000,
      query_timeout: 120_000,
    }),
  });

  // Movimientos bancarios a medianoche UTC, separando los que heredan la fecha de un documento
  const rows = await prisma.$queryRaw<
    { origen: string; cantidad: bigint; desde: Date | null; hasta: Date | null }[]
  >`
    SELECT
      CASE
        WHEN receipt_id IS NOT NULL THEN 'de recibo'
        WHEN payment_order_id IS NOT NULL THEN 'de orden de pago'
        ELSE 'carga directa o importación'
      END AS origen,
      COUNT(*)::bigint AS cantidad,
      MIN(date) AS desde,
      MAX(date) AS hasta
    FROM bank_movements
    WHERE date::time = '00:00:00'
    GROUP BY 1
    ORDER BY 2 DESC
  `;

  console.log('MOVIMIENTOS BANCARIOS GUARDADOS A MEDIANOCHE UTC (se ven un día antes)');
  let total = 0n;
  for (const r of rows) {
    total += r.cantidad;
    console.log(
      `  ${r.origen.padEnd(30)} ${String(r.cantidad).padStart(5)}   ${r.desde?.toISOString().slice(0, 10)} → ${r.hasta?.toISOString().slice(0, 10)}`
    );
  }
  console.log(`  TOTAL AFECTADOS: ${total}`);

  const ok = await prisma.$queryRaw<{ cantidad: bigint }[]>`
    SELECT COUNT(*)::bigint AS cantidad FROM bank_movements WHERE date::time = '03:00:00'
  `;
  console.log(`  (correctos, a 03:00 UTC: ${ok[0]?.cantidad})`);

  // Otras tablas que reciben fechas por importación
  const tablas: Array<[string, string, string]> = [
    ['facturas de compra (AFIP)', 'purchase_invoices', 'issue_date'],
    ['facturas de venta', 'sales_invoices', 'issue_date'],
    ['recibos', 'receipts', 'date'],
    ['órdenes de pago', 'payment_orders', 'date'],
  ];
  console.log('\nOTRAS TABLAS CON FECHAS A MEDIANOCHE UTC');
  for (const [label, tabla, columna] of tablas) {
    const r = await prisma.$queryRawUnsafe<{ afectados: bigint; total: bigint }[]>(
      `SELECT COUNT(*) FILTER (WHERE ${columna}::time = '00:00:00')::bigint AS afectados, COUNT(*)::bigint AS total FROM ${tabla}`
    );
    console.log(`  ${label.padEnd(28)} ${String(r[0]?.afectados).padStart(5)} de ${r[0]?.total}`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
