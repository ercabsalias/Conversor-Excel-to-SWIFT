/**
 * Excel Importer Component
 * Handles file upload and sheet selection
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, AlertCircle } from 'lucide-react';
import { readExcelFile } from '@/lib/excel';
import { ExcelImportData } from '@/types';

interface ExcelImporterProps {
  onFileSelected: (file: File) => void;
}

const ExcelImporter = ({ onFileSelected }: ExcelImporterProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<ExcelImportData | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setLoading(true);

    try {
      const data = await readExcelFile(file);
      setExcelData(data);
      setSelectedSheet(data.selectedSheet);
      setSelectedFile(file);
    } catch (err) {
      setError(`Erro ao ler arquivo: ${err instanceof Error ? err.message : 'Desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSheetSelect = (sheetName: string) => {
    setSelectedSheet(sheetName);
  };

  const handleContinue = () => {
    if (selectedFile) {
      onFileSelected(selectedFile);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>1. Upload de Arquivo Excel</CardTitle>
        <CardDescription>
          Selecione o arquivo Excel com os dados de movimentação
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* File Input */}
        <div className="flex items-center justify-center w-full">
          <label
            htmlFor="file-input"
            className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
              <p className="mb-2 text-sm text-muted-foreground">
                <span className="font-semibold">Clique para selecionar</span> ou arraste um arquivo
              </p>
              <p className="text-xs text-muted-foreground">
                Excel (.xlsx, .xls, .csv)
              </p>
            </div>
            <input
              id="file-input"
              type="file"
              className="hidden"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              disabled={loading}
            />
          </label>
        </div>

        {/* File Info */}
        {selectedFile && excelData && (
          <div className="space-y-3">
            <div className="text-sm">
              <p className="font-semibold">Arquivo: {selectedFile.name}</p>
              <p className="text-muted-foreground">Tamanho: {(selectedFile.size / 1024).toFixed(2)} KB</p>
            </div>

            {/* Sheet Selection */}
            {excelData.sheets.length > 1 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Selecione a Sheet:</label>
                <div className="grid grid-cols-2 gap-2">
                  {excelData.sheets.map((sheet) => (
                    <Button
                      key={sheet.name}
                      variant={selectedSheet === sheet.name ? 'default' : 'outline'}
                      onClick={() => handleSheetSelect(sheet.name)}
                    >
                      {sheet.name}
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({sheet.rowCount} linhas)
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Continue Button */}
            <Button onClick={handleContinue} className="w-full">
              Continuar para Mapeamento
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExcelImporter;
