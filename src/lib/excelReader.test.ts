import { describe, it, expect } from 'vitest';
import { ExcelMovimento, processarLinhaExcel, formatarData } from '@/lib/excelReader';

// utility to create a fake row array based on header indices
function makeRow(values: Record<number, unknown>): unknown[] {
  const row: unknown[] = [];
  Object.entries(values).forEach(([idx, val]) => {
    row[Number(idx)] = val;
  });
  return row;
}

describe('excelReader helpers', () => {
  it('should format dates in various formats', () => {
    expect(formatarData('01/02/2026')).toBe('2026-02-01');
    expect(formatarData('2026-03-05')).toBe('2026-03-05');
    expect(formatarData('44205')).toMatch(/^2021-/); // excel serial roughly
  });

  it('should parse a row without natureza column and derive natureza by value', () => {
    const headers = ['data mov.', 'n operação', 'data val.', 'descrição', 'montante', 'saldo'];
    const row = makeRow({
      0: '04/03/2026',
      1: '001',
      4: '-1000,50',
      3: 'Pagamento',
    });

    const mov = processarLinhaExcel(row, headers);
    expect(mov).not.toBeNull();
    if (mov) {
      expect(mov.data).toBe('2026-03-04');
      expect(mov.numMov).toBe('001');
      // negative amount should produce débito (D)
      expect(mov.natureza).toBe('D');
      expect(mov.valor).toBeCloseTo(-1000.5);
      expect(mov.descricao).toContain('Pagamento');
    }
  });

  it('should parse a positive value as credito when natureza missing', () => {
    const headers = ['data mov.', 'n operação', 'data val.', 'descrição', 'montante', 'saldo'];
    const row = makeRow({
      0: '04/03/2026',
      1: '002',
      4: '500,25',
      3: 'Recebimento',
    });
    const mov = processarLinhaExcel(row, headers);
    expect(mov?.natureza).toBe('C');
  });
});
