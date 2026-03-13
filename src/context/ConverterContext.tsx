/**
 * ConverterContext - Gerenciador de estado global do conversor SWIFT
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { ConverterState, ParametrosMapeamento, MapeamentoContas, FiltrosMovimentos, ExcelData, ExcelMovimento } from '@/types/swift';

interface ConverterContextType {
  state: ConverterState;
  setFile: (file: File | null) => void;
  setExcelData: (data: ExcelData | null) => void;
  setParametros: (parametros: ParametrosMapeamento) => void;
  setMapeamentosContas: (mapeamentos: MapeamentoContas[]) => void;
  addMapeamentoConta: (mapeamento: MapeamentoContas) => void;
  removeMapeamentoConta: (id: string) => void;
  setFiltros: (filtros: FiltrosMovimentos) => void;
  setMovimentosFiltrados: (movimentos: ExcelMovimento[]) => void;
  reset: () => void;
}

const ConverterContext = createContext<ConverterContextType | undefined>(undefined);

const INITIAL_PARAMETROS: ParametrosMapeamento = {
  referencia: 'salias',
  conta: 'BAI1',
  nConta: '1005412286',
  moeda: 'AKZ',
  sequencia: '1',
  docCredito: 'DVD',
  docDebito: 'DVC',
};

const INITIAL_FILTROS: FiltrosMovimentos = {
  dataInicial: new Date().toISOString().split('T')[0],
  dataFinal: new Date().toISOString().split('T')[0],
  saldoInicial: 0,
  saldoFinalInput: 0,
  saldoInicialTipo: 'C',
  saldoFinalTipo: 'C',
  tipoVisao: 'B',
  multiEmpresas: false,
};

const INITIAL_STATE: ConverterState = {
  file: null,
  excelData: null,
  parametros: INITIAL_PARAMETROS,
  mapeamentosContas: [],
  filtros: INITIAL_FILTROS,
  movimentosFiltrados: [],
};

export const ConverterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ConverterState>(INITIAL_STATE);

  const setFile = useCallback((file: File | null) => {
    setState((prev) => ({ ...prev, file }));
  }, []);

  const setExcelData = useCallback((data: ExcelData | null) => {
    setState((prev) => ({ ...prev, excelData: data }));
  }, []);

  const setParametros = useCallback((parametros: ParametrosMapeamento) => {
    setState((prev) => ({ ...prev, parametros }));
   // Salvar no localStorage
    localStorage.setItem('swift_parametros', JSON.stringify(parametros));
  }, []);

  const setMapeamentosContas = useCallback((mapeamentos: MapeamentoContas[]) => {
    setState((prev) => ({ ...prev, mapeamentosContas: mapeamentos }));
    // Salvar no localStorage
    localStorage.setItem('swift_mapeamentos', JSON.stringify(mapeamentos));
  }, []);

  const addMapeamentoConta = useCallback((mapeamento: MapeamentoContas) => {
    setState((prev) => {
      const updated = [...prev.mapeamentosContas, mapeamento];
      localStorage.setItem('swift_mapeamentos', JSON.stringify(updated));
      return { ...prev, mapeamentosContas: updated };
    });
  }, []);

  const removeMapeamentoConta = useCallback((id: string) => {
    setState((prev) => {
      const updated = prev.mapeamentosContas.filter((m) => m.id !== id);
      localStorage.setItem('swift_mapeamentos', JSON.stringify(updated));
      return { ...prev, mapeamentosContas: updated };
    });
  }, []);

  const setFiltros = useCallback((filtros: FiltrosMovimentos) => {
    setState((prev) => ({ ...prev, filtros }));
  }, []);

  const setMovimentosFiltrados = useCallback((movimentos: ExcelMovimento[]) => {
    setState((prev) => ({ ...prev, movimentosFiltrados: movimentos }));
  }, []);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
    localStorage.removeItem('swift_parametros');
    localStorage.removeItem('swift_mapeamentos');
  }, []);

  // Carregar dados do localStorage ao inicializar
  React.useEffect(() => {
    const savedParametros = localStorage.getItem('swift_parametros');
    const savedMapeamentos = localStorage.getItem('swift_mapeamentos');

    if (savedParametros) {
      try {
        setState((prev) => ({
          ...prev,
          parametros: JSON.parse(savedParametros),
        }));
      } catch {
        // ignore
      }
    }

    if (savedMapeamentos) {
      try {
        setState((prev) => ({
          ...prev,
          mapeamentosContas: JSON.parse(savedMapeamentos),
        }));
      } catch {
        // ignore
      }
    }
  }, []);

  return (
    <ConverterContext.Provider
      value={{
        state,
        setFile,
        setExcelData,
        setParametros,
        setMapeamentosContas,
        addMapeamentoConta,
        removeMapeamentoConta,
        setFiltros,
        setMovimentosFiltrados,
        reset,
      }}
    >
      {children}
    </ConverterContext.Provider>
  );
};

export const useConverter = (): ConverterContextType => {
  const context = useContext(ConverterContext);
  if (!context) {
    throw new Error('useConverter must be used within ConverterProvider');
  }
  return context;
};
