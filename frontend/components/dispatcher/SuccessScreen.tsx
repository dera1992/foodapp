type SuccessScreenProps = {
  onContinue: () => void;
};

export function DispatcherSuccessScreen({ onContinue }: SuccessScreenProps) {
  return (
    <div className="bf-dsp-success-card">
      <div className="bf-dsp-success-icon">🎉</div>
      <div className="bf-dsp-pending-badge">⏳ Pending verification</div>
      <h2>
        You&apos;re all set, <span>dispatcher!</span>
      </h2>
      <p>
        Your profile has been submitted. Our team will verify your documents within 24-48 hours. You&apos;ll get an
        email once approved.
      </p>
      <button type="button" className="bf-dsp-submit-btn" onClick={onContinue}>
        Go to Dashboard {'>'}
      </button>
    </div>
  );
}
