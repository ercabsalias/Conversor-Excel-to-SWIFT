/**
 * Excel Reader for SWIFT Converter
 */

import * as XLSX from 'xlsx';
import { ExcelMovimento, ExcelData } from '@/types/swift';

/**
 * Lê um ficheiro Excel e extrai dados
 * Esperado: colunas Data | NumMov | Natureza | Valor | Descrição
 */
export async function lerFicheirExcel(file: File): Promise<ExcelData> {
  console.log('🔍 [excelReader] Iniciando leitura de ficheiro:', file.name, file.size, 'bytes');
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        console.log('📖 [excelReader] FileReader onload disparado');
        const buffer = e.target?.result as ArrayBuffer;
        console.log('📦 [excelReader] Buffer recebido:', buffer.byteLength, 'bytes');
        
        const workbook = XLSX.read(buffer, { type: 'array' });
        console.log('📚 [excelReader] Workbook lido. Sheets:', workbook.SheetNames);
        
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        console.log('📄 [excelReader] Worksheet selecionado:', workbook.SheetNames[0]);

        // Ler dados brutos incluindo headers
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
        console.log('🗂️  [excelReader] Dados brutos lidos:', rawData.length, 'linhas');
        
        if (rawData.length < 2) {
          console.error('❌ [excelReader] Ficheiro vazio ou sem dados');
          reject(new Error('Ficheiro Excel vazio ou sem dados'));
          return;
        }

        // Primeira linha = headers
        const headers = (rawData[0] as string[]).map((h) => String(h).trim().toLowerCase());
        console.log('🏷️  [excelReader] Headers detectados:', headers);

        // Processar linhas
        const movimentos: ExcelMovimento[] = [];
        let skipped = 0;
        
        for (let i = 1; i < rawData.length; i++) {
          const row = rawData[i] as unknown[];
          if (!row[0]) {
            skipped++;
            continue; // Pular linhas vazias
          }

          const movimento = processarLinhaExcel(row, headers, i);
          if (movimento) {
            movimentos.push(movimento);
          } else {
            skipped++;
          }
        }

        console.log(`✅ [excelReader] Processados: ${movimentos.length} movimentos válidos, ${skipped} linhas puladas`);
        console.log('💾 [excelReader] Amostra de dados:', movimentos.slice(0, 3));
        
        resolve({
          headers: (rawData[0] as string[]).map((h) => String(h)),
          rows: movimentos,
          rawData,
        });
      } catch (error) {
        console.error('💥 [excelReader] Erro ao processar:', error);
        reject(error);
      }
    };

    reader.onerror = () => {
      console.error('❌ [excelReader] Erro ao ler ficheiro');
      reject(new Error('Erro ao ler ficheiro'));
    };
    
    console.log('📂 [excelReader] Iniciando readAsArrayBuffer...');
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Processa uma linha do Excel para movimento
 */
