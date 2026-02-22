import { DispatcherDocumentUploader } from '@/components/dispatcher/DocumentUploader';
import type { PersonalData } from '@/types/dispatcher';

type PersonalStepProps = {
  personal: PersonalData;
  loading: boolean;
  onUpdate: (patch: Partial<PersonalData>) => void;
  onContinue: () => void;
};

export function PersonalStep({ personal, loading, onUpdate, onContinue }: PersonalStepProps) {
  const step1Valid = personal.fullName.trim() !== '' && personal.idNumber.trim() !== '';

  return (
    <>
      <div className="bf-dsp-card-header">
        <div className="bf-dsp-step-badge">Step 1 of 2</div>
        <div className="bf-dsp-card-header-icon" aria-hidden="true">🪪</div>
        <h2>Personal Details</h2>
        <p>Tell us who you are and upload a valid ID document.</p>
      </div>

      <div className="bf-dsp-card-body">
        <div className="bf-dsp-field-row">
          <div className="bf-dsp-field">
            <label htmlFor="dsp-full-name">Full Name</label>
            <input
              id="dsp-full-name"
              name="full_name"
              type="text"
              placeholder="Full name"
              value={personal.fullName}
              onChange={(e) => onUpdate({ fullName: e.target.value })}
            />
          </div>
          <div className="bf-dsp-field">
            <label htmlFor="dsp-phone">Phone Number</label>
            <input
              id="dsp-phone"
              name="phone"
              type="tel"
              placeholder="+44 7700 000000"
              value={personal.phone}
              onChange={(e) => onUpdate({ phone: e.target.value })}
            />
          </div>
        </div>

        <div className="bf-dsp-field-row">
          <div className="bf-dsp-field">
            <label htmlFor="dsp-id-number">ID Number</label>
            <input
              id="dsp-id-number"
              name="id_number"
              type="text"
              placeholder="National ID / Passport no."
              value={personal.idNumber}
              onChange={(e) => onUpdate({ idNumber: e.target.value })}
            />
          </div>
          <div className="bf-dsp-field">
            <label htmlFor="dsp-dob">Date of Birth</label>
            <input
              id="dsp-dob"
              name="dob"
              type="date"
              value={personal.dob}
              onChange={(e) => onUpdate({ dob: e.target.value })}
            />
          </div>
        </div>

        <DispatcherDocumentUploader
          label="ID Document"
          hint="Passport, Driver's Licence or National ID"
          name="id_document"
          fileName={personal.idFileName}
          onChange={(file) => onUpdate({ idDocument: file, idFileName: file?.name ?? null })}
        />
      </div>

      <div className="bf-dsp-card-footer is-end">
        <button type="button" className="bf-dsp-continue-btn" disabled={!step1Valid || loading} onClick={onContinue}>
          {loading ? 'Please wait...' : 'Continue to Vehicle ->'}
        </button>
      </div>
    </>
  );
}

