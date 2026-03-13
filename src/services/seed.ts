/**
 * Seed data for offline/fallback mode
 */

import { Parameters, Mapping } from '@/types';

export const SEED_PARAMETERS: Parameters = {
  companyId: 'DEMO_001',
  companyName: 'Demo Company',
  dateFormat: 'dd/MM/yyyy',
  decimalSeparator: ',',
  thousandSeparator: '.',
  currency: 'EUR',
  includeHeaderInSwift: true,
  rounding: 2,
  invertSignOnBankView: false,
  viewDefault: 'C',
  defaultTargetAccount: 'OUTGOING_DEFAULT',
  // User-specific configuration
  referencia: 'teste',
  conta: 'BA11',
  nConta: '1005412286',
  sequencia: '1',
  docCredito: 'DVD',
  docDebito: 'DVC',
};

export const SEED_MAPPINGS: Mapping[] = [
  {
    id: '1',
    companyId: 'DEMO_001',
    sourceAccount: 'INTERNAL',
    targetAccount: 'INT_ACCOUNT',
    description: 'Internal transfers',
    active: true,
    priority: 1,
    matchType: 'exact',
  },
  {
    id: '2',
    companyId: 'DEMO_001',
    sourceAccount: 'SUPPLIER',
    targetAccount: 'SUPPLIER_ACCOUNT',
    description: 'Supplier payments',
    active: true,
    priority: 2,
    matchType: 'startsWith',
  },
  {
    id: '3',
    companyId: 'DEMO_001',
    sourceAccount: '.*TEST.*',
    targetAccount: 'TEST_ACCOUNT',
    description: 'Test accounts',
    active: true,
    priority: 3,
    matchType: 'regex',
  },
];

/**
 * Check if we're in offline mode
 */
export function isOfflineMode(): boolean {
  return localStorage.getItem('offline_mode') === 'true';
}

/**
 * Set offline mode flag
 */
export function setOfflineMode(offline: boolean): void {
  if (offline) {
    localStorage.setItem('offline_mode', 'true');
    // Initialize with seed data if not already present
    if (!localStorage.getItem('seed_parameters')) {
      localStorage.setItem('seed_parameters', JSON.stringify(SEED_PARAMETERS));
    }
    if (!localStorage.getItem('seed_mappings')) {
      localStorage.setItem('seed_mappings', JSON.stringify(SEED_MAPPINGS));
    }
  } else {
    localStorage.removeItem('offline_mode');
  }
}

/**
 * Load Parameters from localStorage or seed
 */
export function loadParametersFromStorage(): Parameters {
  const stored = localStorage.getItem('seed_parameters');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Invalid JSON
    }
  }
  return SEED_PARAMETERS;
}

/**
 * Load Mappings from localStorage or seed
 */
export function loadMappingsFromStorage(): Mapping[] {
  const stored = localStorage.getItem('seed_mappings');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Invalid JSON
    }
  }
  return SEED_MAPPINGS;
}

/**
 * Save Parameters to localStorage
 */
export function saveParametersToStorage(params: Parameters): void {
  localStorage.setItem('seed_parameters', JSON.stringify(params));
}

/**
 * Save Mappings to localStorage
 */
export function saveMappingsToStorage(mappings: Mapping[]): void {
  localStorage.setItem('seed_mappings', JSON.stringify(mappings));
}

/**
 * Load ColumnMapping from localStorage
 */
export function loadColumnMappingFromStorage(companyId: string) {
  const key = `column_mapping_${companyId}`;
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Invalid JSON
    }
  }
  return null;
}

/**
 * Save ColumnMapping to localStorage
 */
export function saveColumnMappingToStorage(companyId: string, mapping: unknown): void {
  const key = `column_mapping_${companyId}`;
  localStorage.setItem(key, JSON.stringify(mapping));
}
