/**
 * Preview Table Component
 * Shows parsed movements with error handling
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { readExcelFile } from '@/lib/excel';
import { parseNumber, parseDate, ParsingError } from '@/lib/parsing';
import { Movement, ColumnMapping, Parameters } from '@/types';
import { loadParametersFromStorage } from '@/services/seed';

interface PreviewTableProps {
  file: File;
  onComplete: () => void;
}

const PreviewTable = ({ file, onComplete }: PreviewTableProps) => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [errors, setErrors] = useState<ParsingError[]>([]);
  const [parameters, setParameters] = useState<Parameters | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const parseData = async () => {
      try {
        setLoading(true);

        // Load column mapping from sessionStorage
        const mappingStr = sessionStorage.getItem('current_column_mapping');
        if (!mappingStr) {
          throw new Error('Mapeamento de colunas não encontrado');
        }

        const columnMapping: ColumnMapping = JSON.parse(mappingStr);
        const params = loadParametersFromStorage();
        setParameters(params);

        // Read Excel data
        const data = await readExcelFile(file);
        const rawData = data.rawData;

        // Get column indices
        const getColIndex = (colRef: string): number => {
          const match = colRef.match(/Col_([A-Z])/);
          if (match) {
            return match[1].charCodeAt(0) - 65;
          }
          return -1;
        };

        const colIndices = {
          date: getColIndex(columnMapping.fields.date),
          numMov: getColIndex(columnMapping.fields.numMov),
          natureza: getColIndex(columnMapping.fields.natureza),
          obs: getColIndex(columnMapping.fields.obs || ''),
          valor: getColIndex(columnMapping.fields.valor),
          sourceAccount: columnMapping.fields.sourceAccount
            ? getColIndex(columnMapping.fields.sourceAccount)
            : -1,
        };

        // Parse rows
        const parsedMovements: Movement[] = [];
        const parseErrors: ParsingError[] = [];

        const startRow = columnMapping.hasHeader ? 1 : 0;

        for (let i = startRow; i < rawData.length; i++) {
          const row = rawData[i];
          if (!Array.isArray(row)) continue;

          const lineNumber = i + 1;
          let movement: Partial<Movement> = {};

          // Parse date
          const dateVal = row[colIndices.date];
          const parsedDate = parseDate(dateVal, params.dateFormat);
          if (!parsedDate) {
            parseErrors.push({
              lineNumber,
              column: 'data',
              value: dateVal,
              reason: `Data inválida para formato '${params.dateFormat}'`,
            });
            continue;
          }
          movement.date = parsedDate.toISOString().split('T')[0];

          // Parse numMov
          const numMov = String(row[colIndices.numMov] || '').trim();
          if (!numMov) {
            parseErrors.push({
              lineNumber,
              column: 'numMov',
              value: row[colIndices.numMov],
              reason: 'Número de movimento obrigatório',
            });
            continue;
          }
          movement.numMov = numMov;

          // Parse natureza
          const naturezaStr = String(row[colIndices.natureza] || '').toUpperCase().trim();
          if (naturezaStr !== 'D' && naturezaStr !== 'C') {
            parseErrors.push({
              lineNumber,
              column: 'natureza',
              value: row[colIndices.natureza],
              reason: "Natureza deve ser 'D' ou 'C'",
            });
            continue;
          }
          movement.natureza = naturezaStr as 'D' | 'C';

          // Parse valor
          const valorStr = row[colIndices.valor];
          const parsedValor = parseNumber(
            valorStr,
            params.decimalSeparator,
            params.thousandSeparator
          );
          if (parsedValor === null) {
            parseErrors.push({
              lineNumber,
              column: 'valor',
              value: valorStr,
              reason: 'Valor numérico inválido',
            });
            continue;
          }
          movement.valor = parsedValor;

          // Parse optional fields
          movement.obs = String(row[colIndices.obs] || '').trim();
          if (colIndices.sourceAccount >= 0) {
            movement.sourceAccount = String(row[colIndices.sourceAccount] || '').trim() || undefined;
          }

          parsedMovements.push(movement as Movement);
        }

        setMovements(parsedMovements);
        setErrors(parseErrors);

        // Save to sessionStorage for next step
        sessionStorage.setItem('parsed_movements', JSON.stringify(parsedMovements));
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
        setErrors([{
          lineNumber: 0,
          column: 'geral',
          value: '',
          reason: errorMsg,
        } as unknown as ParsingError]);
      } finally {
        setLoading(false);
      }
    };

    parseData();
  }, [file]);

  if (loading) {
    return <Card><CardContent className="pt-6">Processando dados...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>3. Prévia de Dados</CardTitle>
        <CardDescription>
          {movements.length} movimento(s) válido(s), {errors.length} erro(s)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>{errors.length} erro(s) encontrado(s):</strong>
              <ul className="mt-2 space-y-1">
                {errors.slice(0, 5).map((err, idx) => (
                  <li key={idx} className="text-xs">
                    Linha {err.lineNumber}: {err.column} → {err.reason}
                  </li>
                ))}
                {errors.length > 5 && <li className="text-xs">... e mais {errors.length - 5}</li>}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {movements.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Primeiros 10 movimentos válidos:</p>
            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2">Data</th>
                    <th className="px-3 py-2">Número</th>
                    <th className="px-3 py-2">D/C</th>
                    <th className="px-3 py-2">Valor</th>
                    <th className="px-3 py-2">Obs</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.slice(0, 10).map((m, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-3 py-2">{m.date}</td>
                      <td className="px-3 py-2">{m.numMov}</td>
                      <td className="px-3 py-2 font-semibold">{m.natureza}</td>
                      <td className="px-3 py-2 text-right">{m.valor.toFixed(2)}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{m.obs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Button onClick={onComplete} className="w-full">
          Continuar para Geração SWIFT
        </Button>
      </CardContent>
    </Card>
  );
};

export default PreviewTable;
