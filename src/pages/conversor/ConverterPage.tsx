/**
 * ConverterPage - Main SWIFT MT940 converter interface
 */

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {Card, CardContent} from '@/components/ui/card';
import { AlertCircle, Download } from 'lucide-react';
import MovimentosTab from './MovimentosTab';
import ParametrosTab from './ParametrosTab';
import MapeamentoContasTab from './MapeamentoContasTab';
import { useConverter } from '@/context/ConverterContext';
import { gerarStackSWIFT, construirFicheirSWIFT } from '@/lib/swiftConversion';

const ConverterPage: React.FC = () => {
  const { state } = useConverter();
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState('');
  const [gerado, setGerado] = useState(false);

  const handleProcessar = () => {
    setErro('');

    // Validações
    if (!state.excelData || state.movimentosFiltrados.length === 0) {
      setErro('Carregue um ficheiro Excel e aplique filtros primeiro');
      return;
    }

    if (!state.parametros.referencia || !state.parametros.nConta || !state.parametros.moeda) {
      setErro('Preencha todos os parâmetros obrigatórios');
      return;
    }

    try {
      setProcessando(true);

      // Gerar stack SWIFT
      const stack = gerarStackSWIFT(
        state.parametros,
        state.filtros,
        state.movimentosFiltrados
      );

      // Construir ficheiro completo
      const ficheiro = construirFicheirSWIFT(state.parametros, stack, state.parametros.conta);

      // Download
      const blob = new Blob([ficheiro], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Swift_${state.parametros.referencia}_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setGerado(true);
      setTimeout(() => setGerado(false), 3000);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao gerar ficheiro');
    } finally {
      setProcessando(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Conversor Excel para SWIFT MT940</h1>
          <p className="text-muted-foreground">
            Converta ficheiros Excel para formato SWIFT MT940 com configuração de parâmetros e mapeamento de contas
          </p>
        </div>

        {/* Status Messages */}
        {erro && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}

        {gerado && (
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-900">
              ✓ Ficheiro SWIFT gerado e transferido com sucesso!
            </AlertDescription>
          </Alert>
        )}

        {/* Main Tabs */}
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="movimentos" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="movimentos">📋 Movimentos</TabsTrigger>
                <TabsTrigger value="parametros">⚙️ Parâmetros</TabsTrigger>
                <TabsTrigger value="mapeamento">🔗 Mapeamento Contas</TabsTrigger>
              </TabsList>

              <TabsContent value="movimentos" className="space-y-4">
                <MovimentosTab />
              </TabsContent>

              <TabsContent value="parametros" className="space-y-4">
                <ParametrosTab />
              </TabsContent>

              <TabsContent value="mapeamento" className="space-y-4">
                <MapeamentoContasTab />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Process Button */}
        <div className="flex gap-2 justify-end">
          <Button
            onClick={handleProcessar}
            disabled={processando || !state.movimentosFiltrados || state.movimentosFiltrados.length === 0}
            size="lg"
            className="gap-2"
          >
            <Download className="h-5 w-5" />
            {processando ? 'Processando...' : 'Processar e Descarregar'}
          </Button>
        </div>

        {/* Info section */}
        {state.movimentosFiltrados.length > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Movimentos</p>
                  <p className="text-lg font-semibold">{state.movimentosFiltrados.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Período</p>
                  <p className="text-sm font-mono">{state.filtros.dataInicial} até {state.filtros.dataFinal}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Referência</p>
                  <p className="text-sm font-mono">{state.parametros.referencia}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Visão</p>
                  <p className="text-sm font-semibold">{state.filtros.tipoVisao === 'B' ? 'Bancária' : 'Contabilística'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ConverterPage;
