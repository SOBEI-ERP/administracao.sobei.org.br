'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { DENUNCIA_LINKS } from '@/lib/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { IconChevronDown } from '@/components/Icons';

export default function MobileHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [denunciasOpen, setDenunciasOpen] = useState(true);
  const headerRef = useRef(null);

  // Fecha o menu automaticamente ao navegar para outra rota
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Fecha o menu ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  // Trava a rolagem do body quando o menu está aberto
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

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    router.push('/');
  };

  const nivel = user?.nivel?.toUpperCase();
  const defaultHome = 
    nivel === 'DIRETORA' ? '/vagas' : 
    (nivel === 'COORDENADORA' || nivel === 'CREDENCIADOR' || nivel === 'COORDENADORA_EVENTO') ? '/inscritos-congresso' : 
    '/dashboard';

  return (
    <div className="mobile-header-wrapper" ref={headerRef}>
      <header className="mobile-header">
        <Link href={defaultHome} className="mobile-header__logo" onClick={() => setMenuOpen(false)}>
          <Image
            src="/images/LOGO TRIANGULO TRANSPARENTE.png"
            alt="SOBEI"
            width={44}
            height={44}
            priority
            className="mobile-header__logo-img"
          />
        </Link>

        <button
          className={`mobile-header__toggle ${menuOpen ? 'mobile-header__toggle--active' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          type="button"
          aria-label="Toggle Menu"
          aria-expanded={menuOpen}
        >
          <span className="mobile-header__toggle-bar" />
          <span className="mobile-header__toggle-bar" />
          <span className="mobile-header__toggle-bar" />
        </button>
      </header>

      {/* Backdrop overlay */}
      <div
        className={`mobile-header__backdrop ${menuOpen ? 'mobile-header__backdrop--visible' : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Dropdown Navigation Menu (Desliza para baixo a partir do header) */}
      <nav className={`mobile-header__nav ${menuOpen ? 'mobile-header__nav--open' : ''}`}>
        <div className="mobile-header__nav-list">
          {/* Denúncias e Estatísticas: DP e SUPORTE */}
          {(nivel === 'DP' || nivel === 'SUPORTE') && (
            <>
              {/* Denúncias Section */}
              <div className="mobile-header__section">
                <button
                  className="mobile-header__section-header"
                  onClick={() => setDenunciasOpen(!denunciasOpen)}
                  type="button"
                >
                  <div className="mobile-header__link-content">
                    <Image
                      src="/images/attention-stop.svg"
                      alt=""
                      width={20}
                      height={20}
                      className="mobile-header__icon"
                    />
                    <span>Denúncias</span>
                  </div>
                  <span className={`mobile-header__chevron ${denunciasOpen ? 'mobile-header__chevron--open' : ''}`}>
                    <IconChevronDown size={14} />
                  </span>
                </button>

                {denunciasOpen && (
                  <div className="mobile-header__subitems">
                    {DENUNCIA_LINKS.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`mobile-header__subitem ${
                          pathname === link.href ? 'mobile-header__subitem--active' : ''
                        }`}
                        onClick={() => setMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="mobile-header__divider" />

              {/* Estatísticas */}
              <Link
                href="/estatisticas"
                className={`mobile-header__link ${
                  pathname === '/estatisticas' ? 'mobile-header__link--active' : ''
                }`}
                onClick={() => setMenuOpen(false)}
              >
                <div className="mobile-header__link-content">
                  <Image
                    src="/images/statistic-1.svg"
                    alt=""
                    width={20}
                    height={20}
                    className="mobile-header__icon"
                  />
                  <span>Estatísticas</span>
                </div>
              </Link>
            </>
          )}

          {/* Vagas: DIRETORA e SUPORTE */}
          {(nivel === 'DIRETORA' || nivel === 'SUPORTE') && (
            <>
              <div className="mobile-header__divider" />
              <Link
                href="/vagas"
                className={`mobile-header__link ${
                  pathname === '/vagas' ? 'mobile-header__link--active' : ''
                }`}
                onClick={() => setMenuOpen(false)}
              >
                <div className="mobile-header__link-content">
                  <Image
                    src="/images/briefcase.svg"
                    alt=""
                    width={20}
                    height={20}
                    className="mobile-header__icon"
                  />
                  <span>Vagas</span>
                </div>
              </Link>
            </>
          )}

          {/* Mensagens: DIRETORA, COORDENADORA, COORDENADORA_EVENTO e SUPORTE */}
          {(nivel === 'DIRETORA' || nivel === 'COORDENADORA' || nivel === 'COORDENADORA_EVENTO' || nivel === 'SUPORTE') && (
            <>
              <div className="mobile-header__divider" />
              <Link
                href="/mensagens"
                className={`mobile-header__link ${
                  pathname === '/mensagens' ? 'mobile-header__link--active' : ''
                }`}
                onClick={() => setMenuOpen(false)}
              >
                <div className="mobile-header__link-content">
                  <Image
                    src="/images/bell.svg"
                    alt=""
                    width={20}
                    height={20}
                    className="mobile-header__icon"
                  />
                  <span>Mensagens</span>
                </div>
              </Link>
            </>
          )}

          {/* Congresso (Inscritos): CREDENCIADOR, COORDENADORA, COORDENADORA_EVENTO, SUPORTE, DP e DIRETORA */}
          {(nivel === 'CREDENCIADOR' || nivel === 'COORDENADORA' || nivel === 'COORDENADORA_EVENTO' || nivel === 'SUPORTE' || nivel === 'DP' || nivel === 'DIRETORA') && (
            <>
              <div className="mobile-header__divider" />
              <Link
                href="/inscritos-congresso"
                className={`mobile-header__link ${
                  pathname === '/inscritos-congresso' ? 'mobile-header__link--active' : ''
                }`}
                onClick={() => setMenuOpen(false)}
              >
                <div className="mobile-header__link-content">
                  <Image
                    src="/images/user_icon.svg"
                    alt=""
                    width={20}
                    height={20}
                    className="mobile-header__icon"
                  />
                  <span>Congresso 2026</span>
                </div>
              </Link>
            </>
          )}

          {/* Chamados e Usuários: Apenas SUPORTE */}
          {nivel === 'SUPORTE' && (
            <>
              <div className="mobile-header__divider" />
              <Link
                href="/chamados"
                className={`mobile-header__link ${
                  pathname === '/chamados' ? 'mobile-header__link--active' : ''
                }`}
                onClick={() => setMenuOpen(false)}
              >
                <div className="mobile-header__link-content">
                  <Image
                    src="/images/warning-triangle.svg"
                    alt=""
                    width={20}
                    height={20}
                    className="mobile-header__icon"
                  />
                  <span>Chamados</span>
                </div>
              </Link>

              <div className="mobile-header__divider" />
              <Link
                href="/usuarios"
                className={`mobile-header__link ${
                  pathname === '/usuarios' ? 'mobile-header__link--active' : ''
                }`}
                onClick={() => setMenuOpen(false)}
              >
                <div className="mobile-header__link-content">
                  <Image
                    src="/images/user_icon.svg"
                    alt=""
                    width={20}
                    height={20}
                    className="mobile-header__icon"
                  />
                  <span>Gerenciar Usuários</span>
                </div>
              </Link>
            </>
          )}
        </div>

        {/* Logout Button at Bottom */}
        <div className="mobile-header__logout">
          <div className="mobile-header__divider" />
          <button
            onClick={handleLogout}
            className="mobile-header__link mobile-header__link--logout"
            type="button"
          >
            <div className="mobile-header__link-content">
              <Image
                src="/images/Log_Out.svg"
                alt=""
                width={24}
                height={24}
                className="mobile-header__icon mobile-header__icon--logout"
              />
              <span style={{ fontWeight: 'var(--font-weight-bold)' }}>Sair da Conta</span>
            </div>
          </button>
        </div>
      </nav>
    </div>
  );
}
