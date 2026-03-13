/**
 * Column Mapper Component
 * Handles automatic and manual column mapping
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { readExcelFile } from '@/lib/excel';
import {
  detectHeaderRow,
  autoDetectColumnMapping,
  suggestColumnIndex,
} from '@/lib/parsing';
import { ColumnMapping } from '@/types';
import { useAuth } from '@/hooks/useAuth';

interface ColumnMapperProps {
  file: File;
  onComplete: () => void;
}

interface ColumnMapState {
  date: string | null;
  numMov: string | null;
  natureza: string | null;
  obs: string | null;
  valor: string | null;
  sourceAccount?: string | null;
}

const ColumnMapper = ({ file, onComplete }: ColumnMapperProps) => {
  const { user } = useAuth();
  const [rawData, setRawData] = useState<unknown[][]>([]);
  const [hasHeader, setHasHeader] = useState(true);
  const [headerRowIndex, setHeaderRowIndex] = useState<number | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapState>({
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
      try {
        setLoading(true);
        setError('');

        const data = await readExcelFile(file);
        setRawData(data.rawData);

        // Detect header
        const detectedHeader = detectHeaderRow(data.rawData);
        setHeaderRowIndex(detectedHeader);

        // Generate available columns
        const maxCols = Math.max(...data.rawData.slice(0, 5).map((row) => (Array.isArray(row) ? row.length : 0)));
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

          setColumnMapping((prev) => ({
            ...prev,
            date: auto.date,
            numMov: auto.numMov,
            natureza: auto.natureza,
            obs: auto.obs,
            valor: auto.valor,
            sourceAccount: auto.sourceAccount,
          }));
        }
      } catch (err) {
        setError(`Erro ao carregar arquivo: ${err instanceof Error ? err.message : 'Desconhecido'}`);
      } finally {
        setLoading(false);
      }
    };

    loadFile();
  }, [file]);

  const handleColumnSelect = (field: keyof ColumnMapState, value: string) => {
    setColumnMapping((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleToggleHeader = () => {
    setHasHeader(!hasHeader);
  };

  const handleApplyAndPreview = async () => {
    if (!columnMapping.date || !columnMapping.numMov || !columnMapping.natureza || !columnMapping.valor) {
      setError('Mapeamento incompleto. Todos os campos obrigatórios devem ser preenchidos.');
      return;
    }

    // Save column mapping to localStorage
    if (user?.companyId) {
      const sheetName = 'default';
      const mapping: ColumnMapping = {
        companyId: user.companyId,
        sheetName,
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

      sessionStorage.setItem('current_column_mapping', JSON.stringify(mapping));
    }

    onComplete();
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
    <Card>
      <CardHeader>
        <CardTitle>2. Mapeamento de Colunas</CardTitle>
        <CardDescription>
          Defina quais colunas correspondem aos campos de movimentação
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Header Toggle */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="has-header"
            checked={hasHeader}
            onChange={handleToggleHeader}
            className="rounded border-gray-300"
          />
          <Label htmlFor="has-header">Arquivo possui cabeçalho</Label>
          {headerRowIndex !== null && hasHeader && (
            <span className="text-xs text-muted-foreground">(Detectado na linha {headerRowIndex + 1})</span>
          )}
        </div>

        {/* Preview of Raw Data */}
        {rawData.length > 0 && (
          <div className="space-y-2">
            <Label>Prévia dos dados (primeiras 3 linhas):</Label>
            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  {rawData.slice(0, 3).map((row, idx) => (
                    <tr key={idx} className={idx === headerRowIndex ? 'bg-primary/10 font-semibold' : ''}>
                      {(Array.isArray(row) ? row : []).slice(0, 6).map((cell, colIdx) => (
                        <td key={colIdx} className="px-3 py-2 border-r last:border-r-0">
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

        {/* Column Mapping */}
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

          {/* Optional Fields */}
          {(['obs', 'sourceAccount'] as const).map((field) => (
            <div key={field} className="space-y-2">
              <Label htmlFor={`select-${field}`}>
                {field === 'obs' && '📝 Observação (Opcional)'}
                {field === 'sourceAccount' && '🏢 Conta Origem (Opcional)'}
              </Label>
              <Select
                value={columnMapping[field] || '__none__'}
                onValueChange={(val) => handleColumnSelect(field, val === '__none__' ? null : val)}
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

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button onClick={handleApplyAndPreview} className="flex-1">
            Aplicar Mapeamento e Previsualizar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ColumnMapper;
