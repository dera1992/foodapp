import { LogoUploader } from '@/components/onboarding/LogoUploader';
import { StepFooter } from '@/components/onboarding/StepFooter';
import type { ShopInfoData } from '@/types/onboarding';

type ShopInfoStepProps = {
  info: ShopInfoData;
  loading?: boolean;
  onUpdate: (patch: Partial<ShopInfoData>) => void;
  onContinue: () => void;
};

export function ShopInfoStep({ info, loading, onUpdate, onContinue }: ShopInfoStepProps) {
  return (
    <>
      <header className="bf-onboard-step-header">
        <h2>Shop Basics</h2>
        <p>Tell customers about your shop and upload a logo.</p>
      </header>
      <div className="bf-onboard-step-body">
        <div className="bf-onboard-field">
          <label htmlFor="onb-shop-name">Name</label>
          <input
            id="onb-shop-name"
            type="text"
            name="name"
            maxLength={80}
            placeholder="Your shop name"
            value={info.name}
            onChange={(event) => onUpdate({ name: event.target.value })}
          />
        </div>

        <div className="bf-onboard-field">
          <label htmlFor="onb-shop-description">Description</label>
          <textarea
            id="onb-shop-description"
            name="description"
            rows={4}
            placeholder="Tell customers what you sell..."
            value={info.description}
            onChange={(event) => onUpdate({ description: event.target.value })}
          />
        </div>

        <div className="bf-onboard-field">
          <label>Logo</label>
          <LogoUploader
            preview={info.logoPreview}
            fileName={info.logo?.name ?? null}
            onChange={(file, preview) => onUpdate({ logo: file, logoPreview: preview })}
          />
        </div>
      </div>
      <StepFooter
        showBack={false}
        continueLabel="Continue ->"
        continueDisabled={!info.name.trim()}
        loading={loading}
        onContinue={onContinue}
      />
    </>
  );
}

