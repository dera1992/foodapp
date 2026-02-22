import type { DispatcherStep } from '@/types/dispatcher';

export function DispatcherStepIndicator({ currentStep }: { currentStep: Exclude<DispatcherStep, 'success'> }) {
  const isVehicle = currentStep === 'vehicle';

  return (
    <div className="bf-dsp-step-indicator">
      <div className="bf-dsp-step-labels">
        <span className={`bf-dsp-step-label ${!isVehicle ? 'is-active' : 'is-done'}`}>Personal</span>
        <span className={`bf-dsp-step-label ${isVehicle ? 'is-active' : ''}`}>Vehicle</span>
      </div>
      <div className="bf-dsp-progress-track">
        <div className="bf-dsp-progress-fill" style={{ width: isVehicle ? '75%' : '25%' }} />
      </div>
    </div>
  );
}

