'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchUsuarios, criarUsuario, alterarSenhaUsuario, deletarUsuario } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function UsuariosPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states for creating user
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [novoUsuario, setNovoUsuario] = useState({ usuario: '', senha: '', nivel: 'admin' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Modal states for altering password
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [senhaTargetUser, setSenhaTargetUser] = useState(null);
  const [novaSenha, setNovaSenha] = useState('');
  const [senhaError, setSenhaError] = useState('');
  const [senhaLoading, setSenhaLoading] = useState(false);

  // Modal states for deleting user
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetUser, setDeleteTargetUser] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login');
    } else if (!authLoading && user?.nivel?.toUpperCase() !== 'SUPORTE') {
      router.push('/admin');
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    async function loadUsuarios() {
      if (user?.nivel?.toUpperCase() === 'SUPORTE') {
        const data = await fetchUsuarios();
        setUsuarios(data || []);
        setLoading(false);
      }
    }
    loadUsuarios();
  }, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    const res = await criarUsuario({
      ...novoUsuario,
      nivel: novoUsuario.nivel.toLowerCase(),
    });

    if (res.success) {
      setUsuarios([...usuarios, res.usuario]);
      setIsModalOpen(false);
      setNovoUsuario({ usuario: '', senha: '', nivel: 'admin' });
    } else {
      setFormError(res.message);
    }
    setFormLoading(false);
  };

  const handleAbrirAlterarSenha = (u) => {
    setSenhaTargetUser(u);
    setNovaSenha('');
    setSenhaError('');
    setIsPasswordModalOpen(true);
  };

  const handleAlterarSenhaSubmit = async (e) => {
    e.preventDefault();
    setSenhaLoading(true);
    setSenhaError('');

    const res = await alterarSenhaUsuario(senhaTargetUser.id, novaSenha);
    if (res.success) {
      setIsPasswordModalOpen(false);
      setSenhaTargetUser(null);
      setNovaSenha('');
    } else {
      setSenhaError(res.message);
    }
    setSenhaLoading(false);
  };

  const handleAbrirConfirmarDeletar = (u) => {
    setDeleteTargetUser(u);
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  const handleDeletarSubmit = async () => {
    setDeleteLoading(true);
    setDeleteError('');

    const res = await deletarUsuario(deleteTargetUser.id);
    if (res.success) {
      setUsuarios(usuarios.filter(u => u.id !== deleteTargetUser.id));
      setIsDeleteModalOpen(false);
      setDeleteTargetUser(null);
    } else {
      setDeleteError(res.message);
    }
    setDeleteLoading(false);
  };

  if (authLoading || loading) {
    return <div className="loading">Carregando...</div>;
  }

  if (user?.nivel?.toUpperCase() !== 'SUPORTE') {
    return null;
  }

  return (
    <div>
      <div className="statistics-header" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div>
          <h1 className="admin-page__title" style={{ marginBottom: 'var(--spacing-xs)' }}>Gestão de Usuários</h1>
          <p className="admin-page__description" style={{ marginBottom: 0 }}>
            Gerencie as credenciais e níveis de acesso dos administradores e analistas de suporte do portal.
          </p>
        </div>
        <button className="btn btn--secondary" onClick={() => setIsModalOpen(true)}>
          Novo Usuário
        </button>
      </div>

      <div className="denuncia-cards">
        {usuarios.map((u) => (
          <div key={u.id} className="denuncia-card">
            <div className="denuncia-card__info">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(27, 20, 100, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-primary)',
                  fontWeight: 'var(--font-weight-bold)',
                  fontSize: 'var(--font-size-md)',
                  flexShrink: 0
                }}>
                  {u.usuario?.charAt(0).toUpperCase()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span className="denuncia-card__field" style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-900)' }}>
                    {u.usuario}
                  </span>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
                    ID: #{u.id}
                  </span>
                </div>
              </div>
            </div>

            <div className="denuncia-card__right" style={{ flexDirection: 'row', alignItems: 'center', gap: 'var(--spacing-lg)' }}>
              <span 
                className="consulta-modal__status-badge" 
                data-status={u.nivel?.toLowerCase() === 'suporte' ? 'em_andamento' : 'fechada'}
                style={{ margin: 0, textTransform: 'uppercase' }}
              >
                {u.nivel?.toLowerCase() === 'suporte' ? 'Suporte' : 'Admin'}
              </span>
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                <button
                  className="btn btn--outline btn--sm"
                  onClick={() => handleAbrirAlterarSenha(u)}
                  type="button"
                >
                  Alterar Senha
                </button>
                {user?.usuario !== u.usuario && (
                  <button
                    className="btn btn--danger btn--sm"
                    onClick={() => handleAbrirConfirmarDeletar(u)}
                    type="button"
                  >
                    Excluir
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {usuarios.length === 0 && (
          <p style={{ color: 'var(--color-gray-500)', padding: '24px 0', textAlign: 'center' }}>
            Nenhum usuário cadastrado.
          </p>
        )}
      </div>

      {/* Modal - Novo Usuário */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal__close" onClick={() => setIsModalOpen(false)} type="button">
              ✕
            </button>
            <h2 className="modal__title">Novo Usuário</h2>
            <form onSubmit={handleCreate}>
              {formError && (
                <div className="form-error" style={{ marginBottom: 'var(--spacing-md)', textAlign: 'center' }}>
                  {formError}
                </div>
              )}
              
              <div className="form-group" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <label className="form-label">Login</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Ex: joao.silva"
                  value={novoUsuario.usuario}
                  onChange={(e) => setNovoUsuario({ ...novoUsuario, usuario: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <label className="form-label">Senha</label>
                <input
                  type="password"
                  required
                  className="form-input"
                  placeholder="Digite a senha temporária"
                  value={novoUsuario.senha}
                  onChange={(e) => setNovoUsuario({ ...novoUsuario, senha: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <label className="form-label">Nível de Acesso</label>
                <select
                  className="form-select"
                  value={novoUsuario.nivel}
                  onChange={(e) => setNovoUsuario({ ...novoUsuario, nivel: e.target.value })}
                >
                  <option value="admin">Administrador</option>
                  <option value="suporte">Suporte</option>
                </select>
              </div>

              <div className="modal__actions">
                <button type="button" className="btn btn--outline" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn--primary" disabled={formLoading}>
                  {formLoading ? 'Salvando...' : 'Criar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Alterar Senha */}
      {isPasswordModalOpen && (
        <div className="modal-overlay" onClick={() => setIsPasswordModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal__close" onClick={() => setIsPasswordModalOpen(false)} type="button">
              ✕
            </button>
            <h2 className="modal__title">Alterar Senha</h2>
            <p className="admin-page__description" style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>
              Alterando a senha de: <strong>{senhaTargetUser?.usuario}</strong>
            </p>
            <form onSubmit={handleAlterarSenhaSubmit}>
              {senhaError && (
                <div className="form-error" style={{ marginBottom: 'var(--spacing-md)', textAlign: 'center' }}>
                  {senhaError}
                </div>
              )}
              
              <div className="form-group" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <label className="form-label">Nova Senha</label>
                <input
                  type="password"
                  required
                  className="form-input"
                  placeholder="Digite a nova senha"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                />
              </div>

              <div className="modal__actions">
                <button type="button" className="btn btn--outline" onClick={() => setIsPasswordModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn--primary" disabled={senhaLoading}>
                  {senhaLoading ? 'Salvando...' : 'Atualizar Senha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Confirmar Exclusão */}
      {isDeleteModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal__close" onClick={() => setIsDeleteModalOpen(false)} type="button">
              ✕
            </button>
            <h2 className="modal__title">Excluir Usuário</h2>
            <p className="admin-page__description" style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
              Tem certeza que deseja excluir o usuário <strong>{deleteTargetUser?.usuario}</strong>? Esta ação não pode ser desfeita.
            </p>
            {deleteError && (
              <div className="form-error" style={{ marginBottom: 'var(--spacing-md)', textAlign: 'center' }}>
                {deleteError}
              </div>
            )}
            <div className="modal__actions">
              <button type="button" className="btn btn--outline" onClick={() => setIsDeleteModalOpen(false)}>
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn btn--danger" 
                onClick={handleDeletarSubmit}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


