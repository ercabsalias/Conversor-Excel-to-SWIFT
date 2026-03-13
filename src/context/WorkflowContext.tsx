import React, { createContext, useContext, useState, useCallback } from 'react';
import { ColumnMapping, Movement } from '@/types';

export interface WorkflowState {
  // File
  file: File | null;
  
  // Column Mapping (auto-detected, not shown)
  columnMapping: ColumnMapping | null;
  
  // Parsed Movements
  movements: Movement[];
  
  // Organization
  selectedOrganizationId: string | null;
  
  // Filters (from desktop app)
  dateStart: string | null;
  dateEnd: string | null;
  viewType: 'C' | 'B';
  multipleCompanies: boolean;
  currency: string;
  
  // Balances
  startBalance: number;
  endBalance: number;
  
  // Log
  logs: Array<{ type: 'error' | 'warning' | 'info'; message: string; timestamp: Date }>;
  
  // UI
  currentStep: 'upload' | 'mapping' | 'filters' | 'preview' | 'generate';
}

interface WorkflowContextType {
  state: WorkflowState;
  setFile: (file: File | null) => void;
  setColumnMapping: (mapping: ColumnMapping | null) => void;
  setMovements: (movements: Movement[]) => void;
  setDateStart: (date: string | null) => void;
  setDateEnd: (date: string | null) => void;
  setViewType: (type: 'C' | 'B') => void;
  setMultipleCompanies: (value: boolean) => void;
  setCurrency: (curr: string) => void;
  setOrganization: (id: string | null) => void;
  setStartBalance: (value: number) => void;
  setEndBalance: (value: number) => void;
  addLog: (type: 'error' | 'warning' | 'info', message: string) => void;
  clearLogs: () => void;
  goToStep: (step: WorkflowState['currentStep']) => void;
  reset: () => void;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

const INITIAL_STATE: WorkflowState = {
  file: null,
  columnMapping: null,
  movements: [],
  selectedOrganizationId: null,
  dateStart: null,
  dateEnd: null,
  viewType: 'B',
  multipleCompanies: false,
  currency: 'EUR',
  startBalance: 0,
  endBalance: 0,
  logs: [],
  currentStep: 'upload',
};

export const WorkflowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<WorkflowState>(INITIAL_STATE);

  const setFile = useCallback((file: File | null) => {
    setState((prev) => ({ ...prev, file }));
  }, []);

  const setColumnMapping = useCallback((mapping: ColumnMapping | null) => {
    setState((prev) => ({ ...prev, columnMapping: mapping }));
  }, []);

  const setMovements = useCallback((movements: Movement[]) => {
    setState((prev) => ({ ...prev, movements }));
  }, []);

  const setDateStart = useCallback((date: string | null) => {
    setState((prev) => ({ ...prev, dateStart: date }));
  }, []);

  const setDateEnd = useCallback((date: string | null) => {
    setState((prev) => ({ ...prev, dateEnd: date }));
  }, []);

  const setViewType = useCallback((type: 'C' | 'B') => {
    setState((prev) => ({ ...prev, viewType: type }));
  }, []);

  const setMultipleCompanies = useCallback((value: boolean) => {
    setState((prev) => ({ ...prev, multipleCompanies: value }));
  }, []);

  const setCurrency = useCallback((curr: string) => {
    setState((prev) => ({ ...prev, currency: curr }));
  }, []);

  const setOrganization = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, selectedOrganizationId: id }));
  }, []);

  const setStartBalance = useCallback((value: number) => {
    setState((prev) => ({ ...prev, startBalance: value }));
  }, []);

  const setEndBalance = useCallback((value: number) => {
    setState((prev) => ({ ...prev, endBalance: value }));
  }, []);

  const addLog = useCallback(
    (type: 'error' | 'warning' | 'info', message: string) => {
      setState((prev) => ({
        ...prev,
        logs: [
          ...prev.logs,
          { type, message, timestamp: new Date() },
        ],
      }));
    },
    []
  );

  const clearLogs = useCallback(() => {
    setState((prev) => ({ ...prev, logs: [] }));
  }, []);

  const goToStep = useCallback((step: WorkflowState['currentStep']) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  }, []);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return (
    <WorkflowContext.Provider
      value={{
        state,
        setFile,
        setColumnMapping,
        setMovements,
        setDateStart,
        setDateEnd,
        setViewType,
        setMultipleCompanies,
        setCurrency,
        setOrganization,
        setStartBalance,
        setEndBalance,
        addLog,
        clearLogs,
        goToStep,
        reset,
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
};

export const useWorkflow = (): WorkflowContextType => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within WorkflowProvider');
  }
  return context;
};
