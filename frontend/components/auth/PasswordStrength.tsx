type PasswordStrengthProps = {
  password: string;
};

export function PasswordStrength({ password }: PasswordStrengthProps) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const widths = ['0%', '25%', '50%', '75%', '100%'];
  const colors = ['', '#ef4444', '#f97316', '#eab308', '#2d7a3a'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  return (
    <div className="bf-auth-strength-wrap">
      <div className="bf-auth-strength-bar">
        <div className="bf-auth-strength-fill" style={{ width: widths[score], backgroundColor: colors[score] }} />
      </div>
      {score > 0 ? (
        <span className="bf-auth-strength-text" style={{ color: colors[score] }}>
          {labels[score]}
        </span>
      ) : null}
    </div>
  );
}

