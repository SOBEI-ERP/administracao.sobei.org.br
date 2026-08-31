'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { DENUNCIA_LINKS } from '@/lib/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { IconChevronDown } from '@/components/Icons';

export default function MobileHeader() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [denunciasOpen, setDenunciasOpen] = useState(true);
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Close menu on route change
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMenuOpen(false);
  }

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <>
      <header className="mobile-header">
        <Link href="/dashboard" className="mobile-header__logo">
          <Image
            src="/images/LOGO TRIANGULO TRANSPARENTE.png"
            alt="SOBEI"
            width={40}
            height={40}
            priority
          />
        </Link>

        <button
          className={`mobile-header__hamburger ${menuOpen ? 'mobile-header__hamburger--open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          type="button"
          aria-label="Menu"
        >
          <span className="mobile-header__bar" />
          <span className="mobile-header__bar" />
          <span className="mobile-header__bar" />
        </button>
      </header>

      {/* Overlay */}
      <div
        className={`mobile-drawer__overlay ${menuOpen ? 'mobile-drawer__overlay--visible' : ''}`}
        onClick={() => setMenuOpen(false)}
      />

      {/* Drawer */}
      <nav className={`mobile-drawer ${menuOpen ? 'mobile-drawer--open' : ''}`}>
        <div className="mobile-drawer__header">
          <Link href="/dashboard" className="mobile-drawer__logo" onClick={() => setMenuOpen(false)}>
            <Image
              src="/images/LOGO BRANCO.png"
              alt="SOBEI"
              width={180}
              height={72}
              priority
            />
          </Link>
        </div>

        <div className="mobile-drawer__divider" />

        {/* Denúncias e Estatísticas: DP e SUPORTE */}
        {(user?.nivel?.toUpperCase() === 'DP' || user?.nivel?.toUpperCase() === 'SUPORTE') && (
          <>
            {/* Denúncias */}
            <div className="mobile-drawer__section">
              <button
                className="mobile-drawer__section-header"
                onClick={() => setDenunciasOpen(!denunciasOpen)}
                type="button"
              >
                <div className="mobile-drawer__section-title">
                  <Image
                    src="/images/attention-stop.svg"
                    alt=""
                    width={20}
                    height={20}
                    className="mobile-drawer__icon"
                  />
                  <span>Denúncias</span>
                </div>
                <span className={`mobile-drawer__chevron ${denunciasOpen ? 'mobile-drawer__chevron--open' : ''}`}>
                  <IconChevronDown size={12} />
                </span>
              </button>

              {denunciasOpen && (
                <div className="mobile-drawer__subitems">
                  {DENUNCIA_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`mobile-drawer__subitem ${
                        pathname === link.href ? 'mobile-drawer__subitem--active' : ''
                      }`}
                      onClick={() => setMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="mobile-drawer__divider" />

            {/* Estatísticas */}
            <Link
              href="/estatisticas"
              className={`mobile-drawer__link ${
                pathname === '/estatisticas' ? 'mobile-drawer__link--active' : ''
              }`}
              onClick={() => setMenuOpen(false)}
            >
              <Image
                src="/images/statistic-1.svg"
                alt=""
                width={20}
                height={20}
                className="mobile-drawer__icon"
              />
              <span>Estatísticas</span>
            </Link>
          </>
        )}

        {/* Vagas: DIRETORA e SUPORTE */}
        {(user?.nivel?.toUpperCase() === 'DIRETORA' || user?.nivel?.toUpperCase() === 'SUPORTE') && (
          <>
            <div className="mobile-drawer__divider" />
            <Link
              href="/vagas"
              className={`mobile-drawer__link ${
                pathname === '/vagas' ? 'mobile-drawer__link--active' : ''
              }`}
              onClick={() => setMenuOpen(false)}
            >
              <Image
                src="/images/briefcase.svg"
                alt=""
                width={20}
                height={20}
                className="mobile-drawer__icon"
              />
              <span>Vagas</span>
            </Link>
          </>
        )}

        {/* Mensagens: DIRETORA, COORDENADORA e SUPORTE */}
        {(user?.nivel?.toUpperCase() === 'DIRETORA' || user?.nivel?.toUpperCase() === 'COORDENADORA' || user?.nivel?.toUpperCase() === 'SUPORTE') && (
          <>
            <div className="mobile-drawer__divider" />
            <Link
              href="/mensagens"
              className={`mobile-drawer__link ${
                pathname === '/mensagens' ? 'mobile-drawer__link--active' : ''
              }`}
              onClick={() => setMenuOpen(false)}
            >
              <Image
                src="/images/bell.svg"
                alt=""
                width={20}
                height={20}
                className="mobile-drawer__icon"
              />
              <span>Mensagens</span>
            </Link>
          </>
        )}

        {/* Congresso (Inscritos): CREDENCIADOR, COORDENADORA, COORDENADORA_EVENTO, SUPORTE, DP e DIRETORA */}
        {(user?.nivel?.toUpperCase() === 'CREDENCIADOR' || user?.nivel?.toUpperCase() === 'COORDENADORA' || user?.nivel?.toUpperCase() === 'COORDENADORA_EVENTO' || user?.nivel?.toUpperCase() === 'SUPORTE' || user?.nivel?.toUpperCase() === 'DP' || user?.nivel?.toUpperCase() === 'DIRETORA') && (
          <>
            <div className="mobile-drawer__divider" />
            <Link
              href="/inscritos-congresso"
              className={`mobile-drawer__link ${
                pathname === '/inscritos-congresso' ? 'mobile-drawer__link--active' : ''
              }`}
              onClick={() => setMenuOpen(false)}
            >
              <Image
                src="/images/user_icon.svg"
                alt=""
                width={20}
                height={20}
                className="mobile-drawer__icon"
              />
              <span>Congresso 2026</span>
            </Link>
          </>
        )}

        {/* Chamados e Usuários: Apenas SUPORTE */}
        {user?.nivel?.toUpperCase() === 'SUPORTE' && (
          <>
            <div className="mobile-drawer__divider" />
            <Link
              href="/chamados"
              className={`mobile-drawer__link ${
                pathname === '/chamados' ? 'mobile-drawer__link--active' : ''
              }`}
              onClick={() => setMenuOpen(false)}
            >
              <Image
                src="/images/warning-triangle.svg"
                alt=""
                width={20}
                height={20}
                className="mobile-drawer__icon"
              />
              <span>Chamados</span>
            </Link>

            <div className="mobile-drawer__divider" />
            <Link
              href="/usuarios"
              className={`mobile-drawer__link ${
                pathname === '/usuarios' ? 'mobile-drawer__link--active' : ''
              }`}
              onClick={() => setMenuOpen(false)}
            >
              <Image
                src="/images/user_icon.svg"
                alt=""
                width={20}
                height={20}
                className="mobile-drawer__icon"
              />
              <span>Gerenciar Usuários</span>
            </Link>
          </>
        )}
      </nav>
    </>
  );
}
