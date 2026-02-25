import { IntegrationsClient } from './IntegrationsClient';

export const metadata = { title: 'Integrations – Bunchfood Admin' };

export default function AdminIntegrationsPage() {
  return (
    <div className="p-6">
      <IntegrationsClient />
    </div>
  );
}
