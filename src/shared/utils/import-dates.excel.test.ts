import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import { excelCellToDateString, parseImportedDate } from './import-dates';

/**
 * Verifica el contrato real con ExcelJS: escribe un .xlsx, lo vuelve a leer y comprueba que la
 * fecha que se guardaría es la que el usuario escribió en el archivo. Si una actualización de
 * ExcelJS cambia cómo entrega las fechas, estos tests lo detectan.
 */

type Cell = Date | string | number | null;

async function readFirstColumn(rows: Array<[Date | string, string]>): Promise<Cell[]> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Movimientos');
  sheet.addRow(['Fecha', 'Descripción']);
  for (const row of rows) sheet.addRow(row);

  const buffer = await workbook.xlsx.writeBuffer();

  const reloaded = new ExcelJS.Workbook();
  await reloaded.xlsx.load(buffer as ArrayBuffer);
  const reloadedSheet = reloaded.getWorksheet('Movimientos');
  if (!reloadedSheet) throw new Error('No se encontró la hoja');

  const values: Cell[] = [];
  reloadedSheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    values.push(row.getCell(1).value as Cell);
  });
  return values;
}

describe('ida y vuelta por un .xlsx real', () => {
  it('conserva el día de una celda con formato fecha', async () => {
    // new Date(2026, 4, 26) es el 26 de mayo en la hora local de quien crea el archivo
    const [cell] = await readFirstColumn([[new Date(2026, 4, 26), 'fecha como Date']]);

    expect(excelCellToDateString(cell)).toBe('26/05/2026');
    expect(parseImportedDate(cell)?.toISOString()).toBe('2026-05-26T03:00:00.000Z');
  });

  it('conserva el día de una celda de texto', async () => {
    const [cell] = await readFirstColumn([['26/05/2026', 'fecha como texto']]);

    expect(excelCellToDateString(cell)).toBe('26/05/2026');
    expect(parseImportedDate(cell)?.toISOString()).toBe('2026-05-26T03:00:00.000Z');
  });

  it('no retrocede al mes anterior en el primer día del mes', async () => {
    const [cell] = await readFirstColumn([[new Date(2026, 5, 1), 'primero de junio']]);

    expect(excelCellToDateString(cell)).toBe('01/06/2026');
    expect(parseImportedDate(cell)?.toISOString()).toBe('2026-06-01T03:00:00.000Z');
  });

  it('la fecha guardada se muestra igual en Argentina que en el archivo', async () => {
    const cells = await readFirstColumn([
      [new Date(2026, 0, 1), 'año nuevo'],
      [new Date(2026, 11, 31), 'fin de año'],
    ]);

    const shown = cells.map((cell) =>
      parseImportedDate(cell)?.toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })
    );
    expect(shown).toEqual(['1/1/2026', '31/12/2026']);
  });
});
