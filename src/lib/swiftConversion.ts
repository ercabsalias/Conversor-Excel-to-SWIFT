/**
 * SWIFT MT940 Conversion Logic
 */

import { ExcelMovimento, ParametrosMapeamento, MapeamentoContas, FiltrosMovimentos, SWIFTStack } from '@/types/swift';

/**
 * Formata data no padrão SWIFT (YYMMDD)
 */
export function formatarDataSWIFT(data: string): string {
  try {
    const d = new Date(data);
    const yy = String(d.getFullYear()).slice(2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yy}${mm}${dd}`;
  } catch {
    return '000000';
  }
}

/**
 * Formata valor no padrão SWIFT (sem separadores, com vírgula para decimais)
 */
export function formatarValorSWIFT(valor: number, casasDecimais: number = 2): string {
  const formatado = valor.toFixed(casasDecimais).replace('.', ',');
  return formatado;
}

/**
 * Move de acordo com tipo de visão
 * B (Bancária): positivo=C, negativo=D
 * C (Contabilística): pode inverter conforme configuração
 */
export function determinarNatureza(
  valor: number,
  tipoVisao: 'B' | 'C',
  naturezaOriginal?: 'D' | 'C'
): 'D' | 'C' {
  if (tipoVisao === 'B') {
    return valor >= 0 ? 'C' : 'D';
  } else {
    // Visão Contabilística - inverter
    return valor >= 0 ? 'D' : 'C';
  }
}

/**
 * Calcula saldo acumulado aplicando movimentos
 */
export function calcularSaldoAcumulado(
  saldoInicial: number,
  saldoInicialTipo: 'C' | 'D',
  movimentos: ExcelMovimento[],
  tipoVisao: 'B' | 'C'
): { saldoFinal: number; tipo: 'C' | 'D' } {
  // Iniciar com saldo inicial
  let saldo = saldoInicialTipo === 'C' ? saldoInicial : -saldoInicial;

  // Aplicar cada movimento
  movimentos.forEach((mov) => {
    const natureza = determinarNatureza(Math.abs(mov.valor), tipoVisao, mov.natureza);
    if (natureza === 'C') {
      saldo += Math.abs(mov.valor);
    } else {
      saldo -= Math.abs(mov.valor);
    }
  });

  return {
    saldoFinal: Math.abs(saldo),
    tipo: saldo >= 0 ? 'C' : 'D',
  };
}

/**
 * Gera linha :61: (movimento) no formato SWIFT
 * Formato: :61:YYMMDD(YYMMDD)D/CValorNDTipoDocRef
 */
export function gerarLinha61(
  movimento: ExcelMovimento,
  docCode: string,
  tipoVisao: 'B' | 'C'
): string {
  const dataSWIFT = formatarDataSWIFT(movimento.data);
  const natureza = determinarNatureza(Math.abs(movimento.valor), tipoVisao, movimento.natureza);
  const valorSWIFT = formatarValorSWIFT(Math.abs(movimento.valor), 2);

  // Formato simplificado: :61:YYMMDD<D/C><Valor>N<TipoDoc><Ref>
  const descricaoLimpa = movimento.descricao.substring(0, 34);
  return `:61:${dataSWIFT}${natureza}${valorSWIFT}ND${docCode}${movimento.numMov}
${descricaoLimpa}`;
}

/**
 * Gera tag :60F: (Opening Balance / Saldo Inicial)
 * Formato: :60F:C/DYYMMDDMOEDAVALOR
 */
export function gerarTag60F(
  tipoSaldo: 'C' | 'D',
  dataInicial: string,
  moeda: string,
  valor: number
): string {
  const dataSWIFT = formatarDataSWIFT(dataInicial);
  const valorSWIFT = formatarValorSWIFT(valor, 2);
  return `:60F:${tipoSaldo}${dataSWIFT}${moeda}${valorSWIFT}`;
}

/**
 * Gera tag :62F: (Closing Balance / Saldo Final)
 * Formato: :62F:C/DYYMMDDMOEDAVALOR
 */
export function gerarTag62F(
  tipoSaldo: 'C' | 'D',
  dataFinal: string,
  moeda: string,
  valor: number
): string {
  const dataSWIFT = formatarDataSWIFT(dataFinal);
  const valorSWIFT = formatarValorSWIFT(valor, 2);
  return `:62F:${tipoSaldo}${dataSWIFT}${moeda}${valorSWIFT}`;
}

/**
 * Gera header do ficheiro SWIFT MT940
 */
export function gerarHeaderSWIFT(
  banco: string,
  nConta: string,
  moeda: string
): string {
  // Formato simplificado do header
  const headerF01 = `{1:F01${banco}AXXX0000000000}`;
  const headerF02 = `{2:I940${banco}AXXXN}`;
  return `${headerF01}${headerF02}`;
}

/**
 * Gera o stack SWIFT completo
 */
export function gerarStackSWIFT(
  parametros: ParametrosMapeamento,
  filtros: FiltrosMovimentos,
  movimentos: ExcelMovimento[]
): SWIFTStack {
  // Calcular saldo final
  const saldoCalc = calcularSaldoAcumulado(
    filtros.saldoInicial,
    filtros.saldoInicialTipo,
    movimentos,
    filtros.tipoVisao
  );

  // Gerar tags
  const stack: SWIFTStack = {
    tag20: parametros.referencia,
    tag25: parametros.nConta,
    tag28C: parametros.sequencia,
    tag60F: gerarTag60F(
      filtros.saldoInicialTipo,
      filtros.dataInicial,
      parametros.moeda,
      filtros.saldoInicial
    ),
    tag61Items: movimentos.map((mov) => {
      const docCode = determinarNatureza(Math.abs(mov.valor), filtros.tipoVisao) === 'C'
        ? parametros.docCredito
        : parametros.docDebito;
      return gerarLinha61(mov, docCode, filtros.tipoVisao);
    }),
    tag62F: gerarTag62F(
      saldoCalc.tipo,
      filtros.dataFinal,
      parametros.moeda,
      saldoCalc.saldoFinal
    ),
  };

  return stack;
}

/**
 * Construir ficheiro SWIFT MT940 final
 */
export function construirFicheirSWIFT(
  parametros: ParametrosMapeamento,
  stack: SWIFTStack,
  banco: string
): string {
  const header = gerarHeaderSWIFT(banco, parametros.nConta, parametros.moeda);
  
  const body = [
    '{4:',
    `:20:${stack.tag20}`,
    `:25:${stack.tag25}`,
    `:28C:${stack.tag28C}`,
    stack.tag60F,
    ...stack.tag61Items,
    stack.tag62F,
    '-}',
  ].join('\n');

  return `${header}${body}`;
}
