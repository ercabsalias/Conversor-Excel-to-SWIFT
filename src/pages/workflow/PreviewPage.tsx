import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ChevronLeft, RefreshCw } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWorkflow } from '@/context/WorkflowContext';
import { Movement } from '@/types';

const ITEMS_PER_PAGE = 10;

const PreviewPage: React.FC = () => {
  const { state, goToStep, addLog } = useWorkflow();

  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'date' | 'numMov'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filter movements by date range
  const filteredMovements = useMemo(() => {
    return state.movements.filter((m) => {
      if (state.dateStart && new Date(m.date) < new Date(state.dateStart)) return false;
      if (state.dateEnd && new Date(m.date) > new Date(state.dateEnd)) return false;
      return true;
    });
  }, [state.movements, state.dateStart, state.dateEnd]);

  // Sort movements
  const sortedMovements = useMemo(() => {
    const sorted = [...filteredMovements];
    sorted.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === 'numMov') {
        comparison = a.numMov.localeCompare(b.numMov, undefined, { numeric: true });
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [filteredMovements, sortBy, sortOrder]);

  // Paginate
  const totalPages = Math.ceil(sortedMovements.length / ITEMS_PER_PAGE);
  const paginatedMovements = sortedMovements.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const calculateTotals = (movements: Movement[]) => {
    return movements.reduce(
      (acc, m) => {
        if (m.natureza === 'D') {
          acc.debits += m.valor;
        } else {
          acc.credits += m.valor;
        }
        acc.total += m.valor;
        return acc;
      },
      { debits: 0, credits: 0, total: 0 }
    );
  };

  const totals = calculateTotals(filteredMovements);

  const handleViewDetail = (movement: Movement) => {
    addLog(
      'info',
      `Movimento: ${movement.numMov} | ${movement.date} | ${movement.natureza} | ${movement.valor.toFixed(2)}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center gap-2 text-sm">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold">
          4
        </div>
        <span className="font-semibold">Prévia de Dados</span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total de Movimentos</div>
            <div className="text-3xl font-bold mt-2">{filteredMovements.length}</div>
            <div className="text-xs text-muted-foreground mt-1">
              ({filteredMovements.length} / {state.movements.length} carregados)
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Débitos</div>
            <div className="text-3xl font-bold mt-2 text-red-600">
              {totals.debits.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Créditos</div>
            <div className="text-3xl font-bold mt-2 text-green-600">
              {totals.credits.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Saldo Líquido</div>
            <div className={`text-3xl font-bold mt-2 ${totals.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totals.total.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros de Visualização</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Ordenar Por</Label>
              <Select value={sortBy} onValueChange={(val) => setSortBy(val as 'date' | 'numMov')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Data</SelectItem>
                  <SelectItem value="numMov">Número Mov</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ordem</Label>
              <Select value={sortOrder} onValueChange={(val) => setSortOrder(val as 'asc' | 'desc')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascendente ↑</SelectItem>
                  <SelectItem value="desc">Descendente ↓</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentPage(1);
                  addLog('info', 'Dados recarregados');
                }}
                className="w-full gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Movimentos</CardTitle>
          <CardDescription>
            Página {currentPage} de {totalPages} ({paginatedMovements.length} de {filteredMovements.length})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>📅 Data</TableHead>
                  <TableHead>🔢 Num Mov</TableHead>
                  <TableHead>↔️ Natureza</TableHead>
                  <TableHead className="text-right">💰 Valor</TableHead>
                  <TableHead>📝 Observação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMovements.map((movement, idx) => (
                  <TableRow
                    key={idx}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleViewDetail(movement)}
                  >
                    <TableCell className="font-mono text-sm">
                      {new Date(movement.date).toLocaleDateString('pt-PT')}
                    </TableCell>
                    <TableCell className="font-mono">{movement.numMov}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          movement.natureza === 'D'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {movement.natureza}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {movement.valor.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground truncate max-w-xs">
                      {movement.obs || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredMovements.length === 0 && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Nenhum movimento encontrado com os filtros aplicados</AlertDescription>
            </Alert>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => goToStep('filters')} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Button>
        <Button onClick={() => goToStep('generate')} className="flex-1">
          Continuar para Gerar SWIFT
        </Button>
      </div>
    </div>
  );
};

export default PreviewPage;
