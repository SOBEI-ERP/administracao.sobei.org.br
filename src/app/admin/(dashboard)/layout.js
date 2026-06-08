'use client';

import Sidebar from '@/components/admin/Sidebar';
import MobileHeader from '@/components/admin/MobileHeader';

export default function DashboardLayout({ children }) {
  return (
    <div className="admin-layout">
      <Sidebar />
      <MobileHeader />
      <main className="admin-content">{children}</main>
    </div>
  );
}
