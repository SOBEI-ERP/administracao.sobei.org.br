import Image from 'next/image';

export default function AdminDashboardPage() {
  return (
    <div className="dashboard-home">
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
    </div>
  );
}

