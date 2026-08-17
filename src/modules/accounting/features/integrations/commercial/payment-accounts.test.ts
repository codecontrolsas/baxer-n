import { describe, expect, it } from 'vitest';
import { resolveReceiptPaymentAccountId } from './payment-accounts';

const DEFAULTS = {
  defaultCashAccountId: 'cuenta-caja-default',
  defaultBankAccountId: 'cuenta-banco-default',
  checksReceivedAccountId: 'cuenta-valores-a-depositar',
};

const basePayment = {
  paymentMethod: 'TRANSFER',
  cashRegisterId: null,
  bankAccountId: null,
  cashRegisterAccountId: null,
  bankAccountAccountId: null,
};

describe('resolveReceiptPaymentAccountId', () => {
  it('usa la cuenta contable propia de la caja cuando existe', () => {
    const result = resolveReceiptPaymentAccountId(
      { ...basePayment, paymentMethod: 'CASH', cashRegisterId: 'caja-1', cashRegisterAccountId: 'cuenta-caja-propia' },
      DEFAULTS
    );
    expect(result).toBe('cuenta-caja-propia');
  });

  it('cae en la caja por defecto si la caja no tiene cuenta propia', () => {
    const result = resolveReceiptPaymentAccountId(
      { ...basePayment, paymentMethod: 'CASH', cashRegisterId: 'caja-1' },
      DEFAULTS
    );
    expect(result).toBe('cuenta-caja-default');
  });

  it('usa la cuenta contable propia del banco cuando existe', () => {
    const result = resolveReceiptPaymentAccountId(
      { ...basePayment, bankAccountId: 'banco-1', bankAccountAccountId: 'cuenta-banco-propia' },
      DEFAULTS
    );
    expect(result).toBe('cuenta-banco-propia');
  });

  it('cae en el banco por defecto si el banco no tiene cuenta propia', () => {
    const result = resolveReceiptPaymentAccountId({ ...basePayment, bankAccountId: 'banco-1' }, DEFAULTS);
    expect(result).toBe('cuenta-banco-default');
  });

  it('imputa un cobro con CHEQUE a valores a depositar, no al banco', () => {
    const result = resolveReceiptPaymentAccountId({ ...basePayment, paymentMethod: 'CHECK' }, DEFAULTS);
    expect(result).toBe('cuenta-valores-a-depositar');
  });

  it('imputa un E-CHEQ a valores a depositar aunque tenga cuenta de depósito asignada', () => {
    // El e-cheq no acredita hasta que se cobra: no puede debitar el banco todavía
    const result = resolveReceiptPaymentAccountId(
      { ...basePayment, paymentMethod: 'ECHEQ', bankAccountId: 'banco-1', bankAccountAccountId: 'cuenta-banco-propia' },
      DEFAULTS
    );
    expect(result).toBe('cuenta-valores-a-depositar');
  });

  it('devuelve null si el cheque no tiene cuenta de valores a depositar configurada', () => {
    const result = resolveReceiptPaymentAccountId(
      { ...basePayment, paymentMethod: 'CHECK' },
      { ...DEFAULTS, checksReceivedAccountId: null }
    );
    expect(result).toBeNull();
  });

  it('devuelve null si el pago no tiene ni caja ni banco', () => {
    const result = resolveReceiptPaymentAccountId(basePayment, DEFAULTS);
    expect(result).toBeNull();
  });

  it('prioriza la caja sobre el banco si por datos viejos vinieran ambos', () => {
    const result = resolveReceiptPaymentAccountId(
      {
        ...basePayment,
        paymentMethod: 'CASH',
        cashRegisterId: 'caja-1',
        cashRegisterAccountId: 'cuenta-caja-propia',
        bankAccountId: 'banco-1',
        bankAccountAccountId: 'cuenta-banco-propia',
      },
      DEFAULTS
    );
    expect(result).toBe('cuenta-caja-propia');
  });
});
