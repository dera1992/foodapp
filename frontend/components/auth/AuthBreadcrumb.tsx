import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

type AuthBreadcrumbProps = {
  current: 'Login' | 'Register';
};

export function AuthBreadcrumb({ current }: AuthBreadcrumbProps) {
  return (
    <nav className="bf-auth-breadcrumb" aria-label="Breadcrumb">
      <Link href="/">
        <Home className="h-3.5 w-3.5" />
        Home
      </Link>
      <ChevronRight className="h-3.5 w-3.5" />
      <span className="current">{current}</span>
    </nav>
  );
}

