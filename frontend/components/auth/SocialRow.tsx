type SocialRowProps = {
  mode: 'login' | 'register';
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.02 5.02 0 0 1-2.21 3.31v2.77h3.57a10.98 10.98 0 0 0 3.28-8.09Z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77a6.54 6.54 0 0 1-3.71 1.06 6.2 6.2 0 0 1-6.16-4.53H2.18v2.84A11.99 11.99 0 0 0 12 23Z" fill="#34A853" />
      <path d="M5.84 14.09a6.98 6.98 0 0 1 0-4.18V7.07H2.18A12 12 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84Z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11.91 11.91 0 0 0 12 1 11.99 11.99 0 0 0 2.18 7.07l3.66 2.84A6.2 6.2 0 0 1 12 5.38Z" fill="#EA4335" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M24 12.07C24 5.45 18.63.07 12 .07S0 5.45 0 12.07c0 5.99 4.39 10.95 10.13 11.85v-8.38H7.08v-3.47h3.05V9.43c0-3.01 1.79-4.67 4.53-4.67 1.31 0 2.68.24 2.68.24v2.95h-1.51c-1.49 0-1.96.93-1.96 1.87v2.25h3.33l-.53 3.47h-2.8v8.38C19.61 23.02 24 18.06 24 12.07Z"
        fill="#1877F2"
      />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#1DA1F2"
        d="M23.95 4.57a9.94 9.94 0 0 1-2.83.77 4.92 4.92 0 0 0 2.16-2.72 9.95 9.95 0 0 1-3.13 1.19A4.92 4.92 0 0 0 11.78 8.3 13.97 13.97 0 0 1 1.64 3.16a4.82 4.82 0 0 0-.67 2.48c0 1.7.87 3.21 2.19 4.09a4.9 4.9 0 0 1-2.23-.61v.06a4.93 4.93 0 0 0 3.95 4.83 4.96 4.96 0 0 1-2.21.08 4.94 4.94 0 0 0 4.6 3.42A9.88 9.88 0 0 1 1.17 19.6c-.39 0-.78-.02-1.17-.07a14 14 0 0 0 7.56 2.21c9.05 0 14-7.5 14-13.99 0-.21 0-.42-.02-.63a10 10 0 0 0 2.45-2.55Z"
      />
    </svg>
  );
}

export function SocialRow({ mode }: SocialRowProps) {
  return (
    <div className="bf-auth-social-row">
      <a href="#" className="bf-auth-social-btn" aria-label="Continue with Google">
        <GoogleIcon />
        Google
      </a>
      <a href="#" className="bf-auth-social-btn" aria-label="Continue with Facebook">
        <FacebookIcon />
        Facebook
      </a>
      <a href="#" className="bf-auth-social-btn" aria-label="Continue with Twitter">
        <TwitterIcon />
        Twitter
      </a>
      <input type="hidden" name="auth_mode" value={mode} />
    </div>
  );
}

