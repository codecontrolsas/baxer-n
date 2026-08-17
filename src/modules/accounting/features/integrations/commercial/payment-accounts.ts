/**
 * Resolución de la cuenta contable que corresponde a cada forma de pago de un recibo de cobro.
 *
 * Se mantiene aparte (sin dependencias de Prisma) para poder testearla de forma aislada.
 */

/** Datos del pago necesarios para decidir a qué cuenta imputar el debe */
export type ReceiptPaymentAccountInput = {
  paymentMethod: string;
  cashRegisterId: string | null;
  bankAccountId: string | null;
  /** Cuenta contable propia de la caja, si la tiene configurada */
  cashRegisterAccountId?: string | null;
  /** Cuenta contable propia de la cuenta bancaria, si la tiene configurada */
  bankAccountAccountId?: string | null;
};

/** Cuentas por defecto de la configuración contable de la empresa */
export type ReceiptAccountDefaults = {
  defaultCashAccountId: string | null;
  defaultBankAccountId: string | null;
  checksReceivedAccountId: string | null;
};

/**
 * Devuelve la cuenta a debitar por un cobro, o null si no se puede determinar.
 *
 * Los cheques y e-cheq se evalúan primero: van a "valores a depositar" y no a un banco, porque
 * el dinero todavía no está acreditado. El e-cheq tiene cuenta bancaria asignada (la de depósito),
 * pero recién impacta el banco cuando se cobra, con el asiento de depósito del cheque.
 */
export function resolveReceiptPaymentAccountId(
  payment: ReceiptPaymentAccountInput,
  defaults: ReceiptAccountDefaults
): string | null {
  if (payment.paymentMethod === 'CHECK' || payment.paymentMethod === 'ECHEQ') {
    return defaults.checksReceivedAccountId ?? null;
  }

  if (payment.cashRegisterId) {
    return payment.cashRegisterAccountId ?? defaults.defaultCashAccountId ?? null;
  }

  if (payment.bankAccountId) {
    return payment.bankAccountAccountId ?? defaults.defaultBankAccountId ?? null;
  }

  return null;
}
