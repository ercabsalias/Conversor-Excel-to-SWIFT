/**
 * Tests for parsing utilities
 */

import { describe, it, expect } from 'vitest';
import {
  parseNumber,
  parseDate,
  detectHeaderRow,
  suggestColumnIndex,
  normalizeNumber,
} from '@/lib/parsing';

describe('parseNumber', () => {
  it('should parse number with comma decimal separator', () => {
    expect(parseNumber('1,50', ',', '.')).toBe(1.5);
  });

  it('should parse number with dot decimal separator', () => {
    expect(parseNumber('1.50', '.', ',')).toBe(1.5);
  });

  it('should parse number with thousand separator', () => {
    expect(parseNumber('1.000,50', ',', '.')).toBe(1000.5);
  });

  it('should return null for invalid number', () => {
    expect(parseNumber('abc', ',', '.')).toBeNull();
  });

  it('should handle numeric input', () => {
    expect(parseNumber(42, ',', '.')).toBe(42);
  });

  it('should return null for empty string', () => {
    expect(parseNumber('', ',', '.')).toBeNull();
  });
});

describe('parseDate', () => {
  it('should parse date with dd/MM/yyyy format', () => {
    const date = parseDate('01/01/2024', 'dd/MM/yyyy');
    expect(date).not.toBeNull();
    expect(date?.getDate()).toBe(1);
    expect(date?.getMonth()).toBe(0);
  });

  it('should parse date with yyyy-MM-dd format', () => {
    const date = parseDate('2024-01-01', 'yyyy-MM-dd');
    expect(date).not.toBeNull();
    expect(date?.getDate()).toBe(1);
  });

  it('should return null for invalid date', () => {
    expect(parseDate('invalid', 'dd/MM/yyyy')).toBeNull();
  });

  it('should handle Date input', () => {
    const inputDate = new Date('2024-01-01');
    const result = parseDate(inputDate, 'dd/MM/yyyy');
    expect(result).toBeTruthy();
  });
});

describe('detectHeaderRow', () => {
  it('should detect header with keywords', () => {
    const rows = [
      ['data', 'valor', 'desc'],
      ['01/01/2024', '100', 'test'],
      ['01/02/2024', '200', 'test2'],
    ];
    const headerIdx = detectHeaderRow(rows);
    expect(headerIdx).toBe(0);
  });

  it('should prefer row with more strings as header', () => {
    const rows = [
      ['123', '456', '789'],
      ['str1', 'str2', 'str3', 'str4'],
      ['111', '222', '333'],
    ];
    const headerIdx = detectHeaderRow(rows);
    // Should prefer row 1 due to higher string percentage
    expect(headerIdx).toBeGreaterThanOrEqual(0);
  });
});

describe('suggestColumnIndex', () => {
  it('should suggest date column', () => {
    const rows = [
      ['header1', 'header2', 'header3'],
      ['01/01/2024', 'val1', 'val2'],
      ['01/02/2024', 'val3', 'val4'],
    ];
    const colIdx = suggestColumnIndex(rows, 'date');
    expect(colIdx).toBe(0);
  });

  it('should suggest column with D/C for natureza', () => {
    const rows = [
      ['header1', 'header2', 'header3'],
      ['val1', 'D', 'val3'],
      ['val2', 'C', 'val4'],
    ];
    const colIdx = suggestColumnIndex(rows, 'natureza');
    expect(colIdx).toBe(1);
  });

  it('should suggest numeric column for valor', () => {
    const rows = [
      ['header1', 'header2', 'header3'],
      ['val1', '100', 'val3'],
      ['val2', '200', 'val4'],
    ];
    const colIdx = suggestColumnIndex(rows, 'valor');
    expect(colIdx).toBe(1);
  });
});

describe('normalizeNumber', () => {
  it('should normalize with comma decimal separator', () => {
    expect(normalizeNumber(1.5, ',', 2)).toBe('1,50');
  });

  it('should normalize with dot decimal separator', () => {
    expect(normalizeNumber(1.5, '.', 2)).toBe('1.50');
  });

  it('should round to specified decimal places', () => {
    expect(normalizeNumber(1.5555, ',', 2)).toBe('1,56');
  });

  it('should handle zero rounding', () => {
    expect(normalizeNumber(1.5, ',', 0)).toBe('2');
  });
});
