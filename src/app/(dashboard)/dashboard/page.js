'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const userName = user?.nome || 'José Antônio';
  const userNivel = user?.nivel || 'SUPORTE TI';

  return (
    <div className="dashboard-home">
      <div className="dashboard-home__content">
        {/* Logo Institucional */}
        <div className="dashboard-home__logo-wrapper">
          <Image
            src="/images/LOGO AZUL.png"
            alt="SOBEI - Sociedade Beneficente Equilíbrio de Interlagos"
            width={460}
            height={184}
            className="dashboard-home__logo"
            priority
          />
        </div>

        {/* Título e Boas-Vindas */}
        <div style={{ maxWidth: '720px', width: '100%' }}>
          <h1 className="dashboard-home__title">
            Portal Administrativo SOBEI
          </h1>
          <p className="dashboard-home__subtitle">
            Bem-vindo, <strong>{userName}</strong> ({userNivel}). Selecione uma das áreas operacionais abaixo ou navegue pelo menu lateral para dar andamento aos processos institucionais.
          </p>
        </div>

        {/* Cards de Atalhos Operacionais */}
        <div className="dashboard-home__cards">
          {/* 1. Fila de Denúncias */}
          <Link href="/fila" className="dashboard-home__card">
            <div className="dashboard-home__card-icon dashboard-home__card-icon--denuncias">
              <Image
                src="/images/attention-stop.svg"
                alt="Fila de Denúncias"
                width={24}
                height={24}
              />
            </div>
            <h3 className="dashboard-home__card-title">Fila de Denúncias</h3>
            <p className="dashboard-home__card-desc">
              18 novos relatos para triagem inicial.
            </p>
          </Link>

          {/* 2. Estatísticas & Heatmap */}
          <Link href="/estatisticas" className="dashboard-home__card">
            <div className="dashboard-home__card-icon dashboard-home__card-icon--estatisticas">
              <Image
                src="/images/statistic-1.svg"
                alt="Estatísticas"
                width={24}
                height={24}
              />
            </div>
            <h3 className="dashboard-home__card-title">Estatísticas &amp; Heatmap</h3>
            <p className="dashboard-home__card-desc">
              Métricas e concentração por unidade.
            </p>
          </Link>

          {/* 3. Gestão de Vagas */}
          <Link href="/vagas" className="dashboard-home__card">
            <div className="dashboard-home__card-icon dashboard-home__card-icon--vagas">
              <Image
                src="/images/briefcase.svg"
                alt="Gestão de Vagas"
                width={24}
                height={24}
              />
            </div>
            <h3 className="dashboard-home__card-title">Gestão de Vagas</h3>
            <p className="dashboard-home__card-desc">
              6 processos seletivos e banco de currículos.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
