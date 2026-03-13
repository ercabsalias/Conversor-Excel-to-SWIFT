/**
 * Main conversion page for Excel to SWIFT
 * New unified workflow layout
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import ParametersPanel from '@/components/conversor/ParametersPanel';
import MappingsPanel from '@/components/conversor/MappingsPanel';
import WorkflowLayout from '@/components/WorkflowLayout';
import { isOfflineMode } from '@/services/seed';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

const ConversorPage = () => {
  const { user } = useAuth();
  const [showOfflineBanner] = useState(isOfflineMode());

  return (
    <div className="space-y-6 p-4">
      {/* Offline Banner */}
      {showOfflineBanner && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900">
            <strong>Modo sem servidor</strong> — usando dados locais de exemplo. As alterações serão salvas em seu navegador.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Workflow */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content - 3 columns */}
        <div className="lg:col-span-3">
          <WorkflowLayout />
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {user?.companyId && <ParametersPanel companyId={user.companyId} />}
          {user?.companyId && <MappingsPanel companyId={user.companyId} />}
        </div>
      </div>
    </div>
  );
};

export default ConversorPage;
