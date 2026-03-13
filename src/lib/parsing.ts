/**
 * Parsing utilities for Excel import and SWIFT generation
 */

import { format, parse, isValid } from 'date-fns';

/**
 * Error details from data parsing
 */
export interface ParsingError {
  lineNumber: number;
  column: string;
  value: unknown;
  reason: string;
}

/**
 * Parse a string to number with custom separators
 */
export function parseNumber(
  value: unknown,
  decimalSeparator: string = ',',
  thousandSeparator: string = '.'
): number | null {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) return null;

  // Remove thousand separator
  let normalized = trimmed.replace(new RegExp(`\\${thousandSeparator}`, 'g'), '');

  // Replace decimal separator with '.'
  normalized = normalized.replace(decimalSeparator, '.');

  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Parse a string to Date with custom format
 */
export function parseDate(value: unknown, format: string = 'dd/MM/yyyy'): Date | null {
  if (value instanceof Date) {
    return isValid(value) ? value : null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const parsed = parse(trimmed, format, new Date());
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Format date to string with custom format
 */
export function formatDateToString(date: Date, formatStr: string = 'dd/MM/yyyy'): string {
  try {
    return format(date, formatStr);
  } catch {
    return '';
  }
}

/**
 * Detect if a row contains headers by checking text patterns
 */
export function detectHeaderRow(
  rows: unknown[][],
  maxRowsToCheck: number = 10
): number | null {
  if (!rows || rows.length === 0) return null;

  const headerKeywords = [
    'data',
    'date',
    'data_mov',
    'movimento',
    'num',
    'numero',
    'numMov',
    'natureza',
    'tipo',
    'valor',
    'amount',
    'obs',
    'observacao',
    'descricao',
    'description',
    'conta',
    'account',
    'source',
    'dest',
  ];

  const checkRowsCount = Math.min(maxRowsToCheck, rows.length);
  let bestRowIndex = 0;
  let bestScore = 0;

  for (let i = 0; i < checkRowsCount; i++) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;

    let score = 0;
    let stringCount = 0;

    for (const cell of row) {
      if (typeof cell === 'string') {
        stringCount++;
        const lower = cell.toLowerCase().trim();

        // Check keywords
        for (const keyword of headerKeywords) {
          if (lower.includes(keyword)) {
            score += 2;
          }
        }

        // Bonus for short strings (typical headers)
        if (lower.length < 20) {
          score += 1;
        }
      }
    }

    // Bonus for rows with high percentage of strings
    const stringPercentage = (stringCount / row.length) * 100;
    if (stringPercentage > 70) {
      score += 3;
    }

    if (score > bestScore) {
      bestScore = score;
      bestRowIndex = i;
    }
  }

  return bestScore > 0 ? bestRowIndex : null;
}

/**
 * Suggest column index for a field based on data patterns
 */
export function suggestColumnIndex(
  rows: unknown[][],
  fieldType: 'date' | 'natureza' | 'valor' | 'sourceAccount' | 'numMov' | 'obs'
): number | null {
  if (!rows || rows.length === 0) return null;

  // Start from second row if first appears to be header
  const startRow = 1;
  let bestColIndex: number | null = null;
  let bestScore = 0;

  for (let colIndex = 0; colIndex < (rows[0]?.length || 0); colIndex++) {
    let score = 0;
    let validCount = 0;

    for (let rowIdx = startRow; rowIdx < Math.min(startRow + 20, rows.length); rowIdx++) {
      const cell = rows[rowIdx]?.[colIndex];
      const str = String(cell).toLowerCase().trim();

      if (fieldType === 'date') {
        // Check for date-like patterns
        if (
          /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(str) ||
          /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(str)
        ) {
          score += 3;
          validCount++;
        }
      } else if (fieldType === 'natureza') {
        // Check for D/C
        if (str === 'd' || str === 'c' || str === 'débito' || str === 'crédito') {
          score += 3;
          validCount++;
        }
      } else if (fieldType === 'valor') {
        // Check for numeric patterns
        const num = parseNumber(cell, ',', '.');
        if (typeof num === 'number') {
          score += 2;
          validCount++;
        }
      } else if (fieldType === 'sourceAccount') {
        // Check for account patterns
        if (typeof cell === 'string' && /^[A-Z0-9]{5,}/.test(cell.toUpperCase())) {
          score += 2;
          validCount++;
        }
      } else if (fieldType === 'numMov') {
        // Check for numeric strings
        if (typeof cell === 'string' && /^[0-9A-Z\-_.]+$/.test(cell.trim())) {
          score += 1;
          validCount++;
        }
      } else if (fieldType === 'obs') {
        // For observations/comments, generally any non-empty string is valid
        if (typeof cell === 'string' && cell.trim().length > 0) {
          score += 1;
          validCount++;
        }
      }
    }

    if (validCount > 0) {
      score = score / validCount; // normalize
      if (score > bestScore) {
        bestScore = score;
        bestColIndex = colIndex;
      }
    }
  }

  return bestColIndex;
}

/**
 * Auto-detect column mapping from raw Excel data
 */
export function autoDetectColumnMapping(
  rows: unknown[][],
  fieldNames: Array<'date' | 'numMov' | 'natureza' | 'obs' | 'valor' | 'sourceAccount'>
): Record<string, string | null> {
  const mapping: Record<string, string | null> = {};

  for (const field of fieldNames) {
    const colIndex = suggestColumnIndex(rows, field);
    mapping[field] = colIndex !== null ? `col_${colIndex}` : null;
  }

  return mapping;
}

/**
 * Normalize a number: remove thousand separators, apply rounding, apply decimal separator
 */
export function normalizeNumber(
  value: number,
  decimalSeparator: string = ',',
  rounding: number = 2
): string {
  // Round to specified decimal places
  const rounded = Math.round(value * Math.pow(10, rounding)) / Math.pow(10, rounding);

  // Convert to string with fixed decimal places
  const str = rounded.toFixed(rounding);

  // Replace decimal point with custom separator
  return str.replace('.', decimalSeparator);
}

/**
 * Extract extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Generate SWIFT filename
 */
export function generateSwiftFilename(companyId: string): string {
  const now = new Date();
  const timestamp = format(now, 'yyyyMMdd_HHmmss');
  return `SWIFT_${companyId}_${timestamp}.txt`;
}
