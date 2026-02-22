import { DispatcherDocumentUploader } from '@/components/dispatcher/DocumentUploader';
import { VehicleCard } from '@/components/dispatcher/VehicleCard';
import type { VehicleData, VehicleOption } from '@/types/dispatcher';

const VEHICLE_OPTIONS: VehicleOption[] = [
  { id: 'bicycle', emoji: '🚲', label: 'Bicycle' },
  { id: 'motorbike', emoji: '🏍️', label: 'Motorbike' },
  { id: 'car', emoji: '🚗', label: 'Car' },
  { id: 'van', emoji: '🚐', label: 'Van' }
];

type VehicleStepProps = {
  vehicle: VehicleData;
  loading: boolean;
  onUpdate: (patch: Partial<VehicleData>) => void;
  onBack: () => void;
  onSubmit: () => void;
};

export function VehicleStep({ vehicle, loading, onUpdate, onBack, onSubmit }: VehicleStepProps) {
  const step2Valid = vehicle.plateNumber.trim() !== '';

  return (
    <>
      <div className="bf-dsp-card-header">
        <div className="bf-dsp-step-badge">Step 2 of 2</div>
        <div className="bf-dsp-card-header-icon" aria-hidden="true">🚚</div>
        <h2>Vehicle Details</h2>
        <p>Share your vehicle information for verification.</p>
      </div>

      <div className="bf-dsp-card-body">
        <div className="bf-dsp-field">
          <label>Vehicle Type</label>
          <div className="bf-dsp-vehicle-grid">
            {VEHICLE_OPTIONS.map((option) => (
              <VehicleCard
                key={option.id}
                option={option}
                isSelected={vehicle.vehicleType === option.id}
                onSelect={() => onUpdate({ vehicleType: option.id })}
              />
            ))}
          </div>
        </div>

        <div className="bf-dsp-field-row">
          <div className="bf-dsp-field">
            <label htmlFor="dsp-plate-number">Plate Number</label>
            <input
              id="dsp-plate-number"
              name="plate_number"
              type="text"
              placeholder="e.g. AB12 CDE"
              value={vehicle.plateNumber}
              onChange={(e) => onUpdate({ plateNumber: e.target.value.toUpperCase() })}
              style={{ textTransform: 'uppercase' }}
            />
          </div>
          <div className="bf-dsp-field">
            <label htmlFor="dsp-vehicle-model">Vehicle Make / Model</label>
            <input
              id="dsp-vehicle-model"
              name="vehicle_model"
              type="text"
              placeholder="e.g. Honda CBR 125"
              value={vehicle.vehicleModel}
              onChange={(e) => onUpdate({ vehicleModel: e.target.value })}
            />
          </div>
        </div>

        <DispatcherDocumentUploader
          label="Insurance / Registration Doc"
          hint="You can add this later from your dashboard."
          name="vehicle_document"
          fileName={vehicle.vehicleFileName}
          optional
          onChange={(file) => onUpdate({ vehicleDocument: file, vehicleFileName: file?.name ?? null })}
        />
      </div>

      <div className="bf-dsp-card-footer">
        <button type="button" className="bf-dsp-back-btn" onClick={onBack}>
          {'<-'} Back
        </button>
        <button type="button" className="bf-dsp-submit-btn" disabled={!step2Valid || loading} onClick={onSubmit}>
          {loading ? 'Submitting...' : 'Submit & Finish ✓'}
        </button>
      </div>
    </>
  );
}
