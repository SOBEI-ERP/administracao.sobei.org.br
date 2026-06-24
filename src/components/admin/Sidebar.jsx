'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { DENUNCIA_LINKS } from '@/lib/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [denunciasOpen, setDenunciasOpen] = useState(true);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <aside className="sidebar">
      <Link href="/dashboard" className="sidebar__logo">
        <Image
          src="/images/LOGO BRANCO.png"
          alt="SOBEI"
          width={200}
          height={80}
          priority
          className="sidebar__logo-full"
        />
        <Image
          src="/images/LOGO TRIANGULO TRANSPARENTE.png"
          alt="SOBEI"
          width={46}
          height={46}
          priority
          className="sidebar__logo-icon"
        />
      </Link>

      <nav className="sidebar__nav">

        {/* Denúncias section */}
        <div className="sidebar__section">
          <button
            className="sidebar__section-header"
            onClick={() => setDenunciasOpen(!denunciasOpen)}
            type="button"
          >
            <div className="sidebar__section-title">
              <Image 
                src="/images/attention-stop.svg" 
                alt="" 
                width={20} 
                height={20} 
                className="sidebar__icon" 
              />
              <span className="sidebar__text">Denúncias</span>
            </div>
            <span className={`sidebar__chevron ${denunciasOpen ? 'sidebar__chevron--open' : ''}`}>
              ▼
            </span>
          </button>

          {denunciasOpen && (
            <div className="sidebar__subitems">
              {DENUNCIA_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`sidebar__subitem ${
                    pathname === link.href ? 'sidebar__subitem--active' : ''
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="sidebar__divider" />

        {/* Estatísticas */}
        <Link
          href="/estatisticas"
          className={`sidebar__link ${
            pathname === '/estatisticas' ? 'sidebar__link--active' : ''
          }`}
        >
          <Image 
            src="/images/statistic-1.svg" 
            alt="" 
            width={20} 
            height={20} 
            className="sidebar__icon" 
          />
          <span className="sidebar__text">Estatísticas</span>
        </Link>

        {user?.nivel?.toUpperCase() === 'SUPORTE' && (
          <>
            <div className="sidebar__divider" />
            {/* Usuários */}
            <Link
              href="/usuarios"
              className={`sidebar__link ${
                pathname === '/usuarios' ? 'sidebar__link--active' : ''
              }`}
            >
              <Image 
                src="/images/user_icon.svg" 
                alt="" 
                width={20} 
                height={20} 
                className="sidebar__icon" 
              />
              <span className="sidebar__text">Gerenciar Usuários</span>
            </Link>
          </>
        )}

        {user?.nivel?.toUpperCase() === 'DIRETORA' && (
          <>
            <div className="sidebar__divider" />
            {/* Vagas */}
            <Link
              href="/vagas"
              className={`sidebar__link ${
                pathname === '/vagas' ? 'sidebar__link--active' : ''
              }`}
            >
              <Image 
                src="/images/briefcase.svg" 
                alt="" 
                width={20} 
                height={20} 
                className="sidebar__icon" 
              />
              <span className="sidebar__text">Vagas</span>
            </Link>
          </>
        )}
      </nav>

      <div className="sidebar__logout" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', padding: 'var(--spacing-md) 0' }}>
        <button
          onClick={handleLogout}
          className="sidebar__link"
          type="button"
        >
          <Image 
            src="/images/Log_Out.svg" 
            alt="" 
            width={20} 
            height={20} 
            className="sidebar__icon" 
          />
          <span className="sidebar__text" style={{ fontWeight: 'var(--font-weight-bold)' }}>Sair da Conta</span>
        </button>
      </div>
    </aside>
  );
}
