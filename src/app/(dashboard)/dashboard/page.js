import Image from 'next/image';

export default function AdminDashboardPage() {
  return (
    <div className="dashboard-home">
      <div className="dashboard-home__content">
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

        <h1 className="dashboard-home__title">
          Painel de administração de denúncias
        </h1>
      </div>
    </div>
  );
}



