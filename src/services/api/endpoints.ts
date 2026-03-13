/**
 * API Endpoints for ConverExcelToSwift
 */

export const endpoints = {
  // Authentication
  auth: {
    login: '/Users/Login',
    logout: '/auth/logout',
    validate: '/auth/validate',
  },

  // Parameters (Configurações)
  parameters: {
    getByCompany: (companyId: string) => `/api/parameters/${companyId}`,
    update: (companyId: string) => `/api/parameters/${companyId}`,
  },

  // Mappings (Mapeamentos)
  mappings: {
    listByCompany: (companyId: string) => `/api/mappings/${companyId}`,
    create: '/api/mappings',
    update: (mappingId: string) => `/api/mappings/${mappingId}`,
    delete: (mappingId: string) => `/api/mappings/${mappingId}`,
  },

  // Column Mappings
  columnMappings: {
    getByCompanyAndSheet: (companyId: string, sheetName: string) =>
      `/api/column-mappings/${companyId}/${sheetName}`,
    save: '/api/column-mappings',
  },

  // Company
  company: {
    get: (companyId: string) => `/api/company/${companyId}`,
    list: '/api/company',
  },
} as const;
