'use client';

import { useState } from 'react';
import { ShopSidebar } from '@/components/shop-portal/ShopSidebar';
import { ShopTopbar } from '@/components/shop-portal/ShopTopbar';

export function ShopPortalLayout({ children, shopName, initials }: {
  children: React.ReactNode;
  shopName?: string;
  initials?: string;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="bf-admin-layout">
      <ShopSidebar open={isSidebarOpen} shopName={shopName} initials={initials} />
      <div className="bf-admin-main">
        <ShopTopbar shopName={shopName} initials={initials} onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />
        <main className="bf-admin-content">{children}</main>
      </div>
    </div>
  );
}