export function processarLinhaExcel(row: unknown[], headers: string[], lineNumber?: number): ExcelMovimento | null {
  // Encontrar índices das colunas esperadas
  const indexData = headers.findIndex((h) => h.includes('data') || h.includes('date'));
  const indexNumMov = headers.findIndex((h) =>
    h.includes('número') ||
    h.includes('num') ||
    h.includes('operação') ||
    h.includes('nº')
  );
  const indexNatureza = headers.findIndex((h) => h.includes('natureza') || h.includes('nature') || h.includes('tipo'));
  const hasNatureza = indexNatureza >= 0;
  const indexValor = headers.findIndex((h) => h.includes('valor') || h.includes('montante') || h.includes('amount'));
  const indexDescricao = headers.findIndex((h) => h.includes('descri') || h.includes('obs') || h.includes('description'));

  if (indexData < 0 || indexNumMov < 0 || indexValor < 0) {
    console.warn(`⚠️  [processarLinhaExcel] Colunas essenciais não encontradas em linha ${lineNumber}:`, {
      indexData, indexNumMov, indexValor, headers
    });
    return null;
  }
  if (!hasNatureza) {
    // natureza não obrigatória, mas avisamos que será deduzida
    console.warn(`ℹ️ [processarLinhaExcel] Coluna 'natureza' não encontrada; será deduzida pelo valor`);
  }

  try {
    const dataStr = String(row[indexData] || '').trim();
    const data = formatarData(dataStr);
    const numMov = String(row[indexNumMov] || '').trim();
    let natureza: 'D' | 'C' | null = null;
    if (hasNatureza) {
      const naturezaStr = String(row[indexNatureza] || '').toUpperCase().trim();
      natureza = (naturezaStr === 'D' || naturezaStr === 'C') ? naturezaStr : null;
    }
    const valorStr = String(row[indexValor] || '0');
    const valor = parseFloat(valorStr.replace(',', '.'));
    const descricao = String(row[indexDescricao] || '').substring(0, 100);

    // Validação rigorosa
    if (!data) {
      console.warn(`⚠️  [processarLinhaExcel] Data inválida em linha ${lineNumber}:`, { dataStr });
      return null;
    }
    if (!numMov) {
      console.warn(`⚠️  [processarLinhaExcel] NumMov vazio em linha ${lineNumber}`);
      return null;
    }
    // Se não havia coluna natureza, deduzir pela polaridade do valor
    if (!natureza) {
      if (!hasNatureza) {
        natureza = valor >= 0 ? 'C' : 'D';
        console.log(`↔️ [processarLinhaExcel] Natureza ausente; deduzida como '${natureza}' pelo valor ${valor}`);
      } else {
        console.warn(`⚠️  [processarLinhaExcel] Natureza inválida em linha ${lineNumber}`);
        return null;
      }
    }
    if (isNaN(valor)) {
      console.warn(`⚠️  [processarLinhaExcel] Valor inválido em linha ${lineNumber}:`, { valorStr });
      return null;
    }

    // Construir o movimento e retornar
    return {
      data,
      numMov,
      natureza,
      valor,
      descricao,
    };
  } catch (error) {
    console.error(`❌ [processarLinhaExcel] Erro na linha ${lineNumber}:`, error);
    return null;
  }
}

/**
 * Converte uma string de data para o formato ISO (YYYY-MM-DD).
 * Suporta múltiplos formatos de entrada (serial Excel, DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY).
 */
export function formatarData(dataStr: string): string {
  try {
    // Tentar parseDate diferentes formatos comuns
    let date: Date | null = null;
    let debugInfo = '';

    // Formato Excel serial number
    if (!isNaN(Number(dataStr)) && dataStr.length < 10) {
      const serial = Number(dataStr);
      if (serial > 0 && serial < 100000) {
        date = new Date((serial - 25569) * 86400 * 1000);
        debugInfo = `[Excel Serial: ${serial}]`;
      }
    }
    // Formato DD/MM/YYYY
    else if (dataStr.includes('/')) {
      const parts = dataStr.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const year = parseInt(parts[2]);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          const fullYear = year < 100 ? (year < 50 ? 2000 + year : 1900 + year) : year;
          date = new Date(fullYear, month - 1, day);
          debugInfo = `[DD/MM/YYYY: ${day}/${month}/${fullYear}]`;
        }
      }
    }
    // Formato YYYY-MM-DD
    else if (dataStr.includes('-')) {
      date = new Date(dataStr + 'T00:00:00Z');
      debugInfo = `[YYYY-MM-DD]`;
    }
    // Formato DD-MM-YYYY
    else if (dataStr.includes('-') && dataStr.split('-').length === 3) {
      const parts = dataStr.split('-');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const year = parseInt(parts[2]);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          const fullYear = year < 100 ? (year < 50 ? 2000 + year : 1900 + year) : year;
          date = new Date(fullYear, month - 1, day);
          debugInfo = `[DD-MM-YYYY: ${day}/${month}/${fullYear}]`;
        }
      }
    }

    if (date && !isNaN(date.getTime())) {
      const yy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const result = `${yy}-${mm}-${dd}`;
      console.log(`📅 [formatarData] ${dataStr} → ${result} ${debugInfo}`);
      return result;
    } else {
      console.warn(`⚠️  [formatarData] Data inválida: ${dataStr}, date:`, date);
    }
  } catch (error) {
    console.error(`❌ [formatarData] Erro ao processar ${dataStr}:`, error);
  }

  return '';
}

/**
 * Filtra movimentos por data
 */
export function filtrarMovimentosPorData(
  movimentos: ExcelMovimento[],
  dataInicial: string,
  dataFinal: string
): ExcelMovimento[] {
  return movimentos.filter((mov) => {
    const movDate = new Date(mov.data).getTime();
    const startDate = new Date(dataInicial).getTime();
    const endDate = new Date(dataFinal).getTime();
    return movDate >= startDate && movDate <= endDate;
  });
}
