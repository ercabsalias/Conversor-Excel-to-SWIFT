import React, { useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2 } from 'lucide-react';
import { useWorkflow } from '@/context/WorkflowContext';

const LogPanel: React.FC = () => {
  const { state, clearLogs } = useWorkflow();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new logs arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.logs]);

  const getLogColor = (type: 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-amber-600';
      case 'info':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getLogBg = (type: 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'error':
        return 'bg-red-50';
      case 'warning':
        return 'bg-amber-50';
      case 'info':
        return 'bg-blue-50';
      default:
        return 'bg-gray-50';
    }
  };

  const getLogIcon = (type: 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📝';
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-lg">📋 Registo de Eventos</CardTitle>
          <CardDescription>
            {state.logs.length} evento{state.logs.length !== 1 ? 's' : ''}
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearLogs}
          disabled={state.logs.length === 0}
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Limpar
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea
          ref={scrollRef}
          className={`border rounded-lg p-3 h-40 ${state.logs.length === 0 ? 'flex items-center justify-center text-muted-foreground' : ''}`}
        >
          {state.logs.length === 0 ? (
            <div className="text-sm">Nenhum evento registado</div>
          ) : (
            <div className="space-y-2">
              {state.logs.map((log, idx) => (
                <div
                  key={idx}
                  className={`text-xs px-2 py-1 rounded font-mono ${getLogBg(log.type)}`}
                >
                  <span className="mr-2">{getLogIcon(log.type)}</span>
                  <span className={getLogColor(log.type)}>
                    {log.timestamp.toLocaleTimeString('pt-PT')}
                  </span>
                  <span className="text-gray-700 ml-2">{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default LogPanel;
