/**
 * Automatic Column Mapping
 * Works silently without UI - determines column positions from data
 * Follows the C# model where columns are detected behind the scenes
 */

export interface AutoDetectedMapping {
  dataColumn: number;
  numMovColumn: number;
  naturezaColumn: number;
  obsColumn: number;
  valorColumn: number;
  sourceAccountColumn?: number;
}

/**
 * Auto-detect column positions from data
 * Analyzes first few rows to determine which column contains what data
 */
export function autoDetectColumns(rawData: unknown[][]): AutoDetectedMapping | null {
  if (rawData.length < 2) return null;

  const headerRow = rawData[0] as unknown[];
  const sampleRow = rawData[1] as unknown[];

  const mapping: Partial<AutoDetectedMapping> = {};

  // Search for columns by common headers
  const columnsToFind = [
    { key: 'dataColumn', patterns: ['data', 'date', 'data_mov', 'datamov'] },
    { key: 'numMovColumn', patterns: ['nummov', 'num_mov', 'numero', 'movement', 'seq', 'sequencia'] },
    { key: 'naturezaColumn', patterns: ['natureza', 'nature', 'd/c', 'tipo', 'debit', 'credit'] },
    { key: 'valorColumn', patterns: ['valor', 'value', 'amount', 'montante'] },
    { key: 'obsColumn', patterns: ['obs', 'observacao', 'description', 'descricao', 'notes'] },
    { key: 'sourceAccountColumn', patterns: ['conta', 'account', 'source', 'origem'] },
  ];

  // Try header-based detection first
  for (const { key, patterns } of columnsToFind) {
    for (let col = 0; col < headerRow.length; col++) {
      const headerValue = String(headerRow[col] || '').toLowerCase().trim();
      if (patterns.some((p) => headerValue.includes(p))) {
        mapping[key as keyof AutoDetectedMapping] = col;
        break;
      }
    }
  }

  // If no full match yet, try data-based detection on sample row
  if (!mapping.dataColumn && sampleRow.length > 0) {
    for (let col = 0; col < Math.min(sampleRow.length, 6); col++) {
      const value = String(sampleRow[col] || '');
      // Try to detect date patterns (dd/mm/yyyy, mm/dd/yyyy, etc)
      if (/^\d{1,2}[/\-]\d{1,2}[/\-]\d{4}/.test(value)) {
        mapping.dataColumn = col;
        break;
      }
    }
  }

  if (!mapping.numMovColumn && sampleRow.length > 1) {
    for (let col = 0; col < Math.min(sampleRow.length, 6); col++) {
      const value = String(sampleRow[col] || '');
      // Numbers like 001, 002, etc or simple incremental
      if (/^\d{1,6}$/.test(value)) {
        mapping.numMovColumn = col;
        break;
      }
    }
  }

  // If still missing required fields, use default positions (from C# model)
  if (mapping.dataColumn === undefined) mapping.dataColumn = 0;
  if (mapping.numMovColumn === undefined) mapping.numMovColumn = 1;
  if (mapping.naturezaColumn === undefined) mapping.naturezaColumn = 2;
  if (mapping.obsColumn === undefined) mapping.obsColumn = 3;
  if (mapping.valorColumn === undefined) mapping.valorColumn = 4;

  return mapping as AutoDetectedMapping;
}

/**
 * Validate if a value looks like a date
 */
export function isLikelyDate(value: unknown): boolean {
  if (value instanceof Date) return true;
  const str = String(value || '').trim();
  return /^\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}/.test(str);
}

/**
 * Validate if a value looks like a number
 */
export function isLikelyNumber(value: unknown): boolean {
  if (typeof value === 'number') return true;
  const str = String(value || '').trim();
  return /^-?\d+[.,]?\d*/.test(str);
}

/**
 * Validate if a value is D or C (Natureza)
 */
export function isValidNatureza(value: unknown): boolean {
  const str = String(value || '').toUpperCase().trim();
  return str === 'D' || str === 'C';
}
