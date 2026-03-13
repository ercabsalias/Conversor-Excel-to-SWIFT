/**
 * Simulated Database for Parameters and Account Mappings
 * Replaces backend API calls - data persists in localStorage
 */

import { Parameters, Mapping } from '@/types';

/**
 * Organizations with their parameters
 */
export interface OrganizationData {
  id: string;
  name: string;
  parameters: Parameters;
  accountMappings: AccountMapping[];
}

export interface AccountMapping {
  id: string;
  sourceAccount: string;
  targetAccount: string;
  description?: string;
  active: boolean;
  priority: number;
}

/**
 * Simulated Organizations Database
 */
const ORGANIZATIONS: OrganizationData[] = [
  {
    id: 'ORG_001',
    name: 'Openlimits Lda',
    parameters: {
      companyId: 'ORG_001',
      companyName: 'Openlimits Lda',
      referencia: 'teste',
      conta: 'BA11',
      nConta: '1005412286',
      sequencia: '1',
      moeda: 'EUR',
      docCredito: 'DVD',
      docDebito: 'DVC',
      dateFormat: 'dd/MM/yyyy',
      decimalSeparator: ',',
      thousandSeparator: '.',
      currency: 'EUR',
      includeHeaderInSwift: true,
      rounding: 2,
      invertSignOnBankView: false,
      viewDefault: 'B',
      defaultTargetAccount: 'DEFAULT_OUT',
    },
    accountMappings: [
      {
        id: 'MAP_001',
        sourceAccount: 'INTERNAL',
        targetAccount: 'INT_ACCOUNT',
        description: 'Internal transfers',
        active: true,
        priority: 1,
      },
      {
        id: 'MAP_002',
        sourceAccount: 'SUPPLIER',
        targetAccount: 'SUPPLIER_ACC',
        description: 'Supplier payments',
        active: true,
        priority: 2,
      },
    ],
  },
  {
    id: 'ORG_002',
    name: 'Demo Company',
    parameters: {
      companyId: 'ORG_002',
      companyName: 'Demo Company',
      referencia: 'DEMO',
      conta: 'BA12',
      nConta: '9876543210',
      sequencia: '2',
      moeda: 'EUR',
      docCredito: 'CRD',
      docDebito: 'DBT',
      dateFormat: 'dd/MM/yyyy',
      decimalSeparator: ',',
      thousandSeparator: '.',
      currency: 'EUR',
      includeHeaderInSwift: true,
      rounding: 2,
      invertSignOnBankView: false,
      viewDefault: 'C',
      defaultTargetAccount: 'DEFAULT_OUT',
    },
    accountMappings: [
      {
        id: 'MAP_101',
        sourceAccount: 'TEST',
        targetAccount: 'TEST_ACC',
        description: 'Test mapping',
        active: true,
        priority: 1,
      },
    ],
  },
];

/**
 * Get all organizations (for dropdown)
 */
export function getAllOrganizations(): OrganizationData[] {
  return ORGANIZATIONS;
}

/**
 * Get organization by ID
 */
export function getOrganizationById(id: string): OrganizationData | undefined {
  return ORGANIZATIONS.find((org) => org.id === id);
}

/**
 * Get organization parameters
 */
export function getOrganizationParameters(organizationId: string): Parameters | null {
  const org = getOrganizationById(organizationId);
  return org ? org.parameters : null;
}

/**
 * Update organization parameters
 */
export function updateOrganizationParameters(organizationId: string, parameters: Parameters): boolean {
  const org = getOrganizationById(organizationId);
  if (org) {
    org.parameters = parameters;
    persistToLocalStorage();
    return true;
  }
  return false;
}

/**
 * Get account mappings for organization
 */
export function getAccountMappings(organizationId: string): AccountMapping[] {
  const org = getOrganizationById(organizationId);
  return org ? org.accountMappings : [];
}

/**
 * Add account mapping
 */
export function addAccountMapping(organizationId: string, mapping: Omit<AccountMapping, 'id'>): AccountMapping | null {
  const org = getOrganizationById(organizationId);
  if (org) {
    const newMapping: AccountMapping = {
      ...mapping,
      id: `MAP_${Date.now()}`,
    };
    org.accountMappings.push(newMapping);
    persistToLocalStorage();
    return newMapping;
  }
  return null;
}

/**
 * Update account mapping
 */
export function updateAccountMapping(organizationId: string, mappingId: string, updates: Partial<AccountMapping>): boolean {
  const org = getOrganizationById(organizationId);
  if (org) {
    const mapping = org.accountMappings.find((m) => m.id === mappingId);
    if (mapping) {
      Object.assign(mapping, updates);
      persistToLocalStorage();
      return true;
    }
  }
  return false;
}

/**
 * Delete account mapping
 */
export function deleteAccountMapping(organizationId: string, mappingId: string): boolean {
  const org = getOrganizationById(organizationId);
  if (org) {
    const index = org.accountMappings.findIndex((m) => m.id === mappingId);
    if (index > -1) {
      org.accountMappings.splice(index, 1);
      persistToLocalStorage();
      return true;
    }
  }
  return false;
}

/**
 * Find account mapping (for SWIFT generation)
 * Applies priority and matchType logic
 */
export function findAccountMapping(
  organizationId: string,
  sourceAccount: string | undefined
): AccountMapping | null {
  if (!sourceAccount) return null;

  const org = getOrganizationById(organizationId);
  if (!org) return null;

  // Filter active mappings and sort by priority
  const activeMappings = org.accountMappings
    .filter((m) => m.active)
    .sort((a, b) => a.priority - b.priority);

  // Simple exact match for now
  // TODO: Implement startsWith and regex matching
  for (const mapping of activeMappings) {
    if (mapping.sourceAccount === sourceAccount) {
      return mapping;
    }
  }

  return null;
}

/**
 * Persist to localStorage
 */
function persistToLocalStorage(): void {
  localStorage.setItem('orgs_db', JSON.stringify(ORGANIZATIONS));
}

/**
 * Load from localStorage
 */
export function loadFromLocalStorage(): void {
  const stored = localStorage.getItem('orgs_db');
  if (stored) {
    try {
      const data = JSON.parse(stored);
      ORGANIZATIONS.length = 0;
      ORGANIZATIONS.push(...data);
    } catch (e) {
      console.error('Failed to load organizations from localStorage:', e);
    }
  }
}

// Load on module initialization
loadFromLocalStorage();
