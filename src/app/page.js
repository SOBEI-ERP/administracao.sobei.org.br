'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { consultarProtocolo } from '@/lib/api';

export default function LandingPage() {
  const [protocolo, setProtocolo] = useState('');
  const [resultado, setResultado] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [buscou, setBuscou] = useState(false);

  async function handleConsultar(e) {
    e.preventDefault();
    if (!protocolo.trim()) return;

    setBuscando(true);
    setBuscou(false);
    try {
      const res = await consultarProtocolo(protocolo.trim());
      setResultado(res);
      setBuscou(true);
    } catch {
      setResultado(null);
      setBuscou(true);
    } finally {
      setBuscando(false);
    }
  }

  return (
    <main className="landing">
      {/* ---- Hero Section ---- */}
      <section className="hero">
        <Image
          src="/images/LOGO BRANCO.png"
          alt="SOBEI - Sociedade Beneficente Equilíbrio de Interlagos"
          width={280}
          height={112}
          className="hero__logo"
          priority
        />
        <h1 className="hero__title">A SOBEI ESTÁ COM VOCÊ!</h1>
        <h2 className="hero__subtitle">Canal de Comunicação e Denúncias</h2>
        <p className="hero__description">
          Esta plataforma é o ambiente oficial e seguro para relatar condutas inadequadas,
          violações éticas ou irregularidades. Nosso objetivo é manter a integridade, a segurança
          e a transparência em nossas unidades, garantindo que todos os relatos sejam tratados com
          a máxima confidencialidade, seriedade e rigor analítico.
        </p>
        <p className="hero__description">
          Você pode utilizar este espaço tanto para reportar situações das quais foi vítima
          quanto eventos que tenha presenciado.
        </p>
        <div className="hero__cta">
          <Link href="/denuncia" className="btn btn--outline-white">
            <strong>Denúnciar</strong>
          </Link>
        </div>
      </section>

      {/* ---- How It Works ---- */}
      <section className="how-it-works">
        <h2 className="how-it-works__title">Como funciona?</h2>

        <div className="how-it-works__step">
          <h3 className="how-it-works__step-title">1. Faça seu relato</h3>
          <p className="how-it-works__step-text">
            Esta plataforma é o ambiente oficial e seguro para relatar condutas inadequadas,
            violações éticas ou irregularidades. Nosso objetivo é manter a integridade, a segurança
            e a transparência em nossas unidades, garantindo que todos os relatos sejam tratados com
            a máxima confidencialidade, seriedade e rigor analítico.
          </p>
          <p className="how-it-works__step-text" style={{ marginTop: '8px' }}>
            Você pode utilizar este espaço tanto para reportar situações das quais foi vítima
            quanto eventos que tenha presenciado.
          </p>
        </div>

        <div className="how-it-works__step">
          <h3 className="how-it-works__step-title">2. Guarde o seu Protocolo</h3>
          <p className="how-it-works__step-text">
            Assim que a denúncia for enviada, o sistema exibirá um número de protocolo único na tela.
            Anote e guarde este número em um local seguro. Por questões de sigilo, esta será a única
            forma de acessar o seu relato futuramente.
          </p>
        </div>

        <div className="how-it-works__step">
          <h3 className="how-it-works__step-title">3. Acompanhe o Andamento</h3>
          <p className="how-it-works__step-text">
            Você não precisa se identificar para saber o que aconteceu com a sua denúncia. Utilize
            a barra de pesquisa disponível no topo desta página inicial, insira o seu número de
            protocolo e acompanhe o status da investigação. Por lá, você também poderá visualizar
            as respostas ou possíveis pedidos de esclarecimento anexados pela equipe de apuração.
          </p>
        </div>
      </section>

      {/* ---- Protocol Search ---- */}
      <section className="protocol-search">
        <h2 className="protocol-search__title">Consulte o andamento da sua denúncia</h2>
        <p className="protocol-search__label">
          Digite o numero de protocolo da sua denúncia:
        </p>

        <form onSubmit={handleConsultar}>
          <div className="protocol-search__input-group">
            <input
              type="text"
              className="protocol-search__input"
              placeholder="Digite seu numero de protocolo"
              value={protocolo}
              onChange={(e) => setProtocolo(e.target.value)}
              id="protocol-input"
            />
          </div>

          {/* Timeline de status */}
          {buscou && resultado && resultado.found && (
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <p className="protocol-search__protocol-number" style={{ marginBottom: '24px' }}>
                Protocolo: {resultado.protocolo}
              </p>
              <div className="timeline">
                {resultado.timeline.map((item, i) => (
                  <div className="timeline__item" key={i}>
                    <div
                      className={`timeline__dot ${
                        item.active ? 'timeline__dot--active' : 'timeline__dot--pending'
                      }`}
                    />
                    <span className="timeline__text">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {buscou && resultado && !resultado.found && (
            <p style={{ color: 'var(--color-accent)', textAlign: 'center', margin: '16px 0', fontSize: '14px' }}>
              Protocolo não encontrado. Verifique o número e tente novamente.
            </p>
          )}

          <div className="protocol-search__btn" style={{ textAlign: 'center' }}>
            <button
              type="submit"
              className="btn btn--outline-white"
              disabled={buscando}
            >
              <strong>{buscando ? 'Consultando...' : 'Consultar'}</strong>
            </button>
          </div>
        </form>
      </section>

      {/* Footer spacer */}
      <div style={{ height: '80px' }} />
    </main>
  );
}
