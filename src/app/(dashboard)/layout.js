'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/admin/Sidebar';
import MobileHeader from '@/components/admin/MobileHeader';

export default function DashboardLayout({ children }) {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/');
    } else if (!loading && isAuthenticated && user) {
      if (user.nivel?.toUpperCase() === 'DIRETORA' && pathname !== '/vagas') {
        router.push('/vagas');
      }
    }
  }, [isAuthenticated, loading, router, user, pathname]);

  if (loading) {
    return (
      <div className="loading" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'var(--font-family)',
        color: 'var(--color-primary)',
        fontWeight: 'var(--font-weight-bold)'
      }}>
        Carregando painel...
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="admin-layout">
      <Sidebar />
      <MobileHeader />
      <main className="admin-content">{children}</main>
    </div>
  );
}
