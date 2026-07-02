import { describe, it, expect } from 'vitest';
import { MODEL_CHART_OF_ACCOUNTS } from './model-chart-of-accounts';
import { getParentCode } from '../../../shared/utils/account-code';

describe('MODEL_CHART_OF_ACCOUNTS', () => {
  const byCode = new Map(MODEL_CHART_OF_ACCOUNTS.map((a) => [a.code, a]));

  it('no incluye la raíz de Resultados 4.0.0 (mezcla tipos)', () => {
    expect(byCode.has('4.0.0/00/00')).toBe(false);
  });

  it('las únicas cuentas con padre derivado ausente son las ramas de Resultados', () => {
    // Al omitir 4.0.0, las cuentas 4.1.0 y 4.2.0 quedan con padre derivado (4.0.0)
    // inexistente y se tratan como raíces. No debe haber otras "huérfanas".
    const orphans = MODEL_CHART_OF_ACCOUNTS.filter((account) => {
      const parentCode = getParentCode(account.code);
      return parentCode !== null && !byCode.has(parentCode);
    }).map((a) => a.code);

    expect(orphans.sort()).toEqual(['4.1.0/00/00', '4.2.0/00/00']);
  });

  it('padre e hija siempre comparten el mismo tipo (regla TSK-376)', () => {
    for (const account of MODEL_CHART_OF_ACCOUNTS) {
      const parentCode = getParentCode(account.code);
      const parent = parentCode ? byCode.get(parentCode) : undefined;
      if (parent) {
        expect(parent.type).toBe(account.type);
      }
    }
  });

  it('mapea el tipo según el prefijo del código', () => {
    for (const account of MODEL_CHART_OF_ACCOUNTS) {
      if (account.code.startsWith('1')) expect(account.type).toBe('ASSET');
      else if (account.code.startsWith('2')) expect(account.type).toBe('LIABILITY');
      else if (account.code.startsWith('3')) expect(account.type).toBe('EQUITY');
      else if (account.code.startsWith('4.1')) expect(account.type).toBe('REVENUE');
      else if (account.code.startsWith('4.2')) expect(account.type).toBe('EXPENSE');
      else if (account.code.startsWith('6')) expect(account.type).toBe('EXPENSE');
    }
  });

  it('RECPAM (6.0.0) es EXPENSE e imputable', () => {
    const recpam = byCode.get('6.0.0/00/00');
    expect(recpam).toBeDefined();
    expect(recpam?.type).toBe('EXPENSE');
    expect(recpam?.isLeaf).toBe(true);
  });

  it('no hay códigos duplicados', () => {
    expect(byCode.size).toBe(MODEL_CHART_OF_ACCOUNTS.length);
  });
});
