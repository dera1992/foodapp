type CustomCheckboxProps = {
  id: string;
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: React.ReactNode;
  required?: boolean;
};

export function CustomCheckbox({ id, name, checked, onChange, label, required }: CustomCheckboxProps) {
  return (
    <label className="bf-auth-check-label" htmlFor={id}>
      <input
        id={id}
        name={name}
        type="checkbox"
        checked={checked}
        required={required}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="bf-auth-check-box" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
      <span>{label}</span>
    </label>
  );
}

