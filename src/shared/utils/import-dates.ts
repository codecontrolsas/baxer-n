import moment from 'moment';

/**
 * Fechas provenientes de archivos importados (Excel/CSV).
 *
 * El problema que resuelve este módulo: una fecha sin hora se guarda como DateTime, así que el
 * instante depende del huso en que se construya. El alta manual usa un DatePicker que corre en
 * el navegador y produce medianoche de Argentina (03:00 UTC), mientras que las importaciones se
 * procesan en el servidor, que corre en UTC y producía medianoche UTC. Esa diferencia de 3 horas
 * hace que la fecha importada se muestre un día antes en pantalla.
 *
 * Acá se fija el huso explícitamente para que ambas vías guarden el mismo instante,
 * sin depender de la zona horaria del proceso que ejecute el código.
 */

/** Offset de Argentina. Fijo: el país no aplica horario de verano desde 2009. */
const ARGENTINA_UTC_OFFSET = '-03:00';

/** Formatos aceptados en los archivos que suben los usuarios */
const ACCEPTED_DATE_FORMATS = ['DD/MM/YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY'] as const;

/** Valor crudo de una celda con fecha, tal como lo entrega ExcelJS */
export type ImportDateValue = Date | string | number | null | undefined;

/**
 * Convierte el valor de una celda a texto `DD/MM/YYYY`.
 *
 * ExcelJS entrega las celdas con formato de fecha como `Date` en medianoche UTC. Se las lee en
 * UTC a propósito: interpretarlas en el huso local restaría horas y adelantaría el día hacia atrás.
 */
export function excelCellToDateString(cellValue: ImportDateValue): string {
  if (cellValue === null || cellValue === undefined) return '';

  if (cellValue instanceof Date) {
    return moment.utc(cellValue).format('DD/MM/YYYY');
  }

  return String(cellValue).trim();
}

/**
 * Convierte una fecha importada al instante que corresponde a la medianoche de Argentina,
 * que es lo que guarda el resto del sistema. Devuelve null si la fecha no es válida.
 */
export function parseImportedDate(value: ImportDateValue): Date | null {
  const dateStr = excelCellToDateString(value);
  if (!dateStr) return null;

  const formats = ACCEPTED_DATE_FORMATS.map((format) => `${format} Z`);
  const parsed = moment(`${dateStr} ${ARGENTINA_UTC_OFFSET}`, formats, true);

  return parsed.isValid() ? parsed.toDate() : null;
}

/** Indica si el texto de una celda tiene alguno de los formatos de fecha aceptados */
export function isValidImportDate(value: ImportDateValue): boolean {
  return parseImportedDate(value) !== null;
}
