type StepFooterProps = {
  showBack?: boolean;
  backLabel?: string;
  continueLabel: string;
  continueDisabled?: boolean;
  loading?: boolean;
  onBack?: () => void;
  onContinue: () => void;
};

export function StepFooter({
  showBack = true,
  backLabel = 'Back',
  continueLabel,
  continueDisabled,
  loading,
  onBack,
  onContinue
}: StepFooterProps) {
  return (
    <footer className="bf-onboard-step-footer">
      {showBack ? (
        <button type="button" className="bf-onboard-back-btn" onClick={onBack}>
          {backLabel}
        </button>
      ) : (
        <span />
      )}
      <button type="button" className="bf-onboard-next-btn" onClick={onContinue} disabled={continueDisabled || loading}>
        {loading ? 'Please wait...' : continueLabel}
      </button>
    </footer>
  );
}

