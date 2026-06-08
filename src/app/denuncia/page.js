'use client';

import { useRouter } from 'next/navigation';

export default function DiretrizesPage() {
  const router = useRouter();

  return (
    <main className="form-page">
      <div className="form-card diretrizes-card">
        <h1 className="diretrizes-card__title">Diretrizes para o Registro de Denúncia</h1>

        <p className="diretrizes-card__text">
          Este canal é um instrumento oficial voltado à manutenção da ética, transparência e
          segurança em nossas unidades. A apuração de uma denúncia é um processo rigoroso que
          mobiliza recursos institucionais e impacta diretamente a rotina e a integridade das
          pessoas envolvidas.
        </p>

        <p className="diretrizes-card__text">
          Para que a equipe de análise possa conduzir uma investigação ágil e assertiva, leia com
          atenção os requisitos abaixo antes de prosseguir. Requisitos para uma denúncia eficaz:
          Para que o seu relato tenha viabilidade de apuração, é fundamental fornecer o máximo de
          detalhes possível. Durante o preenchimento, você deverá informar:
        </p>

        <ul className="diretrizes-card__list">
          <li>A unidade específica onde o incidente ocorreu.</li>
          <li>
            Uma descrição clara, cronológica e objetiva dos fatos (o que aconteceu, como, quando
            e onde).
          </li>
          <li>
            A identificação das pessoas envolvidas e, se houver, o nome de testemunhas que
            presenciaram o ocorrido.
          </li>
        </ul>

        <h2 className="diretrizes-card__subtitle">
          Compromisso com a Verdade e Denúncias Falsas:
        </h2>

        <p className="diretrizes-card__text">
          A eficácia deste canal depende da responsabilidade de quem o utiliza. Relatos
          fundamentados em boatos, informações propositalmente incompletas ou denúncias
          intencionalmente falsas (calúnia ou má-fé) não serão tolerados, pois desviam a atenção
          de problemas reais e prejudicam o ambiente de trabalho.
        </p>
        <p className="diretrizes-card__text">
          Garantimos o sigilo absoluto e a proteção do denunciante de boa-fé. Em contrapartida,
          exigimos que o relato seja pautado estritamente na verdade e em fatos concretos.
        </p>
        <p className="diretrizes-card__text">
          Ao clicar em <strong>&ldquo;Estou ciente e quero prosseguir&rdquo;</strong>, você confirma que
          compreende a seriedade deste processo e que as informações a serem fornecidas são
          verdadeiras.
        </p>

        <div className="diretrizes-card__action">
          <button
            className="btn btn--primary btn--lg"
            onClick={() => router.push('/denuncia/formulario')}
            id="btn-prosseguir"
          >
            Estou ciente e quero prosseguir
          </button>
        </div>
      </div>
    </main>
  );
}
