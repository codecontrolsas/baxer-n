/**
 * Plantilla Excel para importación de Movimientos Bancarios
 *
 * Genera una plantilla Excel con instrucciones para que los usuarios
 * puedan cargar movimientos bancarios de forma masiva.
 */

import ExcelJS from 'exceljs';

/** Colores del tema */
const THEME = {
  primary: '374151',
  success: '10b981',
  headerBg: '6b7280',
  headerText: 'FFFFFF',
  instructionBg: 'dbeafe',
  exampleBg: 'fef3c7',
  border: 'e5e7eb',
};

/** Tipos válidos de movimiento bancario */
export const VALID_MOVEMENT_TYPES = [
  'DEPOSIT',
  'WITHDRAWAL',
  'TRANSFER_IN',
  'TRANSFER_OUT',
  'CHECK',
  'DEBIT',
  'FEE',
  'INTEREST',
] as const;

/**
 * Genera una plantilla Excel vacía para importar movimientos bancarios
 */
export async function generateBankMovementsTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema de Gestión';
  workbook.created = new Date();

  // Hoja 1: Plantilla para completar
  const dataSheet = workbook.addWorksheet('Movimientos', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  // Encabezados
  const headers = [
    'Fecha',
    'Tipo',
    'Monto',
    'Descripción',
    'Referencia (Opcional)',
    'N° Extracto (Opcional)',
  ];

  const headerRow = dataSheet.getRow(1);
  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    cell.font = {
      bold: true,
      color: { argb: THEME.headerText },
      size: 11,
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: THEME.headerBg },
    };
    cell.alignment = {
      horizontal: 'center',
      vertical: 'middle',
    };
    cell.border = {
      top: { style: 'thin', color: { argb: THEME.border } },
      bottom: { style: 'thin', color: { argb: THEME.border } },
      left: { style: 'thin', color: { argb: THEME.border } },
      right: { style: 'thin', color: { argb: THEME.border } },
    };
  });
  headerRow.height = 25;

  // Configurar anchos de columna
  dataSheet.getColumn(1).width = 15; // Fecha
  dataSheet.getColumn(2).width = 20; // Tipo
  dataSheet.getColumn(3).width = 15; // Monto
  dataSheet.getColumn(4).width = 40; // Descripción
  dataSheet.getColumn(5).width = 25; // Referencia
  dataSheet.getColumn(6).width = 20; // N° Extracto

  // Agregar filtros
  dataSheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: headers.length },
  };

  // Hoja 2: Instrucciones
  const instructionsSheet = workbook.addWorksheet('Instrucciones');

  let currentRow = 1;

  // Título
  instructionsSheet.mergeCells(currentRow, 1, currentRow, 2);
  const titleCell = instructionsSheet.getCell(currentRow, 1);
  titleCell.value = 'Instrucciones para Importar Movimientos Bancarios';
  titleCell.font = { bold: true, size: 16, color: { argb: THEME.primary } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  instructionsSheet.getRow(currentRow).height = 30;
  currentRow += 2;

  // Instrucciones generales
  const instructions = [
    {
      title: '1. Formato de Fecha',
      points: [
        'Use el formato DD/MM/YYYY (día/mes/año)',
        'Ejemplo: 15/03/2025 para el 15 de marzo de 2025',
        'También se acepta el formato de fecha de Excel (celda con formato fecha)',
        'IMPORTANTE: cargue la fecha real del movimiento, tal como figura en el extracto.',
        'No sume ni reste días para compensar: el sistema respeta la fecha del archivo.',
      ],
    },
    {
      title: '2. Tipos de Movimiento',
      points: [
        'DEPOSIT: Depósito (ingreso de dinero)',
        'WITHDRAWAL: Extracción (retiro de dinero)',
        'TRANSFER_IN: Transferencia recibida',
        'TRANSFER_OUT: Transferencia enviada',
        'CHECK: Cheque emitido',
        'DEBIT: Débito automático',
        'FEE: Comisión bancaria',
        'INTEREST: Interés acreditado',
      ],
    },
    {
      title: '3. Monto',
      points: [
        'Ingrese siempre un número positivo',
        'Use punto (.) como separador decimal',
        'Ejemplo: 1500.50 para mil quinientos con cincuenta centavos',
        'No incluya signos de moneda ($) ni separadores de miles',
      ],
    },
    {
      title: '4. Descripción',
      points: [
        'Campo obligatorio',
        'Ingrese una descripción clara del movimiento',
        'Máximo 500 caracteres',
      ],
    },
    {
      title: '5. Referencia (Opcional)',
      points: [
        'Número de comprobante, transferencia o referencia del movimiento',
        'Máximo 100 caracteres',
      ],
    },
    {
      title: '6. N° Extracto (Opcional)',
      points: [
        'Número de extracto bancario donde figura el movimiento',
        'Útil para conciliación posterior',
        'Máximo 50 caracteres',
      ],
    },
    {
      title: '7. Consideraciones Importantes',
      points: [
        'Los movimientos importados se crean como NO conciliados',
        'Luego podrá conciliarlos desde la vista de movimientos',
        'El saldo de la cuenta se actualiza automáticamente al importar',
        'Complete los datos en la hoja "Movimientos" (primera hoja)',
        'Revise la hoja "Ejemplo" para ver datos de muestra',
      ],
    },
  ];

  instructions.forEach((section) => {
    // Título de sección
    instructionsSheet.mergeCells(currentRow, 1, currentRow, 2);
    const sectionCell = instructionsSheet.getCell(currentRow, 1);
    sectionCell.value = section.title;
    sectionCell.font = { bold: true, size: 12, color: { argb: THEME.primary } };
    sectionCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: THEME.instructionBg },
    };
    sectionCell.alignment = { vertical: 'middle' };
    instructionsSheet.getRow(currentRow).height = 22;
    currentRow++;

    // Puntos
    section.points.forEach((point) => {
      instructionsSheet.mergeCells(currentRow, 1, currentRow, 2);
      const pointCell = instructionsSheet.getCell(currentRow, 1);
      pointCell.value = `  - ${point}`;
      pointCell.alignment = { wrapText: true, vertical: 'top' };
      instructionsSheet.getRow(currentRow).height = 20;
      currentRow++;
    });

    currentRow++;
  });

  // Configurar anchos
  instructionsSheet.getColumn(1).width = 80;
  instructionsSheet.getColumn(2).width = 20;

  // Hoja 3: Ejemplo
  const exampleSheet = workbook.addWorksheet('Ejemplo');

  const exampleHeaders = [...headers];
  const exampleHeaderRow = exampleSheet.getRow(1);
  exampleHeaders.forEach((header, index) => {
    const cell = exampleHeaderRow.getCell(index + 1);
    cell.value = header;
    cell.font = {
      bold: true,
      color: { argb: THEME.headerText },
      size: 11,
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: THEME.success },
    };
    cell.alignment = {
      horizontal: 'center',
      vertical: 'middle',
    };
  });
  exampleHeaderRow.height = 25;

  // Datos de ejemplo
  const exampleData = [
    ['01/02/2025', 'DEPOSIT', '150000.00', 'Cobro factura A-0001-00000123', 'TRF-2025-001', 'EXT-2025-02'],
    ['03/02/2025', 'WITHDRAWAL', '25000.00', 'Pago alquiler oficina febrero', 'OP-00012', 'EXT-2025-02'],
    ['05/02/2025', 'TRANSFER_IN', '85000.00', 'Transferencia desde Banco Nación', 'TRF-INT-045', ''],
    ['10/02/2025', 'DEBIT', '3500.00', 'Débito automático servicio internet', 'DEB-AUT-789', 'EXT-2025-02'],
    ['15/02/2025', 'CHECK', '45000.00', 'Pago proveedor Materiales SA', 'CH-0001234', ''],
    ['28/02/2025', 'FEE', '1200.00', 'Comisión mantenimiento cuenta', '', 'EXT-2025-02'],
    ['28/02/2025', 'INTEREST', '850.00', 'Intereses cuenta corriente', '', 'EXT-2025-02'],
  ];

  exampleData.forEach((rowData, index) => {
    const row = exampleSheet.getRow(index + 2);
    rowData.forEach((value, colIndex) => {
      const cell = row.getCell(colIndex + 1);
      cell.value = value;
      cell.alignment = { vertical: 'middle' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: THEME.exampleBg },
      };
    });
    row.height = 20;
  });

  // Configurar anchos
  exampleSheet.getColumn(1).width = 15;
  exampleSheet.getColumn(2).width = 20;
  exampleSheet.getColumn(3).width = 15;
  exampleSheet.getColumn(4).width = 40;
  exampleSheet.getColumn(5).width = 25;
  exampleSheet.getColumn(6).width = 20;

  // Generar buffer
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
