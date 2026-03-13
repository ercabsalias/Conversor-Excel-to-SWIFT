import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Upload } from 'lucide-react';
import { useWorkflow } from '@/context/WorkflowContext';

const UploadPage: React.FC = () => {
  const { state, setFile, goToStep, addLog } = useWorkflow();
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setError('Ficheiro inválido. Use .xlsx, .xls ou .csv');
      addLog('error', 'Ficheiro não suportado: ' + file.name);
      return;
    }

    setError('');
    setFile(file);
    addLog('info', `Ficheiro selecionado: ${file.name}`);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleContinue = () => {
    if (!state.file) {
      setError('Selecione um ficheiro para continuar');
      return;
    }
    goToStep('filters');
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center gap-2 text-sm">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold">
          1
        </div>
        <span className="font-semibold">Upload de Ficheiro</span>
      </div>

      {/* Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle>1. Selecione o ficheiro Excel</CardTitle>
          <CardDescription>
            Escolha um ficheiro .xlsx, .xls ou .csv com os dados de movimentação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Drag & Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition cursor-pointer ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/20 hover:border-muted-foreground/40'
            }`}
          >
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
            <p className="font-medium mb-1">Arraste o ficheiro aqui</p>
            <p className="text-sm text-muted-foreground mb-4">ou clique para selecionar</p>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => e.target.files && handleFile(e.target.files[0])}
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input">
              <Button variant="secondary" asChild className="cursor-pointer">
                <span>Procurar Ficheiro</span>
              </Button>
            </label>
          </div>

          {/* Selected File Display */}
          {state.file && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm font-medium">Ficheiro selecionado:</p>
              <p className="text-sm font-mono text-primary mt-1">{state.file.name}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Tamanho: {(state.file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleContinue}
              disabled={!state.file}
              className="flex-1"
            >
              Continuar para Mapeamento
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadPage;
