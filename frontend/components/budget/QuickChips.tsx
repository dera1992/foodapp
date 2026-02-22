type QuickChip = {
  label: string;
  value: number;
};

type QuickChipsProps = {
  chips: QuickChip[];
  activeValue: number | null;
  onSelect: (value: number) => void;
};

export function QuickChips({ chips, activeValue, onSelect }: QuickChipsProps) {
  return (
    <div className="bf-budget-create-chips">
      {chips.map((chip) => (
        <button
          key={chip.value}
          type="button"
          className={`bf-budget-create-chip ${activeValue === chip.value ? 'is-active' : ''}`}
          onClick={() => onSelect(chip.value)}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}

