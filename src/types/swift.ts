/**
 * SWIFT MT940 Types and Interfaces
 */

export interface ExcelMovimento {
  data: string;
  numMov: string | number;
  natureza: 'D' | 'C'; // Débito ou Crédito
  valor: number;
  descricao: string;
  saldo?: number;
}

export interface ParametrosMapeamento {
  referencia: string; // :20:
  conta: string; // Código do banco/conta
  nConta: string; // :25: - IBAN/número conta
  moeda: string; // EUR, AKZ, etc
  sequencia: string; // :28C:
  docCredito: string; // Código doc para crédito
  docDebito: string; // Código doc para débito
}

export interface MapeamentoContas {
  id: string;
  contaFicheiro: string;
  contaErp: string;
}

export interface FiltrosMovimentos {
  dataInicial: string; // YYYY-MM-DD
  dataFinal: string;
  saldoInicial: number;
  saldoFinalInput: number;
  saldoInicialTipo: 'C' | 'D';
  saldoFinalTipo: 'C' | 'D';
  tipoVisao: 'B' | 'C'; // B=Bancária, C=Contabilística
  multiEmpresas: boolean;
}

export interface ExcelData {
  headers: string[];
  rows: ExcelMovimento[];
  rawData: unknown[][];
}

export interface ConverterState {
  file: File | null;
  excelData: ExcelData | null;
  parametros: ParametrosMapeamento;
  mapeamentosContas: MapeamentoContas[];
  filtros: FiltrosMovimentos;
  movimentosFiltrados: ExcelMovimento[];
}

export interface SWIFTStack {
  tag20: string; // Referência
  tag25: string; // Nº Conta
  tag28C: string; // Sequência
  tag60F: string; // Saldo Inicial
  tag61Items: string[]; // Movimentos
  tag62F: string; // Saldo Final
}
