import { redirect } from 'next/navigation';

export default function ForgotPasswordShortcutPage() {
  redirect('/account/password-reset');
}

