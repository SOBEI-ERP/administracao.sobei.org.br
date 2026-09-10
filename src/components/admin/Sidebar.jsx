'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const isDenunciasActive = 
    pathname === '/fila' || 
    pathname === '/andamento' || 
    pathname === '/fechadas' || 
    pathname === '/arquivadas' || 
    pathname.startsWith('/denuncias');

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
        {/* Denúncias e Estatísticas: DP e SUPORTE */}
        {(user?.nivel?.toUpperCase() === 'DP' || user?.nivel?.toUpperCase() === 'SUPORTE') && (
          <>
            {/* Denúncias */}
            <Link
              href="/fila"
              className={`sidebar__link ${
                isDenunciasActive ? 'sidebar__link--active' : ''
              }`}
            >
              <Image 
                src="/images/attention-stop.svg" 
                alt="" 
                width={20} 
                height={20} 
                className="sidebar__icon" 
              />
              <span className="sidebar__text">Denúncias</span>
            </Link>

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
          </>
        )}

        {/* Vagas: DIRETORA e SUPORTE */}
        {(user?.nivel?.toUpperCase() === 'DIRETORA' || user?.nivel?.toUpperCase() === 'SUPORTE') && (
          <>
            <div className="sidebar__divider" />
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

        {/* Mensagens: DIRETORA, COORDENADORA, COORDENADORA_EVENTO e SUPORTE */}
        {(user?.nivel?.toUpperCase() === 'DIRETORA' || user?.nivel?.toUpperCase() === 'COORDENADORA' || user?.nivel?.toUpperCase() === 'COORDENADORA_EVENTO' || user?.nivel?.toUpperCase() === 'SUPORTE') && (
          <>
            <div className="sidebar__divider" />
            <Link
              href="/mensagens"
              className={`sidebar__link ${
                pathname === '/mensagens' ? 'sidebar__link--active' : ''
              }`}
            >
              <Image 
                src="/images/bell.svg" 
                alt="" 
                width={20} 
                height={20} 
                className="sidebar__icon" 
              />
              <span className="sidebar__text">Mensagens</span>
            </Link>
          </>
        )}

        {/* Congresso (Inscritos): CREDENCIADOR, COORDENADORA, COORDENADORA_EVENTO, SUPORTE, DP e DIRETORA */}
        {(user?.nivel?.toUpperCase() === 'CREDENCIADOR' || user?.nivel?.toUpperCase() === 'COORDENADORA' || user?.nivel?.toUpperCase() === 'COORDENADORA_EVENTO' || user?.nivel?.toUpperCase() === 'SUPORTE' || user?.nivel?.toUpperCase() === 'DP' || user?.nivel?.toUpperCase() === 'DIRETORA') && (
          <>
            <div className="sidebar__divider" />
            <Link
              href="/inscritos-congresso"
              className={`sidebar__link ${
                pathname === '/inscritos-congresso' ? 'sidebar__link--active' : ''
              }`}
            >
              <Image 
                src="/images/user_icon.svg" 
                alt="" 
                width={20} 
                height={20} 
                className="sidebar__icon" 
              />
              <span className="sidebar__text">Congresso 2026</span>
            </Link>
          </>
        )}

        {/* Chamados e Gerenciamento de Usuários: Apenas SUPORTE */}
        {user?.nivel?.toUpperCase() === 'SUPORTE' && (
          <>
            <div className="sidebar__divider" />
            {/* Chamados */}
            <Link
              href="/chamados"
              className={`sidebar__link ${
                pathname === '/chamados' ? 'sidebar__link--active' : ''
              }`}
            >
              <Image 
                src="/images/warning-triangle.svg" 
                alt="" 
                width={20} 
                height={20} 
                className="sidebar__icon" 
              />
              <span className="sidebar__text">Chamados</span>
            </Link>

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
      </nav>

      <div className="sidebar__logout">
        <button
          onClick={handleLogout}
          className="sidebar__link"
          type="button"
        >
          <Image 
            src="/images/Log_Out.svg" 
            alt="" 
            width={26} 
            height={26} 
            className="sidebar__icon sidebar__icon--logout" 
          />
          <span className="sidebar__text" style={{ fontWeight: 'var(--font-weight-bold)' }}>Sair da Conta</span>
        </button>
      </div>
    </aside>
  );
}
