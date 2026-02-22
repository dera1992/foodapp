import Link from 'next/link';

type AccentPanelProps = {
  heading: React.ReactNode;
  description: string;
  children: React.ReactNode;
};

export function AccentPanel({ heading, description, children }: AccentPanelProps) {
  return (
    <aside className="bf-auth-accent">
      <Link href="/" className="bf-auth-logo">
        bunch<span>food</span>
      </Link>

      <div className="bf-auth-accent-main">
        <h2>{heading}</h2>
        <p>{description}</p>
        {children}
      </div>

      <p className="bf-auth-copy">Copyright 2026 bunchfood. All rights reserved.</p>
    </aside>
  );
}

