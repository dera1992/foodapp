import { DocumentUploader } from '@/components/onboarding/DocumentUploader';
import { StepFooter } from '@/components/onboarding/StepFooter';
import type { ShopDocumentsData } from '@/types/onboarding';

type ShopDocumentsStepProps = {
  documents: ShopDocumentsData;
  loading?: boolean;
  onUpdate: (patch: Partial<ShopDocumentsData>) => void;
  onBack: () => void;
  onContinue: () => void;
};

export function ShopDocumentsStep({ documents, loading, onUpdate, onBack, onContinue }: ShopDocumentsStepProps) {
  return (
    <>
      <header className="bf-onboard-step-header">
        <h2>Business Documents</h2>
        <p>Upload proof of business ownership (optional).</p>
      </header>

      <div className="bf-onboard-step-body">
        <div className="bf-onboard-field">
          <label>Business Document</label>
          <DocumentUploader
            fileName={documents.fileName}
            onChange={(file) => onUpdate({ businessDocument: file, fileName: file?.name ?? null })}
          />
          <p className="bf-onboard-doc-note">
            This step is optional. You can also upload documents later from your shop settings.
          </p>
        </div>
      </div>

      <StepFooter
        backLabel="<- Back"
        continueLabel="Continue ->"
        loading={loading}
        onBack={onBack}
        onContinue={onContinue}
      />
    </>
  );
}

