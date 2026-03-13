import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ChevronLeft, Info } from 'lucide-react';
import { readExcelFile } from '@/lib/excel';
import { parseDate, parseNumber } from '@/lib/parsing';
import { Movement, ColumnMapping } from '@/types';
import { useWorkflow } from '@/context/WorkflowContext';
import { autoDetectColumns } from '@/lib/autoMapping';
import { getAllOrganizations } from '@/services/organizationsDb';

const FilterPage: React.FC = () => {
  const { state, setMovements, setDateStart, setDateEnd, setViewType, setMultipleCompanies, setCurrency, setOrganization, setColumnMapping, goToStep, addLog } = useWorkflow();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  // Filter inputs (matching desktop layout)
  const [dateStartInput, setDateStartInput] = useState(state.dateStart || '');
  const [dateEndInput, setDateEndInput] = useState(state.dateEnd || '');
  const [startBalanceInput, setStartBalanceInput] = useState('0.00');
  const [endBalanceInput, setEndBalanceInput] = useState('0.00');
  const [viewTypeInput, setViewTypeInput] = useState<'C' | 'B'>(state.viewType);
  const [multipleCompaniesInput, setMultipleCompaniesInput] = useState(state.multipleCompanies);
  const [currencyInput, setCurrencyInput] = useState(state.currency);
  const [organizationInput, setOrganizationInput] = useState(state.selectedOrganizationId || '');
  
  const [totalMovements, setTotalMovements] = useState(0);
  const [filteredMovements, setFilteredMovements] = useState(0);

  // Load and parse movements on file change
  useEffect(() => {
    const loadMovements = async () => {
      if (!state.file) return;

      try {
        setLoading(true);
        setError('');

        const data = await readExcelFile(state.file);
        
        // Auto-detect columns if not yet done
        let columnMap = state.columnMapping;
        if (!columnMap) {
          const auto = autoDetectColumns(data.rawData);
          if (auto) {
            columnMap = {
              companyId: organizationInput || 'unknown',
              sheetName: 'default',
              hasHeader: true,
              fields: {
                date: `Col_${String.fromCharCode(65 + auto.dataColumn)}`,
                numMov: `Col_${String.fromCharCode(65 + auto.numMovColumn)}`,
                natureza: `Col_${String.fromCharCode(65 + auto.naturezaColumn)}`,
                obs: `Col_${String.fromCharCode(65 + (auto.obsColumn ?? 3))}`,
                valor: `Col_${String.fromCharCode(65 + auto.valorColumn)}`,
                sourceAccount: auto.sourceAccountColumn !== undefined
                  ? `Col_${String.fromCharCode(65 + auto.sourceAccountColumn)}`
                  : undefined,
              },
            };
            setColumnMapping(columnMap);
            addLog('info', 'Mapeamento de colunas detectado automaticamente nos bastidores');
          }
        }

        if (!columnMap) {
          addLog('warning', 'Não foi possível detectar automaticamente as colunas');
          setLoading(false);
          return;
        }

        // Parse movements from raw data
        const movements: Movement[] = [];
        const startRow = columnMap.hasHeader ? 1 : 0;
        
        for (let i = startRow; i < data.rawData.length; i++) {
          const row = data.rawData[i] as unknown[];
          
          try {
            // Extract column indices from Col_A, Col_B, etc format
            const getColIndex = (colStr: string): number => {
              if (colStr.startsWith('Col_')) {
                return colStr.charCodeAt(4) - 65; // A=0, B=1, etc
              }
              return -1;
            };

            const dateCol = getColIndex(columnMap.fields.date);
            const numMovCol = getColIndex(columnMap.fields.numMov);
            const naturezaCol = getColIndex(columnMap.fields.natureza);
            const valorCol = getColIndex(columnMap.fields.valor);
            const obsCol = getColIndex(columnMap.fields.obs || '');
            const sourceAccountCol = getColIndex(columnMap.fields.sourceAccount || '');
            
            if (dateCol < 0 || numMovCol < 0 || naturezaCol < 0 || valorCol < 0) continue;

            const dateStr = row[dateCol];
            const numMov = String(row[numMovCol] || '').trim();
            const natureza = String(row[naturezaCol] || '').toUpperCase().trim();
            const valorStr = row[valorCol];
            
            if (!dateStr || !numMov || !natureza || !valorStr) continue;
            if (natureza !== 'D' && natureza !== 'C') continue;

            const date = parseDate(dateStr, 'dd/MM/yyyy');
            const valor = parseNumber(valorStr, ',', '.');
            
            if (!date || typeof valor !== 'number') continue;
            
            movements.push({
              date: date.toISOString().split('T')[0],
              numMov,
              natureza: natureza as 'D' | 'C',
              valor,
              obs: obsCol >= 0 ? String(row[obsCol] || '') : '',
              sourceAccount: sourceAccountCol >= 0 ? String(row[sourceAccountCol] || '') : undefined,
            });
          } catch {
            // Skip invalid rows
            continue;
          }
        }

        setTotalMovements(movements.length);
        setMovements(movements);
        addLog('info', `${movements.length} movimentos carregados do ficheiro`);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(`Erro ao processar ficheiro: ${errorMsg}`);
        addLog('error', `Erro ao processar ficheiro: ${errorMsg}`);
      } finally {
        setLoading(false);
      }
    };

    loadMovements();
  }, [state.file, state.columnMapping, organizationInput, setMovements, setColumnMapping, addLog]);

  // Calculate filtered count
  useEffect(() => {
    let filtered = state.movements;

    if (dateStartInput) {
      filtered = filtered.filter((m) => new Date(m.date) >= new Date(dateStartInput));
    }
    if (dateEndInput) {
      filtered = filtered.filter((m) => new Date(m.date) <= new Date(dateEndInput));
    }

    setFilteredMovements(filtered.length);
  }, [state.movements, dateStartInput, dateEndInput]);

  const handleApplyFilters = () => {
    // Save all filter selections to context
    setDateStart(dateStartInput || null);
    setDateEnd(dateEndInput || null);
    setViewType(viewTypeInput);
    setMultipleCompanies(multipleCompaniesInput);
    setCurrency(currencyInput);
    setOrganization(organizationInput || null);

    const org = organizationInput ? getAllOrganizations().find(o => o.id === organizationInput) : null;
    const orgName = org?.name || organizationInput;

    addLog(
      'info',
      `Filtros aplicados: Período ${dateStartInput || 'Início'} até ${dateEndInput || 'Fim'} | Visão: ${viewTypeInput} | Moeda: ${currencyInput} | Empresa: ${orgName}`
    );

    goToStep('preview');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Analisando ficheiro Excel...</div>
        </CardContent>
      </Card>
    );
  }

  const organizations = getAllOrganizations();

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center gap-2 text-sm">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold">
          2
        </div>
        <span className="font-semibold">Filtros e Validação</span>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Info Banner - Matches Desktop */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>Ficheiro:</strong> {state.file?.name || 'N/A'} | 
          <strong className="ml-2">Total de movimentos:</strong> <span className="font-semibold">{totalMovements}</span> |
          <strong className="ml-2">Após filtros:</strong> <span className="font-semibold">{filteredMovements}</span>
        </AlertDescription>
      </Alert>

      {/* Main Filters Grid - Matching Desktop Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Row 1: Ficheiro + Visão */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📁 Ficheiro Excel</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-mono text-muted-foreground">{state.file?.name || 'Nenhum'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">↔️ Tipo de Visão (B/C)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={viewTypeInput} onValueChange={(val) => setViewTypeInput(val as 'C' | 'B')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="B">
                  <strong>Bancária (B)</strong> - Prioriza valor com sinal
                </SelectItem>
                <SelectItem value="C">
                  <strong>Contabilística (C)</strong> - Usa natureza e contas
                </SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Row 2: Datas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📅 Data Inicial</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="date"
              value={dateStartInput}
              onChange={(e) => setDateStartInput(e.target.value)}
              placeholder="DD/MM/YYYY"
            />
            <p className="text-xs text-muted-foreground mt-2">Deixe vazio para desde o início</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📅 Data Final</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="date"
              value={dateEndInput}
              onChange={(e) => setDateEndInput(e.target.value)}
              placeholder="DD/MM/YYYY"
            />
            <p className="text-xs text-muted-foreground mt-2">Deixe vazio para até ao fim</p>
          </CardContent>
        </Card>

        {/* Row 3: Saldos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">💰 Saldo Inicial</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="number"
              value={startBalanceInput}
              onChange={(e) => setStartBalanceInput(e.target.value)}
              placeholder="0.00"
              step="0.01"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">💰 Saldo Final</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="number"
              value={endBalanceInput}
              onChange={(e) => setEndBalanceInput(e.target.value)}
              placeholder="0.00"
              step="0.01"
            />
          </CardContent>
        </Card>

        {/* Row 4: Moeda + Empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">💱 Moeda</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={currencyInput} onValueChange={(val) => setCurrencyInput(val)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EUR">EUR (Euro)</SelectItem>
                <SelectItem value="USD">USD (Dólar)</SelectItem>
                <SelectItem value="GBP">GBP (Libra)</SelectItem>
                <SelectItem value="JPY">JPY (Iene)</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🏢 Empresa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={organizationInput} onValueChange={(val) => setOrganizationInput(val)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione empresa..." />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Row 5: Multiempresa */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">⚙️ Configurações Adicionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={multipleCompaniesInput}
                onChange={(e) => setMultipleCompaniesInput(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm font-medium">☐ Modo Multi-empresa</span>
            </label>
            {multipleCompaniesInput && (
              <p className="text-xs text-muted-foreground">
                Parâmetros e mapeamentos serão aplicados por empresa
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => goToStep('upload')} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Button>
        <Button onClick={handleApplyFilters} className="flex-1">
          Continuar para Prévia
        </Button>
      </div>
    </div>
  );
};

export default FilterPage;
