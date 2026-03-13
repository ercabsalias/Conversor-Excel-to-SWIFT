/**
 * Movimentos Tab - Main converter interface
 */

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
import { AlertCircle, Upload } from 'lucide-react';
import { lerFicheirExcel } from '@/lib/excelReader';
import { useConverter } from '@/context/ConverterContext';

const MovimentosTab: React.FC = () => {
  const { state, setFile, setExcelData, setFiltros, setMovimentosFiltrados } = useConverter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Local state para inputs de filtro
  const [dataInicial, setDataInicial] = useState(state.filtros.dataInicial);
  const [dataFinal, setDataFinal] = useState(state.filtros.dataFinal);
  const [saldoInicial, setSaldoInicial] = useState(String(state.filtros.saldoInicial));
  const [saldoFinalInput, setSaldoFinalInput] = useState(String(state.filtros.saldoFinalInput));
  const [saldoInicialTipo, setSaldoInicialTipo] = useState<'C' | 'D'>(state.filtros.saldoInicialTipo);
  const [saldoFinalTipo, setSaldoFinalTipo] = useState<'C' | 'D'>(state.filtros.saldoFinalTipo);
  const [tipoVisao, setTipoVisao] = useState<'B' | 'C'>(state.filtros.tipoVisao);
  const [multiEmpresas, setMultiEmpresas] = useState(state.filtros.multiEmpresas);

  // Sincronizar estado com contexto quando os filtros mudam
  useEffect(() => {
    console.log('📤 [useEffect] Sincronizando estado com contexto:', {
      dataInicial,
      dataFinal,
      saldoInicial,
    });
  }, [dataInicial, dataFinal, saldoInicial, saldoFinalInput]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log('❌ [handleFileChange] Sem ficheiro selecionado');
      return;
    }

    try {
      console.log('🚀 [handleFileChange] Iniciando processamento do ficheiro:', file.name);
      setLoading(true);
      setError('');
      
      // Marcar estado do ficheiro
      console.log('📁 [handleFileChange] Guardando referência do ficheiro');
      setFile(file);

      console.log('🔄 [handleFileChange] Chamando lerFicheirExcel...');
      const excelData = await lerFicheirExcel(file);
      
      console.log('📊 [handleFileChange] Excel lido com sucesso:', {
        headers: excelData.headers,
        totalRows: excelData.rows.length,
        firstRow: excelData.rows[0],
      });
      
      // Actualizar estado do Excel
      setExcelData(excelData);
      console.log('✅ [handleFileChange] setExcelData chamado');

      // Auto-set dates from first and last movement
      if (excelData.rows.length > 0) {
        const firstDate = excelData.rows[0].data;
        const lastDate = excelData.rows[excelData.rows.length - 1].data;
        console.log('📅 [handleFileChange] Datas detectadas:', { firstDate, lastDate });
        setDataInicial(firstDate);
        setDataFinal(lastDate);
        console.log('📅 [handleFileChange] Datas actualizadas no estado local');
      } else {
        console.warn('⚠️  [handleFileChange] Nenhum movimento válido encontrado');
        setError('Nenhum movimento válido encontrado no ficheiro');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao processar ficheiro';
      console.error('💥 [handleFileChange] Erro:', err);
      setError(errorMsg);
    } finally {
      setLoading(false);
      console.log('✅ [handleFileChange] Concluído');
    }
  };

  const handleActualizar = () => {
    console.log('🔍 [handleActualizar] Iniciando...');
    console.log('📊 [handleActualizar] Estado do contexto:', { 
      excelData: state.excelData ? { rows: state.excelData.rows.length } : null,
      file: state.file ? { name: state.file.name } : null,
      movimentosFiltrados: state.movimentosFiltrados.length 
    });
    console.log('📝 [handleActualizar] Filtros locais:', { dataInicial, dataFinal });

    // Fallback: se não tem excelData mas tem file, tentar reler
    if (!state.excelData && state.file) {
      console.warn('⚠️  [handleActualizar] Ficheiro marcado mas excelData vazio - tentando reler...');
      lerFicheirExcel(state.file).then((data) => {
        setExcelData(data);
        console.log('✅ [handleActualizar] Re-leitura bem sucedida');
      }).catch((err) => {
        console.error('❌ [handleActualizar] Erro ao reler ficheiro:', err);
        setError('Erro ao processar ficheiro. Tente recarregar.');
      });
      return;
    }

    if (!state.excelData) {
      console.error('❌ [handleActualizar] Nenhum ficheiro carregado');
      setError('Nenhum ficheiro carregado. Selecione um ficheiro Excel.');
      return;
    }
    if (state.excelData.rows.length === 0) {
      console.error('❌ [handleActualizar] Ficheiro não contém movimentos válidos');
      setError('Ficheiro carregado mas não contém movimentos válidos');
      return;
    }

    try {
      setError('');

      // Validar datas
      if (!dataInicial || !dataFinal) {
        console.error('❌ [handleActualizar] Datas não definidas');
        setError('Defina data inicial e final');
        return;
      }

      const dataInicialDate = new Date(dataInicial);
      const dataFinalDate = new Date(dataFinal);

      console.log('📅 [handleActualizar] Rango de datas:', { dataInicial, dataFinal, dataInicialDate, dataFinalDate });

      if (dataInicialDate > dataFinalDate) {
        console.error('❌ [handleActualizar] Data inicial > data final');
        setError('Data inicial não pode ser maior que data final');
        return;
      }

      // Filtrar movimentos por data
      console.log('🔍 [handleActualizar] Filtrando', state.excelData.rows.length, 'movimentos...');
      const filtrados = state.excelData.rows.filter((mov) => {
        const movDate = new Date(mov.data);
        return movDate >= dataInicialDate && movDate <= dataFinalDate;
      });

      console.log(`✅ [handleActualizar] Filtragem completa: ${filtrados.length} movimentos encontrados`);

      if (filtrados.length === 0) {
        console.error('❌ [handleActualizar] Nenhum movimento no intervalo');
        setError('Nenhum movimento encontrado no período selecionado');
        return;
      }

      // Atualizar contexto
      console.log('💾 [handleActualizar] Actualizando contexto...');
      setFiltros({
        dataInicial,
        dataFinal,
        saldoInicial: parseFloat(saldoInicial) || 0,
        saldoFinalInput: parseFloat(saldoFinalInput) || 0,
        saldoInicialTipo,
        saldoFinalTipo,
        tipoVisao,
        multiEmpresas,
      });

      setMovimentosFiltrados(filtrados);
      console.log('✅ [handleActualizar] Contexto actualizado com sucesso');
      setError('');
    } catch (err) {
      console.error('💥 [handleActualizar] Erro:', err);
      setError(err instanceof Error ? err.message : 'Erro ao filtrar movimentos');
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Ficheiro Excel
          </CardTitle>
          <CardDescription>Selecione o ficheiro Excel comcolunas: Data, NumMov, Natureza, Valor, Descrição</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              disabled={loading}
              className="flex-1"
            />
            {state.file && <span className="text-sm text-green-600">✓ {state.file.name}</span>}
          </div>
        </CardContent>
      </Card>

      {state.excelData && (
        <>
          {/* Filters Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtros e Configuração</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Row 1: Tipo de Visão, Multiempresas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipo-visao">Tipo de Visão</Label>
                  <Select value={tipoVisao} onValueChange={(val) => setTipoVisao(val as 'B' | 'C')}>
                    <SelectTrigger id="tipo-visao">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="B">
                        <strong>Bancária (B)</strong> - Positivo = Crédito
                      </SelectItem>
                      <SelectItem value="C">
                        <strong>Contabilística (C)</strong> - Invertida
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Define como os sinais são interpretados
                  </p>
                </div>

                <div className="flex items-end pb-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={multiEmpresas}
                      onChange={(e) => setMultiEmpresas(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm font-medium">Multiempresas</span>
                  </label>
                </div>
              </div>

              {/* Row 2: Datas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="data-ini">Data Inicial</Label>
                  <Input
                    id="data-ini"
                    type="date"
                    value={dataInicial}
                    onChange={(e) => setDataInicial(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="data-fin">Data Final</Label>
                  <Input
                    id="data-fin"
                    type="date"
                    value={dataFinal}
                    onChange={(e) => setDataFinal(e.target.value)}
                  />
                </div>
              </div>

              {/* Row 3: Saldos */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="saldo-ini">Saldo Inicial</Label>
                  <Input
                    id="saldo-ini"
                    type="number"
                    value={saldoInicial}
                    onChange={(e) => setSaldoInicial(e.target.value)}
                    step="0.01"
                  />
                </div>
                <div>
                  <Label htmlFor="tipo-ini">Tipo</Label>
                  <Select value={saldoInicialTipo} onValueChange={(val) => setSaldoInicialTipo(val as 'C' | 'D')}>
                    <SelectTrigger id="tipo-ini">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="C">Crédito (C)</SelectItem>
                      <SelectItem value="D">Débito (D)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="saldo-fin">Saldo Final</Label>
                  <Input
                    id="saldo-fin"
                    type="number"
                    value={saldoFinalInput}
                    onChange={(e) => setSaldoFinalInput(e.target.value)}
                    step="0.01"
                  />
                </div>
                <div>
                  <Label htmlFor="tipo-fin">Tipo</Label>
                  <Select value={saldoFinalTipo} onValueChange={(val) => setSaldoFinalTipo(val as 'C' | 'D')}>
                    <SelectTrigger id="tipo-fin">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="C">Crédito (C)</SelectItem>
                      <SelectItem value="D">Débito (D)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Actualizar Button */}
              <Button onClick={handleActualizar} className="w-full md:w-auto">
                Actualizar
              </Button>
            </CardContent>
          </Card>

          {/* Table Section */}
          {state.movimentosFiltrados.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Movimentos Filtrados</CardTitle>
                <CardDescription>
                  Total: {state.movimentosFiltrados.length} movimentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold">Data</th>
                        <th className="px-4 py-2 text-left font-semibold">NumMov</th>
                        <th className="px-4 py-2 text-left font-semibold">Natureza</th>
                        <th className="px-4 py-2 text-right font-semibold">Valor</th>
                        <th className="px-4 py-2 text-left font-semibold">Descrição</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.movimentosFiltrados.map((mov, idx) => (
                        <tr key={idx} className="border-t hover:bg-muted/50">
                          <td className="px-4 py-2">{mov.data}</td>
                          <td className="px-4 py-2">{mov.numMov}</td>
                          <td className="px-4 py-2">
                            <span
                              className={`font-semibold ${
                                mov.natureza === 'D' ? 'text-red-600' : 'text-green-600'
                              }`}
                            >
                              {mov.natureza}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right font-mono">
                            {mov.valor.toLocaleString('pt-PT', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-4 py-2 text-muted-foreground truncate max-w-xs">
                            {mov.descricao}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default MovimentosTab;
