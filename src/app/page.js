'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { consultarProtocolo } from '@/lib/api';
import ConsultaProtocoloModal from '@/components/ConsultaProtocoloModal';

export default function LandingPage() {
  const [protocolo, setProtocolo] = useState('');
  const [resultado, setResultado] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState(false);
  const [showModal, setShowModal] = useState(false);

  async function handleConsultar(e) {
    e.preventDefault();
    if (!protocolo.trim()) return;

    setBuscando(true);
    setErro(false);
    try {
      const res = await consultarProtocolo(protocolo.trim());
      if (res && res.found) {
        setResultado(res);
        setShowModal(true);
        setErro(false);
      } else {
        setResultado(null);
        setErro(true);
      }
    } catch {
      setResultado(null);
      setErro(true);
    } finally {
      setBuscando(false);
    }
  }

  function handleCloseModal() {
    setShowModal(false);
  }

  function handleProtocoloChange(e) {
    let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    let formatted = '';

    for (let i = 0; i < val.length && i < 9; i++) {
      let char = val[i];
      if (i < 3) {
        // Primeiros 3 devem ser letras
        if (/[A-Z]/.test(char)) {
          formatted += char;
        } else {
          break; // Ignora se não for letra
        }
      } else {
        // Restante deve ser número
        if (/[0-9]/.test(char)) {
          if (i === 3 || i === 6) {
            formatted += '-';
          }
          formatted += char;
        } else {
          break; // Ignora se não for número
        }
      }
    }

    setProtocolo(formatted);
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
              onChange={handleProtocoloChange}
              maxLength={11}
              id="protocol-input"
            />
          </div>

          {erro && (
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

      {/* ---- Modal de Consulta ---- */}
      {showModal && resultado && (
        <ConsultaProtocoloModal resultado={resultado} onClose={handleCloseModal} />
      )}
    </main>
  );
}

