/**
 * SWIFT Generator Component
 * Final step: generate and download SWIFT file
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Download } from 'lucide-react';
import { Movement, Parameters, Mapping } from '@/types';
import { loadParametersFromStorage, loadMappingsFromStorage } from '@/services/seed';
import { generateSwift, downloadSwiftFile } from '@/lib/swift';

interface SwiftGeneratorProps {
  file: File;
}

const SwiftGenerator = ({ file }: SwiftGeneratorProps) => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [parameters, setParameters] = useState<Parameters | null>(null);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [result, setResult] = useState<{ blob: Blob; filename: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [successCount, setSuccessCount] = useState(0);

  useEffect(() => {
    const generate = async () => {
      try {
        setLoading(true);
        setError('');

        // Load data
        const movementsStr = sessionStorage.getItem('parsed_movements');
        if (!movementsStr) {
          throw new Error('Dados de movimentos não encontrados');
        }

        const parsedMovements: Movement[] = JSON.parse(movementsStr);
        const params = loadParametersFromStorage();
        const mappingsList = loadMappingsFromStorage();

        setMovements(parsedMovements);
        setParameters(params);
        setMappings(mappingsList);

        // Generate SWIFT
        const { blob, filename } = generateSwift(parsedMovements, params, mappingsList);
        setResult({ blob, filename });

        // Count successful mappings
        let count = 0;
        for (const mov of parsedMovements) {
          const sourceAccount = mov.sourceAccount || '';
          const mapping = mappingsList.find((m) => {
            if (m.matchType === 'exact') {
              return sourceAccount === m.sourceAccount;
            } else if (m.matchType === 'startsWith') {
              return sourceAccount.startsWith(m.sourceAccount);
            } else if (m.matchType === 'regex') {
              try {
                const regex = new RegExp(m.sourceAccount);
                return regex.test(sourceAccount);
              } catch {
                return false;
              }
            }
            return false;
          });

          if (mapping || params.defaultTargetAccount) {
            count++;
          }
        }
        setSuccessCount(count);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    generate();
  }, [file]);

  const handleDownload = () => {
    if (result) {
      downloadSwiftFile(result.blob, result.filename);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Gerando arquivo SWIFT...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>4. Geração SWIFT</CardTitle>
        <CardDescription>
          Arquivo pronto para download
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : result ? (
          <>
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                ✓ {successCount} de {movements.length} movimentos processados com sucesso
              </AlertDescription>
            </Alert>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Nome do arquivo:</p>
                <p className="font-mono font-semibold">{result.filename}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Empresa:</p>
                <p className="font-semibold">{parameters?.companyName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Movimentos processados:</p>
                <p className="font-semibold">{successCount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Formato de saída:</p>
                <p className="font-mono text-sm">
                  Data|NumMov|ContaDestino|Natureza|Valor|Obs
                </p>
              </div>
            </div>

            <Button
              onClick={handleDownload}
              className="w-full"
              size="lg"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar Arquivo SWIFT
            </Button>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default SwiftGenerator;
