/**
 * Tests for SWIFT generation
 */

import { describe, it, expect } from 'vitest';
import {
  findTargetAccount,
  determineSign,
  generateSwiftContent,
} from '@/lib/swift';
import { Movement, Parameters, Mapping } from '@/types';

describe('findTargetAccount', () => {
  const mappings: Mapping[] = [
    {
      id: '1',
      companyId: 'DEMO',
      sourceAccount: 'ACC001',
      targetAccount: 'TARGET001',
      active: true,
      priority: 1,
      matchType: 'exact',
    },
    {
      id: '2',
      companyId: 'DEMO',
      sourceAccount: 'SUPPLIER',
      targetAccount: 'TARGET_SUPPLIER',
      active: true,
      priority: 2,
      matchType: 'startsWith',
    },
  ];

  it('should find exact match', () => {
    const result = findTargetAccount('ACC001', mappings);
    expect(result).toBe('TARGET001');
  });

  it('should find startsWith match', () => {
    const result = findTargetAccount('SUPPLIER_001', mappings);
    expect(result).toBe('TARGET_SUPPLIER');
  });

  it('should return default account if no match', () => {
    const result = findTargetAccount('UNKNOWN', mappings, 'DEFAULT_TARGET');
    expect(result).toBe('DEFAULT_TARGET');
  });

  it('should return null if no match and no default', () => {
    const result = findTargetAccount('UNKNOWN', mappings);
    expect(result).toBeNull();
  });

  it('should respect priority order', () => {
    const multiMappings: Mapping[] = [
      {
        id: '1',
        companyId: 'DEMO',
        sourceAccount: 'SUP',
        targetAccount: 'TARGET1',
        active: true,
        priority: 2,
        matchType: 'startsWith',
      },
      {
        id: '2',
        companyId: 'DEMO',
        sourceAccount: 'SUPPLIER',
        targetAccount: 'TARGET2',
        active: true,
        priority: 1,
        matchType: 'startsWith',
      },
    ];

    const result = findTargetAccount('SUPPLIER_001', multiMappings);
    expect(result).toBe('TARGET2');
  });

  it('should skip inactive mappings', () => {
    const inactiveMappings: Mapping[] = [
      {
        id: '1',
        companyId: 'DEMO',
        sourceAccount: 'ACC001',
        targetAccount: 'TARGET001',
        active: false,
        priority: 1,
        matchType: 'exact',
      },
    ];

    const result = findTargetAccount('ACC001', inactiveMappings, 'DEFAULT');
    expect(result).toBe('DEFAULT');
  });
});

describe('determineSign', () => {
  const baseParameters: Parameters = {
    companyId: 'DEMO',
    companyName: 'Demo Co',
    dateFormat: 'dd/MM/yyyy',
    decimalSeparator: ',',
    thousandSeparator: '.',
    currency: 'EUR',
    includeHeaderInSwift: false,
    rounding: 2,
    invertSignOnBankView: false,
    viewDefault: 'C',
  };

  it('should use natureza in company view', () => {
    const movement: Movement = {
      date: '2024-01-01',
      numMov: '001',
      natureza: 'D',
      obs: 'test',
      valor: 100,
    };

    const result = determineSign(movement, baseParameters);
    expect(result).toBe('D');
  });

  it('should use valor sign in bank view', () => {
    const movement: Movement = {
      date: '2024-01-01',
      numMov: '001',
      natureza: 'C',
      obs: 'test',
      valor: -100,
    };

    const params = { ...baseParameters, viewDefault: 'B' as const };
    const result = determineSign(movement, params);
    expect(result).toBe('D'); // Negative = Debit
  });

  it('should invert sign when configured', () => {
    const movement: Movement = {
      date: '2024-01-01',
      numMov: '001',
      natureza: 'C',
      obs: 'test',
      valor: -100,
    };

    const params = {
      ...baseParameters,
      viewDefault: 'B' as const,
      invertSignOnBankView: true,
    };

    const result = determineSign(movement, params);
    expect(result).toBe('C'); // Inverted
  });
});

describe('generateSwiftContent', () => {
  const parameters: Parameters = {
    companyId: 'DEMO',
    companyName: 'Demo Co',
    dateFormat: 'dd/MM/yyyy',
    decimalSeparator: ',',
    thousandSeparator: '.',
    currency: 'EUR',
    includeHeaderInSwift: true,
    rounding: 2,
    invertSignOnBankView: false,
    viewDefault: 'C',
    defaultTargetAccount: 'DEFAULT',
  };

  const mappings: Mapping[] = [
    {
      id: '1',
      companyId: 'DEMO',
      sourceAccount: 'ACC001',
      targetAccount: 'TARGET001',
      active: true,
      priority: 1,
      matchType: 'exact',
    },
  ];

  const movements: Movement[] = [
    {
      date: '2024-01-01',
      numMov: '001',
      natureza: 'D',
      obs: 'test1',
      valor: 100.55,
      sourceAccount: 'ACC001',
    },
    {
      date: '2024-01-02',
      numMov: '002',
      natureza: 'C',
      obs: 'test2',
      valor: 50.25,
      sourceAccount: 'UNKNOWN',
    },
  ];

  it('should generate SWIFT content with header', () => {
    const { content, count } = generateSwiftContent(movements, parameters, mappings);

    expect(count).toBe(2);
    expect(content).toContain('Data|NumMov|ContaDestino|Natureza|Valor|Obs');
    expect(content).toContain('2024-01-01|001|TARGET001|D|100,55|test1');
  });

  it('should use default target account when no mapping matches', () => {
    const { content } = generateSwiftContent(movements, parameters, mappings);

    expect(content).toContain('|DEFAULT|');
  });

  it('should apply rounding to values', () => {
    const { content } = generateSwiftContent(movements, parameters, mappings);

    expect(content).toContain('100,55');
    expect(content).toContain('50,25');
  });

  it('should not include skipped movements in count', () => {
    const movementsWithoutTarget: Movement[] = [
      {
        date: '2024-01-01',
        numMov: '001',
        natureza: 'D',
        obs: 'test',
        valor: 100,
        // No sourceAccount and no default
      },
    ];

    const emptyMappings: Mapping[] = [];
    const paramsNoDefault: Parameters = {
      ...parameters,
      defaultTargetAccount: undefined,
    };

    const { count } = generateSwiftContent(movementsWithoutTarget, paramsNoDefault, emptyMappings);
    expect(count).toBe(0);
  });
});
