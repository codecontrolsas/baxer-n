import { describe, expect, it } from 'vitest';
import { paymentOrderPaymentSchema, receiptPaymentSchema } from './validators';

// Helpers para armar pagos válidos según el método, sin repetir campos en cada test
const basePayment = { amount: '1000.00' };

const cardFields = { cardId: '11111111-1111-4111-8111-111111111111' };

const checkFields = {
  checkNumber: '00012345',
  checkBankName: 'Santander',
  checkDueDate: new Date('2026-09-30'),
  checkDrawerName: 'Cliente SA',
};

const BANK_ACCOUNT_ID = '22222222-2222-4222-8222-222222222222';
const CASH_REGISTER_ID = '33333333-3333-4333-8333-333333333333';

// Devuelve los paths de los campos que fallaron, para asertar el error exacto
function errorPaths(result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) {
  if (result.success || !result.error) return [];
  return result.error.issues.map((issue) => issue.path.join('.'));
}

describe('receiptPaymentSchema - destino de fondos', () => {
  it('rechaza TRANSFER sin cuenta bancaria', () => {
    const result = receiptPaymentSchema.safeParse({
      ...basePayment,
      paymentMethod: 'TRANSFER',
    });

    expect(result.success).toBe(false);
    expect(errorPaths(result)).toContain('bankAccountId');
  });

  it('acepta TRANSFER con cuenta bancaria', () => {
    const result = receiptPaymentSchema.safeParse({
      ...basePayment,
      paymentMethod: 'TRANSFER',
      bankAccountId: BANK_ACCOUNT_ID,
    });

    expect(result.success).toBe(true);
  });

  it('rechaza DEBIT_CARD sin cuenta bancaria (el cobro acredita en el banco)', () => {
    const result = receiptPaymentSchema.safeParse({
      ...basePayment,
      ...cardFields,
      paymentMethod: 'DEBIT_CARD',
    });

    expect(result.success).toBe(false);
    expect(errorPaths(result)).toContain('bankAccountId');
  });

  it('rechaza CASH sin caja', () => {
    const result = receiptPaymentSchema.safeParse({
      ...basePayment,
      paymentMethod: 'CASH',
    });

    expect(result.success).toBe(false);
    expect(errorPaths(result)).toContain('cashRegisterId');
  });

  it('acepta CASH con caja', () => {
    const result = receiptPaymentSchema.safeParse({
      ...basePayment,
      paymentMethod: 'CASH',
      cashRegisterId: CASH_REGISTER_ID,
    });

    expect(result.success).toBe(true);
  });

  it('acepta CHECK sin cuenta bancaria (el cheque va a cartera)', () => {
    const result = receiptPaymentSchema.safeParse({
      ...basePayment,
      ...checkFields,
      paymentMethod: 'CHECK',
    });

    expect(result.success).toBe(true);
  });

  it('acepta CREDIT_CARD sin cuenta bancaria (acredita en la liquidación)', () => {
    const result = receiptPaymentSchema.safeParse({
      ...basePayment,
      ...cardFields,
      paymentMethod: 'CREDIT_CARD',
      installmentsCount: 3,
    });

    expect(result.success).toBe(true);
  });

  it('acepta ACCOUNT sin destino de fondos (no mueve dinero)', () => {
    const result = receiptPaymentSchema.safeParse({
      ...basePayment,
      paymentMethod: 'ACCOUNT',
    });

    expect(result.success).toBe(true);
  });

  it('sigue exigiendo cuenta de depósito para ECHEQ', () => {
    const result = receiptPaymentSchema.safeParse({
      ...basePayment,
      ...checkFields,
      paymentMethod: 'ECHEQ',
    });

    expect(result.success).toBe(false);
    expect(errorPaths(result)).toContain('bankAccountId');
  });
});

describe('paymentOrderPaymentSchema - destino de fondos', () => {
  it('rechaza TRANSFER sin cuenta bancaria', () => {
    const result = paymentOrderPaymentSchema.safeParse({
      ...basePayment,
      paymentMethod: 'TRANSFER',
    });

    expect(result.success).toBe(false);
    expect(errorPaths(result)).toContain('bankAccountId');
  });

  it('rechaza CASH sin caja', () => {
    const result = paymentOrderPaymentSchema.safeParse({
      ...basePayment,
      paymentMethod: 'CASH',
    });

    expect(result.success).toBe(false);
    expect(errorPaths(result)).toContain('cashRegisterId');
  });

  it('acepta DEBIT_CARD sin cuenta bancaria (puede ser tarjeta de un socio)', () => {
    const result = paymentOrderPaymentSchema.safeParse({
      ...basePayment,
      ...cardFields,
      paymentMethod: 'DEBIT_CARD',
    });

    expect(result.success).toBe(true);
  });

  it('acepta CHECK de tercero endosado sin cuenta bancaria', () => {
    const result = paymentOrderPaymentSchema.safeParse({
      ...basePayment,
      paymentMethod: 'CHECK',
      checkOwnership: 'THIRD_PARTY',
      endorsedCheckId: '44444444-4444-4444-8444-444444444444',
    });

    expect(result.success).toBe(true);
  });
});
