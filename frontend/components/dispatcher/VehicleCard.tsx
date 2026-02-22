import type { VehicleOption } from '@/types/dispatcher';

type VehicleCardProps = {
  option: VehicleOption;
  isSelected: boolean;
  onSelect: () => void;
};

export function VehicleCard({ option, isSelected, onSelect }: VehicleCardProps) {
  return (
    <button type="button" className={`bf-dsp-vehicle-card ${isSelected ? 'is-selected' : ''}`} onClick={onSelect}>
      <span className="bf-dsp-vehicle-icon" aria-hidden="true">{option.emoji}</span>
      <span className="bf-dsp-vehicle-label">{option.label}</span>
    </button>
  );
}

