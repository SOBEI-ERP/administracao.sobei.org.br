'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function Sidebar() {
  const pathname = usePathname();
  const [denunciasOpen, setDenunciasOpen] = useState(true);

  const denunciaLinks = [
    { href: '/admin/fila', label: 'Na fila' },
    { href: '/admin/andamento', label: 'Em andamento' },
    { href: '/admin/fechadas', label: 'Fechadas' },
    { href: '/admin/arquivadas', label: 'Arquivadas' },
  ];

  return (
    <aside className="sidebar">
      <Link href="/admin" className="sidebar__logo">
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
        <div className="sidebar__divider" />

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
              {denunciaLinks.map((link) => (
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
          href="/admin/estatisticas"
          className={`sidebar__link ${
            pathname === '/admin/estatisticas' ? 'sidebar__link--active' : ''
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
      </nav>
    </aside>
  );
}
