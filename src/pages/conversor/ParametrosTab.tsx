/**
 * Parâmetros Tab - Mapeamento configuration
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle } from 'lucide-react';
import { useConverter } from '@/context/ConverterContext';

const ParametrosTab: React.FC = () => {
  const { state, setParametros } = useConverter();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  // Local editable state
  const [form, setForm] = useState(state.parametros);

  const handleChange = (field: string, value: string) => {
    setForm({
      ...form,
      [field]: value,
    });
  };

  const handleSave = () => {
    setParametros(form);
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCancel = () => {
    setForm(state.parametros);
    setEditing(false);
  };

  return (
    <div className="space-y-6">
      {saved && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">Parâmetros salvos com sucesso!</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            ⚙️ Parâmetros de Mapeamento
            {!editing && (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                Editar
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            Configure os parâmetros que serão utilizados na geração do ficheiro SWIFT MT940
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Referência */}
            <div>
              <Label htmlFor="referencia">Referência</Label>
              <Input
                id="referencia"
                value={form.referencia}
                onChange={(e) => handleChange('referencia', e.target.value)}
                placeholder="ex: salias"
                disabled={!editing}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Identifica a execução (vai para :20: no SWIFT)
              </p>
            </div>

            {/* Conta */}
            <div>
              <Label htmlFor="conta">Conta (Banco)</Label>
              <Input
                id="conta"
                value={form.conta}
                onChange={(e) => handleChange('conta', e.target.value)}
                placeholder="ex: BAI1"
                disabled={!editing}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Código do banco/conta no header
              </p>
            </div>

            {/* Nº Conta */}
            <div>
              <Label htmlFor="nconta">Nº Conta (IBAN)</Label>
              <Input
                id="nconta"
                value={form.nConta}
                onChange={(e) => handleChange('nConta', e.target.value)}
                placeholder="ex: 1005412286"
                disabled={!editing}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Número de conta/IBAN (vai para :25:)
              </p>
            </div>

            {/* Moeda */}
            <div>
              <Label htmlFor="moeda">Moeda</Label>
              <Input
                id="moeda"
                value={form.moeda}
                onChange={(e) => handleChange('moeda', e.target.value)}
                placeholder="ex: AKZ, EUR"
                disabled={!editing}
                maxLength={3}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Código da moeda (3 letras)
              </p>
            </div>

            {/* Sequência */}
            <div>
              <Label htmlFor="sequencia">Sequência</Label>
              <Input
                id="sequencia"
                value={form.sequencia}
                onChange={(e) => handleChange('sequencia', e.target.value)}
                placeholder="ex: 1"
                disabled={!editing}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Número sequencial (vai para :28C:)
              </p>
            </div>

            {/* Doc. Crédito */}
            <div>
              <Label htmlFor="doc-credito">Doc. Crédito</Label>
              <Input
                id="doc-credito"
                value={form.docCredito}
                onChange={(e) => handleChange('docCredito', e.target.value)}
                placeholder="ex: DVD"
                disabled={!editing}
                maxLength={3}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Código para movimentos de crédito
              </p>
            </div>

            {/* Doc. Débito */}
            <div>
              <Label htmlFor="doc-debito">Doc. Débito</Label>
              <Input
                id="doc-debito"
                value={form.docDebito}
                onChange={(e) => handleChange('docDebito', e.target.value)}
                placeholder="ex: DVC"
                disabled={!editing}
                maxLength={3}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Código para movimentos de débito
              </p>
            </div>
          </div>

          {editing && (
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                Guardar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base">ℹ️ Sobre os Parâmetros</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-blue-900">
          <p>
            <strong>:20:</strong> Referência que identifica o ficheiro
          </p>
          <p>
            <strong>:25:</strong> Nº da conta a que o ficheiro se refere
          </p>
          <p>
            <strong>:28C:</strong> Sequência para distinguir múltiplas remessas
          </p>
          <p>
            <strong>Doc. Crédito/Débito:</strong> Códigos que identificam o tipo de documento no ERP destino
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ParametrosTab;
