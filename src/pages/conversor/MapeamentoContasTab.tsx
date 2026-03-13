/**
 * Mapeamento Contas Tab - Account mapping configuration
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import { MapeamentoContas } from '@/types/swift';
import { useConverter } from '@/context/ConverterContext';

const MapeamentoContasTab: React.FC = () => {
  const { state, addMapeamentoConta, removeMapeamentoConta } = useConverter();
  const [formAberto, setFormAberto] = useState(false);
  const [contaFicheiro, setContaFicheiro] = useState('');
  const [contaErp, setContaErp] = useState('');
  const [error, setError] = useState('');

  const handleAdicionar = () => {
    setError('');

    if (!contaFicheiro.trim() || !contaErp.trim()) {
      setError('Preencha ambos os campos');
      return;
    }

    // Verificar se já existe
    if (state.mapeamentosContas.some((m) => m.contaFicheiro === contaFicheiro)) {
      setError('Esta conta ficheiro já existe');
      return;
    }

    const novo: MapeamentoContas = {
      id: Date.now().toString(),
      contaFicheiro,
      contaErp,
    };

    addMapeamentoConta(novo);
    setContaFicheiro('');
    setContaErp('');
    setFormAberto(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>📋 Mapeamento de Contas</span>
            {!formAberto && (
              <Button size="sm" onClick={() => setFormAberto(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Mapeamento
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            Configure o mapeamento entre as contas do ficheiro Excel e as contas do ERP
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Form */}
          {formAberto && (
            <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="conta-ficheiro">Conta Ficheiro</Label>
                  <Input
                    id="conta-ficheiro"
                    value={contaFicheiro}
                    onChange={(e) => setContaFicheiro(e.target.value)}
                    placeholder="ex: 100541"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="conta-erp">Conta ERP</Label>
                  <Input
                    id="conta-erp"
                    value={contaErp}
                    onChange={(e) => setContaErp(e.target.value)}
                    placeholder="ex: 11000"
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFormAberto(false);
                    setContaFicheiro('');
                    setContaErp('');
                    setError('');
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleAdicionar}>
                  Guardar
                </Button>
              </div>
            </div>
          )}

          {/* Table */}
          {state.mapeamentosContas.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Conta Ficheiro</th>
                    <th className="px-4 py-3 text-left font-semibold">Conta ERP</th>
                    <th className="px-4 py-3 text-right font-semibold w-16">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {state.mapeamentosContas.map((map) => (
                    <tr key={map.id} className="border-t hover:bg-muted/50">
                      <td className="px-4 py-3 font-mono">{map.contaFicheiro}</td>
                      <td className="px-4 py-3 font-mono">{map.contaErp}</td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeMapeamentoConta(map.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum mapeamento configurado ainda
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-amber-50 border-amber-200">
        <CardHeader>
          <CardTitle className="text-base">⚠️ Nota Importante</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-amber-900 space-y-2">
          <p>
            O mapeamento de contas é utilizado quando o modo <strong>Multiempresas</strong> está ativo.
          </p>
          <p>
            Cada movimento do ficheiro Excel será associado à Conta ERP correspondente baseado no mapeamento configurado.
          </p>
          <p>
            Se um movimento não tiver mapeamento, será utilizada a conta ficheiro original.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MapeamentoContasTab;
