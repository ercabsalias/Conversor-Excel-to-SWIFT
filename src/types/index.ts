/**
 * Domain types for ConverExcelToSwift
 */

/**
 * Movement represents a single transaction in the CSV/Excel
 */
export interface Movement {
  date: string;
  numMov: string;
  natureza: 'D' | 'C';
  obs: string;
  valor: number;
  sourceAccount?: string;
}

/**
 * Parameters for conversion rules specific to a company
 */
export interface Parameters {
  companyId: string;
  companyName: string;
  dateFormat: string; // e.g., 'dd/MM/yyyy'
  decimalSeparator: string; // ',' or '.'
  thousandSeparator: string; // '.' or ','
  currency: string; // e.g., 'EUR'
  includeHeaderInSwift: boolean;
  rounding: number; // decimal places
  invertSignOnBankView: boolean; // if viewDefault is 'B'
  viewDefault: 'C' | 'B'; // Company or Bank view
  defaultTargetAccount?: string;
  // User-specific parameters
  referencia?: string;
  conta?: string;
  nConta?: string;
  sequencia?: string;
  docCredito?: string;
  docDebito?: string;
}

/**
 * Mapping rules for source account -> target account
 */
export interface Mapping {
  id: string;
  companyId: string;
  sourceAccount: string;
  targetAccount: string;
  description?: string;
  active: boolean;
  priority: number; // lower = higher priority
  matchType: 'exact' | 'startsWith' | 'regex';
}

/**
 * Column mapping configuration for Excel import
 */
export interface ColumnMapping {
  companyId: string;
  sheetName: string;
  hasHeader: boolean;
  fields: {
    date: string;
    numMov: string;
    natureza: string;
    obs: string;
    valor: string;
    sourceAccount?: string;
  };
}

/**
 * Excel sheet metadata after upload
 */
export interface ExcelSheetInfo {
  name: string;
  rowCount: number;
  colCount: number;
}

/**
 * Parsed Excel data with metadata
 */
export interface ExcelImportData {
  sheets: ExcelSheetInfo[];
  selectedSheet: string;
  rawData: unknown[][];
  detectedHeaderRow?: number;
  hasHeader?: boolean;
}

/**
 * Parsing errors during column mapping or conversion
 */
export interface ParsingError {
  lineNumber: number;
  column: string;
  value: unknown;
  reason: string;
}

/**
 * Result of parsing all movements
 */
export interface ParsingResult {
  valid: Movement[];
  errors: ParsingError[];
}

/**
 * SWIFT generation options
 */
export interface GenerateSwiftOptions {
  fileName?: string;
}
