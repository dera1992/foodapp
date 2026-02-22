import { Check, Loader2 } from 'lucide-react';
import type { RoleOption } from '@/types/role';

type ConfirmCTAProps = {
  selected: RoleOption | null;
  loading: boolean;
  onConfirm: () => void;
  error?: string | null;
};

export function ConfirmCTA({ selected, loading, onConfirm, error }: ConfirmCTAProps) {
  return (
    <div className="bf-role-cta-wrap">
      <button
        type="button"
        className="bf-role-confirm-btn"
        disabled={!selected || loading}
        onClick={onConfirm}
        aria-label="Confirm role selection and continue"
      >
        {loading ? <Loader2 size={18} className="bf-spin" /> : <Check size={18} />}
        {loading ? 'Setting up your account...' : 'Confirm & Continue'}
      </button>

      <p className="bf-role-cta-hint" aria-live="polite">
        {selected ? (
          <>
            You selected <span>{selected.title}</span> - click above to continue
          </>
        ) : (
          'Select a role above to continue'
        )}
      </p>

      {error ? <p className="bf-role-cta-error">{error}</p> : null}
    </div>
  );
}

