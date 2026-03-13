import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ChevronLeft, Download, CheckCircle2 } from 'lucide-react';
import { useWorkflow } from '@/context/WorkflowContext';
import { useAuth } from '@/hooks/useAuth';
import { getOrganizationParameters, getAllOrganizations } from '@/services/organizationsDb';

const GeneratePage: React.FC = () => {
  const { state, addLog, goToStep } = useWorkflow();
  const { user } = useAuth();
  
  const [generating, setGenerating] = useState(false);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string>('');

  const handleGenerateSWIFT = async () => {
    try {
      setGenerating(true);
      setError('');
      addLog('info', 'Iniciando geração do ficheiro SWIFT...');

      // Get parameters from organization database
      const parameters = state.selectedOrganizationId
        ? getOrganizationParameters(state.selectedOrganizationId)
        : null;

      const orgName = state.selectedOrganizationId
        ? getAllOrganizations().find((o) => o.id === state.selectedOrganizationId)?.name || 'Empresa'
        : user?.username || 'Empresa';

      // Filter movements by date range
      let movements = state.movements;
      if (state.dateStart) {
        movements = movements.filter((m) => new Date(m.date) >= new Date(state.dateStart));
      }
      if (state.dateEnd) {
        movements = movements.filter((m) => new Date(m.date) <= new Date(state.dateEnd));
      }

      // Apply view type filter (if needed)
      if (state.viewType === 'C') {
        // Contabilistic view - filter by natureza
        movements = movements.filter((m) => m.natureza === 'D' || m.natureza === 'C');
      }

      // Validate movements
      if (movements.length === 0) {
        setError('Nenhum movimento para processar. Verifique os filtros aplicados.');
        addLog('error', 'Nenhum movimento para processar');
        setGenerating(false);
        return;
      }

      // Build SWIFT lines
      const swiftLines: string[] = [];

      // Add header
      swiftLines.push(`EMPRESA: ${parameters?.referencia || orgName}`);
      swiftLines.push(
        `DATA: ${new Date().toLocaleDateString('pt-PT')} | PERÍODO: ${state.dateStart || 'Início'} até ${state.dateEnd || 'Fim'}`
      );
      swiftLines.push(`VISÃO: ${state.viewType === 'C' ? 'Contabilística' : 'Bancária'} | MOEDA: ${state.currency}`);
      swiftLines.push('---');

      // Add movements
      movements.forEach((mov) => {
        const valor = mov.valor.toLocaleString('pt-PT', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

        swiftLines.push(
          `${new Date(mov.date).toLocaleDateString('pt-PT')}|${mov.numMov}|${mov.natureza}|${valor}|${mov.obs || ''}`
        );
      });

      // Add totals
      swiftLines.push('---');
      const totalDebits = movements
        .filter((m) => m.natureza === 'D')
        .reduce((sum, m) => sum + m.valor, 0);
      const totalCredits = movements
        .filter((m) => m.natureza === 'C')
        .reduce((sum, m) => sum + m.valor, 0);

      swiftLines.push(`TOTAL DÉBITOS: ${totalDebits.toFixed(2)}`);
      swiftLines.push(`TOTAL CRÉDITOS: ${totalCredits.toFixed(2)}`);
      swiftLines.push(`SALDO LÍQUIDO: ${(totalCredits - totalDebits).toFixed(2)}`);

      // Create blob
      const blob = new Blob([swiftLines.join('\n')], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);

      // Prepare download
      const filename = `SWIFT_${parameters?.referencia || orgName}_${new Date().toISOString().split('T')[0]}.txt`;
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setFinished(true);
      addLog('info', `Ficheiro SWIFT gerado com sucesso: ${filename} (${movements.length} movimentos)`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao gerar ficheiro: ${errorMsg}`);
      addLog('error', `Erro ao gerar ficheiro: ${errorMsg}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleNewConversion = () => {
    // Reset to upload and clear logs
    goToStep('upload');
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center gap-2 text-sm">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold">
          5
        </div>
        <span className="font-semibold">Gerar Ficheiro SWIFT</span>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo da Conversão</CardTitle>
          <CardDescription>Verifique os dados antes de gerar o ficheiro</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Ficheiro</div>
              <div className="font-semibold truncate">{state.file?.name}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Total de Movimentos</div>
              <div className="font-semibold">
                {state.movements.length}
                {state.dateStart || state.dateEnd
                  ? ` (${state.movements.filter((m) => {
                      if (state.dateStart && new Date(m.date) < new Date(state.dateStart)) return false;
                      if (state.dateEnd && new Date(m.date) > new Date(state.dateEnd)) return false;
                      return true;
                    }).length} após filtros)`
                  : ''}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Período</div>
              <div className="font-semibold">
                {state.dateStart || 'Início'} até {state.dateEnd || 'Fim'}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Tipo de Visão</div>
              <div className="font-semibold">
                {state.viewType === 'C' ? 'Contabilística' : 'Bancária'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generation Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Gerar Ficheiro SWIFT</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!finished ? (
            <>
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-900">
                  Clique em "Gerar" para criar o ficheiro SWIFT com os movimentos filtrados.
                </AlertDescription>
              </Alert>
              <Button
                onClick={handleGenerateSWIFT}
                disabled={generating}
                className="w-full gap-2"
                size="lg"
              >
                {generating ? 'Gerando...' : 'Gerar Ficheiro SWIFT'}
              </Button>
            </>
          ) : (
            <>
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  Ficheiro SWIFT gerado com sucesso! O ficheiro foi transferido para o seu computador.
                </AlertDescription>
              </Alert>
              <div className="flex gap-2">
                <Button onClick={handleNewConversion} variant="outline" className="flex-1">
                  Nova Conversão
                </Button>
                {downloadUrl && (
                  <Button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = downloadUrl;
                      link.download = `SWIFT_${new Date().toISOString().split('T')[0]}.txt`;
                      link.click();
                    }}
                    className="flex-1 gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Descarregar Novamente
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons (if not finished) */}
      {!finished && (
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => goToStep('preview')} className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
      )}
    </div>
  );
};

export default GeneratePage;
