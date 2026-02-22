type SubmitButtonProps = {
  loading: boolean;
  disabled?: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
};

export function SubmitButton({ loading, disabled, icon, children }: SubmitButtonProps) {
  return (
    <button type="submit" className="bf-auth-submit-btn" disabled={disabled || loading}>
      {loading ? <span className="bf-auth-spinner" aria-hidden="true" /> : icon}
      {loading ? 'Please wait...' : children}
    </button>
  );
}

