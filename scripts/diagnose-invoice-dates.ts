/**
 * DIAGNÓSTICO READ-ONLY del desfase de fecha en facturas de compra importadas de AFIP.
 * Muestra qué campos están afectados y si sus asientos contables acompañan el desfase.
 *
 * Uso: npx tsx scripts/diagnose-invoice-dates.ts
 */
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const AR = { timeZone: 'America/Argentina/Buenos_Aires' } as const;

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

  const campos = await prisma.$queryRaw<{ campo: string; afectados: bigint; total: bigint }[]>`
    SELECT 'issue_date' AS campo,
           COUNT(*) FILTER (WHERE issue_date::time = '00:00:00')::bigint AS afectados,
           COUNT(*)::bigint AS total
    FROM purchase_invoices
    UNION ALL
    SELECT 'due_date',
           COUNT(*) FILTER (WHERE due_date::time = '00:00:00')::bigint,
           COUNT(*) FILTER (WHERE due_date IS NOT NULL)::bigint
    FROM purchase_invoices
  `;
  console.log('CAMPOS DE FECHA EN purchase_invoices');
  for (const c of campos) {
    console.log(`  ${c.campo.padEnd(12)} ${String(c.afectados).padStart(4)} afectados de ${c.total}`);
  }

  // ¿Los asientos de esas facturas comparten el desfase?
  const asientos = await prisma.$queryRaw<
    { estado: string; cantidad: bigint; a_medianoche: bigint }[]
  >`
    SELECT je.status::text AS estado,
           COUNT(*)::bigint AS cantidad,
           COUNT(*) FILTER (WHERE je.date::time = '00:00:00')::bigint AS a_medianoche
    FROM purchase_invoices pi
    JOIN journal_entries je ON je.id = pi.journal_entry_id
    WHERE pi.issue_date::time = '00:00:00'
    GROUP BY 1
  `;
  console.log('\nASIENTOS DE LAS FACTURAS AFECTADAS');
  if (asientos.length === 0) console.log('  (ninguna de las afectadas tiene asiento)');
  for (const a of asientos) {
    console.log(`  ${a.estado.padEnd(10)} ${a.cantidad} asientos, ${a.a_medianoche} de ellos a medianoche UTC`);
  }

  console.log('\nMUESTRA: cómo se ven hoy y cómo se verían corregidas');
  const muestra = await prisma.$queryRaw<
    { full_number: string; issue_date: Date; due_date: Date | null; proveedor: string }[]
  >`
    SELECT pi.full_number, pi.issue_date, pi.due_date, s.business_name AS proveedor
    FROM purchase_invoices pi
    JOIN suppliers s ON s.id = pi.supplier_id
    WHERE pi.issue_date::time = '00:00:00'
    ORDER BY pi.issue_date DESC
    LIMIT 8
  `;
  for (const m of muestra) {
    const hoy = m.issue_date.toLocaleDateString('es-AR', AR);
    const corregida = new Date(m.issue_date.getTime() + 3 * 3600 * 1000).toLocaleDateString('es-AR', AR);
    console.log(
      `  ${m.full_number.padEnd(18)} ${m.proveedor.slice(0, 22).padEnd(24)} se ve ${hoy.padStart(10)}  →  pasaría a ${corregida}`
    );
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
