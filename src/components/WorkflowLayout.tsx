import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWorkflow } from '@/context/WorkflowContext';
import LogPanel from '@/components/LogPanel';
import UploadPage from '@/pages/workflow/UploadPage';
import FilterPage from '@/pages/workflow/FilterPage';
import PreviewPage from '@/pages/workflow/PreviewPage';
import GeneratePage from '@/pages/workflow/GeneratePage';

interface Step {
  id: 'upload' | 'filters' | 'preview' | 'generate';
  label: string;
  icon: string;
}

const STEPS: Step[] = [
  { id: 'upload', label: 'Upload', icon: '📤' },
  { id: 'filters', label: 'Filtros', icon: '🔍' },
  { id: 'preview', label: 'Prévia', icon: '👀' },
  { id: 'generate', label: 'Gerar', icon: '⚡' },
];

const WorkflowLayout: React.FC = () => {
  const { state, goToStep } = useWorkflow();

  const renderPage = () => {
    switch (state.currentStep) {
      case 'upload':
        return <UploadPage />;
      case 'filters':
        return <FilterPage />;
      case 'preview':
        return <PreviewPage />;
      case 'generate':
        return <GeneratePage />;
      default:
        return <UploadPage />;
    }
  };

  const isStepCompleted = (stepId: 'upload' | 'mapping' | 'filters' | 'preview' | 'generate') => {
    const stepIndex = STEPS.findIndex((s) => s.id === stepId);
    const currentIndex = STEPS.findIndex((s) => s.id === state.currentStep);
    return stepIndex < currentIndex;
  };

  const isStepAccessible = (stepId: 'upload' | 'filters' | 'preview' | 'generate') => {
    if (stepId === 'upload') return true;
    if (stepId === 'filters' && state.file) return true;
    if (stepId === 'preview' && state.movements.length > 0) return true;
    if (stepId === 'generate' && state.movements.length > 0) return true;
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Excel → SWIFT</h1>
        <p className="text-muted-foreground mt-2">Conversor de ficheiros Excel para formato SWIFT</p>
      </div>

      {/* Workflow Progress */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          {STEPS.map((step, idx) => (
            <React.Fragment key={step.id}>
              {/* Step Button */}
              <Button
                variant={state.currentStep === step.id ? 'default' : isStepCompleted(step.id) ? 'outline' : 'ghost'}
                disabled={!isStepAccessible(step.id)}
                onClick={() => isStepAccessible(step.id) && goToStep(step.id)}
                className="relative flex flex-col items-center gap-2"
              >
                <div
                  className={`text-2xl ${
                    isStepCompleted(step.id)
                      ? 'opacity-50'
                      : state.currentStep === step.id
                        ? 'opacity-100'
                        : 'opacity-50'
                  }`}
                >
                  {isStepCompleted(step.id) ? '✓' : step.icon}
                </div>
                <span className="text-xs hidden sm:inline">{step.label}</span>
              </Button>

              {/* Connector */}
              {idx < STEPS.length - 1 && (
                <div className="flex-1 h-1 mx-2 bg-muted rounded-full" />
              )}
            </React.Fragment>
          ))}
        </div>
      </Card>

      {/* Main Content Area */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        {renderPage()}
      </div>

      {/* Log Panel */}
      <LogPanel />
    </div>
  );
};

export default WorkflowLayout;
