'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { denunciaSchema } from '@/lib/schemas';
import { enviarDenuncia } from '@/lib/api';
import { UNIDADES } from '@/lib/mockData';

export default function FormularioPage() {
  const router = useRouter();
  const [step, setStep] = useState('form'); // 'form' | 'confirmacao' | 'protocolo'
  const [protocolo, setProtocolo] = useState('');
  const [enviando, setEnviando] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    getValues,
    setValue,
  } = useForm({
    resolver: zodResolver(denunciaSchema),
    defaultValues: {
      tipo: 'anonima',
      nomeCompleto: '',
      email: '',
      telefone: '',
      unidade: '',
      descricao: '',
      envolvidos: '',
      testemunhas: '',
    },
  });

  const tipoAtual = watch('tipo');

  function onSubmitForm(data) {
    setStep('confirmacao');
  }

  async function handleConfirmar() {
    setEnviando(true);
    try {
      const result = await enviarDenuncia(getValues());
      if (result && result.success) {
        setProtocolo(result.protocolo);
        setStep('protocolo');
      } else {
        alert(result?.message || 'Erro ao enviar denúncia. Tente novamente.');
      }
    } catch {
      alert('Erro ao enviar denúncia. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  function handleEditar() {
    setStep('form');
  }

  // ---- Render: Formulário ----
  if (step === 'form') {
    return (
      <main className="form-page">
        <div className="form-card">
          <h1 className="form-card__title">Formulário de denúncia</h1>

          <form onSubmit={handleSubmit(onSubmitForm)}>
            <div className="form-card__fields">
              {/* Tipo de denúncia */}
              <div className="form-group">
                <label className="form-label">Tipo de denuncia:</label>
                <div className="radio-group">
                  <label className="radio-option">
                    <input
                      type="radio"
                      value="anonima"
                      {...register('tipo')}
                      onChange={() => setValue('tipo', 'anonima')}
                      checked={tipoAtual === 'anonima'}
                    />
                    Denúncia anônima
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      value="identificada"
                      {...register('tipo')}
                      onChange={() => setValue('tipo', 'identificada')}
                      checked={tipoAtual === 'identificada'}
                    />
                    Denúncia identificada
                  </label>
                </div>
              </div>

              {/* Campos de identificação (se identificada) */}
              {tipoAtual === 'identificada' && (
                <>
                  <div className="form-group">
                    <label className="form-label" htmlFor="nome">
                      Nome completo:
                    </label>
                    <input
                      type="text"
                      id="nome"
                      className={`form-input ${errors.nomeCompleto ? 'form-input--error' : ''}`}
                      placeholder="Digite seu nome."
                      {...register('nomeCompleto')}
                    />
                    {errors.nomeCompleto && <span className="form-error">{errors.nomeCompleto.message}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="email">
                      Email(corporativo ou pessoal):
                    </label>
                    <input
                      type="email"
                      id="email"
                      className={`form-input ${errors.email ? 'form-input--error' : ''}`}
                      placeholder="Digite seu email."
                      {...register('email')}
                    />
                    {errors.email && <span className="form-error">{errors.email.message}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="telefone">
                      Numero de telefone:
                    </label>
                    <input
                      type="tel"
                      id="telefone"
                      className={`form-input ${errors.telefone ? 'form-input--error' : ''}`}
                      placeholder="Digite seu numero."
                      {...register('telefone')}
                    />
                    {errors.telefone && (
                      <span className="form-error">{errors.telefone.message}</span>
                    )}
                  </div>
                </>
              )}

              {/* Unidade */}
              <div className="form-group">
                <label className="form-label" htmlFor="unidade">
                  Em qual unidade ocorreu?
                </label>
                <select
                  id="unidade"
                  className={`form-select ${errors.unidade ? 'form-input--error' : ''}`}
                  {...register('unidade')}
                >
                  <option value="">Selecione a unidade</option>
                  {UNIDADES.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                {errors.unidade && <span className="form-error">{errors.unidade.message}</span>}
              </div>

              {/* Descrição */}
              <div className="form-group">
                <label className="form-label" htmlFor="descricao">
                  Descrição dos fatos:
                </label>
                <textarea
                  id="descricao"
                  className={`form-textarea ${errors.descricao ? 'form-input--error' : ''}`}
                  placeholder="Descreva como aconteceu(contexto, cronologia e etc.)."
                  rows={8}
                  {...register('descricao')}
                />
                {errors.descricao && (
                  <span className="form-error">{errors.descricao.message}</span>
                )}
              </div>

              {/* Envolvidos */}
              <div className="form-group">
                <label className="form-label" htmlFor="envolvidos">
                  Quem estava envolvido?
                </label>
                <input
                  type="text"
                  id="envolvidos"
                  className="form-input"
                  placeholder="Liste ou escreva quem foram os envolvidos."
                  {...register('envolvidos')}
                />
              </div>

              {/* Testemunhas */}
              <div className="form-group">
                <label className="form-label" htmlFor="testemunhas">
                  Quem testemunhou os fatos?
                </label>
                <input
                  type="text"
                  id="testemunhas"
                  className="form-input"
                  placeholder="Liste ou escreva quem testemunhou os fatos."
                  {...register('testemunhas')}
                />
              </div>
            </div>

            <div className="form-card__actions">
              <button type="submit" className="btn btn--primary btn--full" id="btn-enviar-denuncia">
                Enviar denúncia
              </button>
            </div>
          </form>
        </div>
      </main>
    );
  }

  // ---- Render: Confirmação ----
  if (step === 'confirmacao') {
    const dados = getValues();

    return (
      <main className="form-page">
        <div className="form-card confirmacao-card">
          <h1 className="confirmacao-card__title">Confirme os dados da sua denúncia</h1>
          <p className="confirmacao-card__desc">
            Por favor, revise atentamente as informações abaixo antes de concluir o envio.
            Lembre-se de que a precisão destes dados é fundamental para a apuração.
          </p>

          <div className="confirmacao-card__section">
            <ul className="confirmacao-card__list">
              <li>
                <strong>Tipo de denúncia:</strong> Denúncia {dados.tipo}
              </li>
              {dados.tipo === 'identificada' && (
                <>
                  <li>
                    <strong>Nome completo:</strong> {dados.nomeCompleto || '[Não informado]'}
                  </li>
                  <li>
                    <strong>Email:</strong> {dados.email || '[Não informado]'}
                  </li>
                  <li>
                    <strong>Número de telefone:</strong> {dados.telefone || '[Não informado]'}
                  </li>
                </>
              )}
              <li>
                <strong>Unidade do ocorrido:</strong> {dados.unidade}
              </li>
            </ul>
          </div>

          <div className="confirmacao-card__section">
            <h3 className="confirmacao-card__section-title">Detalhes do Ocorrido</h3>
            <ul className="confirmacao-card__list">
              <li>
                <strong>Descrição dos fatos:</strong>
              </li>
              <li>&ldquo;{dados.descricao}&rdquo;</li>
              <li>
                <strong>Envolvidos:</strong> {dados.envolvidos || 'Não informado'}
              </li>
              <li>
                <strong>Testemunhas:</strong> {dados.testemunhas || 'Não informado'}
              </li>
            </ul>
          </div>

          <div className="confirmacao-card__actions">
            <button
              className="btn btn--secondary btn--full"
              onClick={handleEditar}
              id="btn-editar-dados"
            >
              Editar dados
            </button>
            <button
              className="btn btn--primary btn--full"
              onClick={handleConfirmar}
              disabled={enviando}
              id="btn-confirmar-protocolo"
            >
              {enviando ? 'Gerando protocolo...' : 'Confirmar e gerar protocolo'}
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ---- Render: Protocolo Gerado ----
  if (step === 'protocolo') {
    return (
      <main className="form-page">
        <div className="protocol-modal-overlay" onClick={() => router.push('/')}>
          <div className="protocol-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="protocol-modal__close"
              onClick={() => router.push('/')}
              aria-label="Fechar"
            >
              ×
            </button>
            <h2 className="protocol-modal__title">Sua denuncia foi registrada com sucesso!</h2>
            <h3 className="protocol-modal__subtitle">ANOTE SEU NÚMERO DE PROTOCOLO</h3>
            <div className="protocol-modal__number">{protocolo}</div>
            <p className="protocol-modal__info">
              Você precisará deste código sempre que quiser consultar o andamento da sua
              manifestação. Inserindo o protocolo no campo de busca da nossa página inicial, você
              poderá verificar o status atual da apuração
            </p>
          </div>
        </div>
      </main>
    );
  }

  return null;
}
