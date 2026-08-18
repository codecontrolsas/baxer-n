import { describe, expect, it } from 'vitest';
import { excelCellToDateString, parseImportedDate } from './import-dates';

// Las aserciones usan el instante absoluto (ISO en UTC) para que el resultado no dependa
// del huso donde corra el test: en producción el servidor corre en UTC y la máquina de
// desarrollo en America/Argentina/Buenos_Aires, y ambos deben producir lo mismo.

describe('excelCellToDateString', () => {
  it('formatea un Date de ExcelJS sin retroceder un día', () => {
    // ExcelJS entrega las fechas del archivo como medianoche UTC
    const cell = new Date('2026-05-26T00:00:00.000Z');
    expect(excelCellToDateString(cell)).toBe('26/05/2026');
  });

  it('respeta el primer día del mes', () => {
    expect(excelCellToDateString(new Date('2026-06-01T00:00:00.000Z'))).toBe('01/06/2026');
  });

  it('devuelve los strings tal cual, sin tocarlos', () => {
    expect(excelCellToDateString('26/05/2026')).toBe('26/05/2026');
    expect(excelCellToDateString('  26/05/2026  ')).toBe('26/05/2026');
  });

  it('devuelve cadena vacía para celdas vacías', () => {
    expect(excelCellToDateString(null)).toBe('');
    expect(excelCellToDateString(undefined)).toBe('');
    expect(excelCellToDateString('')).toBe('');
  });
});

describe('parseImportedDate', () => {
  it('guarda la fecha como medianoche de Argentina, igual que el alta manual', () => {
    // El DatePicker del navegador construye medianoche local, que en UTC son las 03:00
    const result = parseImportedDate('26/05/2026');
    expect(result?.toISOString()).toBe('2026-05-26T03:00:00.000Z');
  });

  it('acepta el formato ISO', () => {
    expect(parseImportedDate('2026-05-26')?.toISOString()).toBe('2026-05-26T03:00:00.000Z');
  });

  it('acepta un Date de ExcelJS y no pierde el día', () => {
    const result = parseImportedDate(new Date('2026-05-26T00:00:00.000Z'));
    expect(result?.toISOString()).toBe('2026-05-26T03:00:00.000Z');
  });

  it('no retrocede el día en el primero de mes', () => {
    expect(parseImportedDate('01/06/2026')?.toISOString()).toBe('2026-06-01T03:00:00.000Z');
  });

  it('no retrocede el día en el primero de enero', () => {
    expect(parseImportedDate('01/01/2026')?.toISOString()).toBe('2026-01-01T03:00:00.000Z');
  });

  it('devuelve null si la fecha es inválida', () => {
    expect(parseImportedDate('32/13/2026')).toBeNull();
    expect(parseImportedDate('no es fecha')).toBeNull();
    expect(parseImportedDate('')).toBeNull();
    expect(parseImportedDate(null)).toBeNull();
  });

  it('rechaza formatos ambiguos no declarados', () => {
    // 26/05/26 con año de dos dígitos no está en la lista de formatos aceptados
    expect(parseImportedDate('26/05/26')).toBeNull();
  });
});
