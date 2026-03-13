import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ChevronLeft } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { readExcelFile } from '@/lib/excel';
import {
  detectHeaderRow,
  autoDetectColumnMapping,
  suggestColumnIndex,
} from '@/lib/parsing';
import { ColumnMapping } from '@/types';
import { useWorkflow } from '@/context/WorkflowContext';
import { useAuth } from '@/hooks/useAuth';

interface ColumnMapState {
  date: string | null;
  numMov: string | null;
  natureza: string | null;
  obs: string | null;
  valor: string | null;
  sourceAccount?: string | null;
}

const MappingPage: React.FC = () => {
  const { state, setColumnMapping, goToStep, addLog } = useWorkflow();
  const { user } = useAuth();
  
  const [rawData, setRawData] = useState<unknown[][]>([]);
  const [hasHeader, setHasHeader] = useState(true);
  const [headerRowIndex, setHeaderRowIndex] = useState<number | null>(null);
  const [columnMapping, setLocalColumnMapping] = useState<ColumnMapState>({
    date: null,
    numMov: null,
    natureza: null,
    obs: null,
    valor: null,
    sourceAccount: null,
  });
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Load and analyze Excel file
  useEffect(() => {
    const loadFile = async () => {
      if (!state.file) return;

      try {
        setLoading(true);
        setError('');

        const data = await readExcelFile(state.file);
        setRawData(data.rawData);

        // Detect header
        const detectedHeader = detectHeaderRow(data.rawData);
        setHeaderRowIndex(detectedHeader);

        // Generate available columns
        const maxCols = Math.max(
          ...data.rawData.slice(0, 5).map((row) => (Array.isArray(row) ? row.length : 0))
        );
        const cols = Array.from({ length: maxCols }, (_, i) => {
          const letter = String.fromCharCode(65 + i);
          return `Col_${letter}`;
        });
        setAvailableColumns(cols);

        // Auto-detect mappings
        if (detectedHeader !== null && detectedHeader >= 0) {
          const auto = autoDetectColumnMapping(data.rawData, [
            'date',
            'numMov',
            'natureza',
            'obs',
            'valor',
            'sourceAccount',
          ]);

          setLocalColumnMapping((prev) => ({
            ...prev,
            date: auto.date,
            numMov: auto.numMov,
            natureza: auto.natureza,
            obs: auto.obs,
            valor: auto.valor,
            sourceAccount: auto.sourceAccount,
          }));
        }

        addLog('info', 'Ficheiro analisado e mapeamento automático aplicado');
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(`Erro ao carregar arquivo: ${errorMsg}`);
        addLog('error', `Erro ao carregar arquivo: ${errorMsg}`);
      } finally {
        setLoading(false);
      }
    };

    loadFile();
  }, [state.file, addLog]);

  const handleColumnSelect = (field: keyof ColumnMapState, value: string) => {
    setLocalColumnMapping((prev) => ({
      ...prev,
      [field]: value === '__none__' ? null : value,
    }));
  };

  const handleApplyMapping = async () => {
    if (!columnMapping.date || !columnMapping.numMov || !columnMapping.natureza || !columnMapping.valor) {
      setError('Mapeamento incompleto. Todos os campos obrigatórios devem ser preenchidos.');
      addLog('error', 'Mapeamento incompleto - campos obrigatórios faltando');
      return;
    }

    // Save column mapping to localStorage
    if (user?.companyId) {
      const mapping: ColumnMapping = {
        companyId: user.companyId,
        sheetName: 'default',
        hasHeader,
        fields: {
          date: columnMapping.date,
          numMov: columnMapping.numMov,
          natureza: columnMapping.natureza,
          obs: columnMapping.obs || '',
          valor: columnMapping.valor,
          sourceAccount: columnMapping.sourceAccount || undefined,
        },
      };

      setColumnMapping(mapping);
      sessionStorage.setItem('current_column_mapping', JSON.stringify(mapping));
      addLog('info', 'Mapeamento de colunas salvo com sucesso');
    }

    goToStep('filters');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Analisando arquivo...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center gap-2 text-sm">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold">
          2
        </div>
        <span className="font-semibold">Mapeamento de Colunas</span>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Column Mapping Card */}
      <Card>
        <CardHeader>
          <CardTitle>2. Mapeamento de Colunas</CardTitle>
          <CardDescription>
            Defina quais colunas correspondem aos campos de movimentação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Header Toggle */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="has-header"
              checked={hasHeader}
              onChange={(e) => setHasHeader(e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="has-header">Arquivo possui cabeçalho</Label>
            {headerRowIndex !== null && hasHeader && (
              <span className="text-xs text-muted-foreground">(Detectado na linha {headerRowIndex + 1})</span>
            )}
          </div>

          {/* Data Preview */}
          {rawData.length > 0 && (
            <div className="space-y-2">
              <Label>Prévia dos dados (primeiras 3 linhas):</Label>
              <div className="border rounded-lg overflow-x-auto max-h-40">
                <table className="w-full text-sm">
                  <tbody>
                    {rawData.slice(0, 3).map((row, idx) => (
                      <tr
                        key={idx}
                        className={
                          idx === headerRowIndex ? 'bg-primary/10 font-semibold' : ''
                        }
                      >
                        {(Array.isArray(row) ? row : []).slice(0, 6).map((cell, colIdx) => (
                          <td
                            key={colIdx}
                            className="px-3 py-2 border-r last:border-r-0 truncate max-w-xs"
                          >
                            {String(cell || '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Required Fields */}
          <div>
            <h3 className="font-semibold text-sm mb-4">Campos Obrigatórios</h3>
            <div className="grid grid-cols-2 gap-4">
              {(['date', 'numMov', 'natureza', 'valor'] as const).map((field) => (
                <div key={field} className="space-y-2">
                  <Label htmlFor={`select-${field}`}>
                    {field === 'date' && '📅 Data'}
                    {field === 'numMov' && '🔢 Número Mov'}
                    {field === 'natureza' && '↔️ Natureza (D/C)'}
                    {field === 'valor' && '💰 Valor'}
                  </Label>
                  <Select
                    value={columnMapping[field] || ''}
                    onValueChange={(val) => handleColumnSelect(field, val)}
                  >
                    <SelectTrigger id={`select-${field}`}>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableColumns.map((col) => (
                        <SelectItem key={col} value={col}>
                          {col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          {/* Optional Fields */}
          <div>
            <h3 className="font-semibold text-sm mb-4">Campos Opcionais</h3>
            <div className="grid grid-cols-2 gap-4">
              {(['obs', 'sourceAccount'] as const).map((field) => (
                <div key={field} className="space-y-2">
                  <Label htmlFor={`select-${field}`}>
                    {field === 'obs' && '📝 Observação'}
                    {field === 'sourceAccount' && '🏢 Conta Origem'}
                  </Label>
                  <Select
                    value={columnMapping[field] || '__none__'}
                    onValueChange={(val) => handleColumnSelect(field, val)}
                  >
                    <SelectTrigger id={`select-${field}`}>
                      <SelectValue placeholder="Nenhuma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Nenhuma</SelectItem>
                      {availableColumns.map((col) => (
                        <SelectItem key={col} value={col}>
                          {col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => goToStep('upload')} className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </Button>
            <Button onClick={handleApplyMapping} className="flex-1">
              Continuar para Filtros
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MappingPage;
