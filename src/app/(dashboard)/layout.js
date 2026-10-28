'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/admin/Sidebar';
import MobileHeader from '@/components/admin/MobileHeader';
import AdminFooter from '@/components/admin/AdminFooter';

export default function DashboardLayout({ children }) {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/');
    } else if (!loading && isAuthenticated && user) {
      const nivel = user.nivel?.toUpperCase();
      if (nivel === 'DIRETORA' && !['/vagas', '/banco-talentos', '/mensagens', '/inscritos-congresso'].includes(pathname)) {
        router.push('/vagas');
      } else if ((nivel === 'COORDENADORA' || nivel === 'COORDENADORA_EVENTO') && !['/inscritos-congresso', '/mensagens'].includes(pathname)) {
        router.push('/inscritos-congresso');
      } else if (nivel === 'CREDENCIADOR' && !['/inscritos-congresso'].includes(pathname)) {
        router.push('/inscritos-congresso');
      } else if (nivel === 'DP' && pathname === '/inscritos-congresso') {
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
      <div className="admin-main-wrapper" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '100vh', width: '100%' }}>
        <main className="admin-content" style={{ flex: 1 }}>{children}</main>
        <AdminFooter />
      </div>
    </div>
  );
}
