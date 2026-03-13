/**
 * Mappings Panel Component
 * Manage account mappings
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mapping } from '@/types';
import { loadMappingsFromStorage, saveMappingsToStorage } from '@/services/seed';
import { Trash2 } from 'lucide-react';

interface MappingsPanelProps {
  companyId: string;
}

const MappingsPanel = ({ companyId }: MappingsPanelProps) => {
  const [mappings, setMappings] = useState<Mapping[]>([]);

  useEffect(() => {
    const maps = loadMappingsFromStorage();
    setMappings(maps);
  }, []);

  const handleDeleteMapping = (id: string) => {
    const updated = mappings.filter((m) => m.id !== id);
    setMappings(updated);
    saveMappingsToStorage(updated);
  };

  const handleToggleActive = (id: string) => {
    const updated = mappings.map((m) =>
      m.id === id ? { ...m, active: !m.active } : m
    );
    setMappings(updated);
    saveMappingsToStorage(updated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mapeamentos</CardTitle>
        <CardDescription>Configurações de conta origem → destino</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="max-h-80 overflow-y-auto space-y-2">
          {mappings.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum mapeamento configurado</p>
          ) : (
            mappings
              .sort((a, b) => a.priority - b.priority)
              .map((mapping) => (
                <div
                  key={mapping.id}
                  className="border rounded-lg p-3 flex items-start justify-between bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex-1 text-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold">{mapping.sourceAccount}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-mono font-semibold">{mapping.targetAccount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={mapping.active ? 'default' : 'secondary'} className="text-xs">
                        {mapping.matchType}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        P{mapping.priority}
                      </Badge>
                    </div>
                    {mapping.description && (
                      <p className="text-xs text-muted-foreground">{mapping.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleActive(mapping.id)}
                      className="text-xs h-7"
                    >
                      {mapping.active ? '✓' : '✕'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteMapping(mapping.id)}
                      className="text-xs h-7 text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MappingsPanel;
