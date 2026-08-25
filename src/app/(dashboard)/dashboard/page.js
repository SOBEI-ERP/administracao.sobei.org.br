import Image from 'next/image';

export default function AdminDashboardPage() {
  return (
    <div className="dashboard-home">
      <div className="dashboard-home__container">
        <div className="dashboard-home__logo-wrapper">
          <Image
            src="/images/LOGO AZUL.png"
            alt="SOBEI - Sociedade Beneficente Equilíbrio de Interlagos"
            width={480}
            height={192}
            className="dashboard-home__logo"
            priority
          />
        </div>

        <div className="dashboard-home__header">
          <h1 className="dashboard-home__title">Painel de Administração</h1>
          <p className="dashboard-home__subtitle">
            Selecione uma opção no menu lateral para gerenciar as demandas
          </p>
        </div>
      </div>
    </div>
  );
}


