'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function MobileHeader() {
  const pathname = usePathname();
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

  const denunciaLinks = [
    { href: '/admin/fila', label: 'Na fila' },
    { href: '/admin/andamento', label: 'Em andamento' },
    { href: '/admin/fechadas', label: 'Fechadas' },
    { href: '/admin/arquivadas', label: 'Arquivadas' },
  ];

  return (
    <>
      <header className="mobile-header">
        <Link href="/admin" className="mobile-header__logo">
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
          <Link href="/admin" className="mobile-drawer__logo" onClick={() => setMenuOpen(false)}>
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
              ▼
            </span>
          </button>

          {denunciasOpen && (
            <div className="mobile-drawer__subitems">
              {denunciaLinks.map((link) => (
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
          href="/admin/estatisticas"
          className={`mobile-drawer__link ${
            pathname === '/admin/estatisticas' ? 'mobile-drawer__link--active' : ''
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
      </nav>
    </>
  );
}
