/**
 * Parameters Panel Component
 * Manage conversion parameters with full configuration
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Parameters } from '@/types';
import { getOrganizationParameters, updateOrganizationParameters, getAllOrganizations } from '@/services/organizationsDb';
import { CheckCircle } from 'lucide-react';

interface ParametersPanelProps {
  companyId?: string;
}

const ParametersPanel = ({ companyId }: ParametersPanelProps) => {
  const [parameters, setParameters] = useState<Parameters | null>(null);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState(companyId || '');

  useEffect(() => {
    const orgs = getAllOrganizations();
    setOrganizations(orgs);
    if (!selectedOrgId && orgs.length > 0) {
      setSelectedOrgId(orgs[0].id);
    }
  }, []);

  useEffect(() => {
    if (selectedOrgId) {
      const params = getOrganizationParameters(selectedOrgId);
      setParameters(params);
    }
  }, [selectedOrgId]);

  const handleChange = (field: keyof Parameters, value: unknown) => {
    if (parameters) {
      setParameters({
        ...parameters,
        [field]: value,
      });
      setSaved(false);
    }
  };

  const handleSave = () => {
    if (parameters && selectedOrgId) {
      updateOrganizationParameters(selectedOrgId, parameters);
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleCancel = () => {
    if (selectedOrgId) {
      const params = getOrganizationParameters(selectedOrgId);
      setParameters(params);
      setEditing(false);
    }
  };

  if (!parameters) return null;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          ⚙️ Parametros
          {saved && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Salvo
            </span>
          )}
        </CardTitle>
        <CardDescription>Configuração de conversão e parâmetros da empresa</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Organization Selector */}
        <div>
          <Label>Empresa</Label>
          <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
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
        </div>

        {editing ? (
          <Tabs defaultValue="empresa" className="space-y-3">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="empresa">Empresa</TabsTrigger>
              <TabsTrigger value="conversao">Conversão</TabsTrigger>
            </TabsList>

            {/* Tab: Empresa */}
            <TabsContent value="empresa" className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Referência</Label>
                  <Input
                    value={parameters.referencia || ''}
                    onChange={(e) => handleChange('referencia', e.target.value)}
                    placeholder="ex: teste"
                  />
                </div>
                <div>
                  <Label>Conta</Label>
                  <Input
                    value={parameters.conta || ''}
                    onChange={(e) => handleChange('conta', e.target.value)}
                    placeholder="ex: BA11"
                  />
                </div>
              </div>              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Nº Conta</Label>
                  <Input
                    value={parameters.nConta || ''}
                    onChange={(e) => handleChange('nConta', e.target.value)}
                    placeholder="ex: 1005412286"
                  />
                </div>
                <div>
                  <Label>Sequência</Label>
                  <Input
                    type="number"
                    value={parameters.sequencia || ''}
                    onChange={(e) => handleChange('sequencia', e.target.value)}
                    placeholder="ex: 1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Doc. Crédito</Label>
                  <Input
                    value={parameters.docCredito || ''}
                    onChange={(e) => handleChange('docCredito', e.target.value)}
                    placeholder="ex: DVD"
                  />
                </div>
                <div>
                  <Label>Doc. Débito</Label>
                  <Input
                    value={parameters.docDebito || ''}
                    onChange={(e) => handleChange('docDebito', e.target.value)}
                    placeholder="ex: DVC"
                  />
                </div>
              </div>

              <div>
                <Label>Moeda</Label>
                <Input
                  value={parameters.currency || ''}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  placeholder="ex: EUR"
                />
              </div>
            </TabsContent>

            {/* Tab: Conversão */}
            <TabsContent value="conversao" className="space-y-3 text-sm">
              <div>
                <Label>Formato de Data</Label>
                <Input
                  value={parameters.dateFormat}
                  onChange={(e) => handleChange('dateFormat', e.target.value)}
                  placeholder="dd/MM/yyyy"
                />
                <p className="text-xs text-muted-foreground mt-1">Exemplos: dd/MM/yyyy, yyyy-MM-dd, MM/dd/yyyy</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Separador Decimal</Label>
                  <Select
                    value={parameters.decimalSeparator}
                    onValueChange={(val) => handleChange('decimalSeparator', val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=",">,</SelectItem>
                      <SelectItem value="">.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Separador Milhar</Label>
                  <Select
                    value={parameters.thousandSeparator}
                    onValueChange={(val) => handleChange('thousandSeparator', val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">.</SelectItem>
                      <SelectItem value=",">,</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Casas Decimais</Label>
                  <Input
                    type="number"
                    min="1"
                    max="4"
                    value={parameters.rounding}
                    onChange={(e) => handleChange('rounding', parseInt(e.target.value, 10))}
                  />
                </div>
                <div>
                  <Label>Visualização Default</Label>
                  <Select
                    value={parameters.viewDefault}
                    onValueChange={(val) => handleChange('viewDefault', val as 'C' | 'B')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="C">Empresa (C)</SelectItem>
                      <SelectItem value="B">Banco (B)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-4">
            {/* View Mode: Empresa */}
            <div>
              <h3 className="font-semibold text-sm mb-2">👨‍💼 Dados da Empresa</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-muted/50 p-2 rounded">
                  <p className="text-muted-foreground">Referência</p>
                  <p className="font-mono font-semibold">{parameters.referencia || '-'}</p>
                </div>
                <div className="bg-muted/50 p-2 rounded">
                  <p className="text-muted-foreground">Conta</p>
                  <p className="font-mono font-semibold">{parameters.conta || '-'}</p>
                </div>
                <div className="bg-muted/50 p-2 rounded">
                  <p className="text-muted-foreground">Nº Conta</p>
                  <p className="font-mono font-semibold">{parameters.nConta || '-'}</p>
                </div>
                <div className="bg-muted/50 p-2 rounded">
                  <p className="text-muted-foreground">Sequência</p>
                  <p className="font-mono font-semibold">{parameters.sequencia || '-'}</p>
                </div>
                <div className="bg-muted/50 p-2 rounded">
                  <p className="text-muted-foreground">Doc. Crédito</p>
                  <p className="font-mono font-semibold">{parameters.docCredito || '-'}</p>
                </div>
                <div className="bg-muted/50 p-2 rounded">
                  <p className="text-muted-foreground">Doc. Débito</p>
                  <p className="font-mono font-semibold">{parameters.docDebito || '-'}</p>
                </div>
                <div className="bg-muted/50 p-2 rounded col-span-2">
                  <p className="text-muted-foreground">Moeda</p>
                  <p className="font-mono font-semibold">{parameters.currency || '-'}</p>
                </div>
              </div>
            </div>

            {/* View Mode: Conversão */}
            <div>
              <h3 className="font-semibold text-sm mb-2">📊 Conversão</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-muted/50 p-2 rounded">
                  <p className="text-muted-foreground">Formato de Data</p>
                  <p className="font-mono font-semibold">{parameters.dateFormat}</p>
                </div>
                <div className="bg-muted/50 p-2 rounded">
                  <p className="text-muted-foreground">Sep. Decimal</p>
                  <p className="font-mono font-semibold">{parameters.decimalSeparator}</p>
                </div>
                <div className="bg-muted/50 p-2 rounded">
                  <p className="text-muted-foreground">Sep. Milhar</p>
                  <p className="font-mono font-semibold">{parameters.thousandSeparator}</p>
                </div>
                <div className="bg-muted/50 p-2 rounded">
                  <p className="text-muted-foreground">Casas Decimais</p>
                  <p className="font-mono font-semibold">{parameters.rounding}</p>
                </div>
                <div className="bg-muted/50 p-2 rounded col-span-2">
                  <p className="text-muted-foreground">Visualização</p>
                  <p className="font-mono font-semibold">
                    {parameters.viewDefault === 'C' ? 'Empresa (C)' : 'Banco (B)'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {editing ? (
            <>
              <Button onClick={handleSave} className="flex-1" size="sm">
                ✓ Salvar
              </Button>
              <Button onClick={handleCancel} variant="outline" className="flex-1" size="sm">
                Cancelar
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)} variant="outline" className="w-full" size="sm">
              ✏️ Editar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ParametersPanel;

