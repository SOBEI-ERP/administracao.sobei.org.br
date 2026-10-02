'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BancoTalentosPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/vagas?tab=banco-talentos');
  }, [router]);

  return (
    <div className="vagas-admin" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-gray-600)' }}>
      <p>Redirecionando para a seção de Banco de Talentos...</p>
    </div>
  );
}
