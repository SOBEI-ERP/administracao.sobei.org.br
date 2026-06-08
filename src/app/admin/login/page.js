'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { loginSchema } from '@/lib/schemas';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [erro, setErro] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { login: '', senha: '' },
  });

  async function onSubmit(data) {
    setErro('');
    const result = await login(data);
    if (result.success) {
      router.push('/admin');
    } else {
      setErro(result.message || 'Credenciais inválidas');
    }
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="login-card__logo">
          <Image
            src="/images/LOGO AZUL.png"
            alt="SOBEI"
            width={260}
            height={104}
            priority
          />
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="login-card__fields">
            <div className="form-group">
              <label className="form-label" htmlFor="login">
                Login
              </label>
              <input
                type="text"
                id="login"
                className={`form-input ${errors.login ? 'form-input--error' : ''}`}
                placeholder="Digite seu nome."
                {...register('login')}
              />
              {errors.login && <span className="form-error">{errors.login.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="senha">
                Senha
              </label>
              <input
                type="password"
                id="senha"
                className={`form-input ${errors.senha ? 'form-input--error' : ''}`}
                placeholder="Digite seu nome."
                {...register('senha')}
              />
              {errors.senha && <span className="form-error">{errors.senha.message}</span>}
            </div>
          </div>

          {erro && (
            <p className="form-error" style={{ textAlign: 'center', marginBottom: '16px' }}>
              {erro}
            </p>
          )}

          <button
            type="submit"
            className="btn btn--primary btn--full"
            disabled={isSubmitting}
            id="btn-login"
          >
            {isSubmitting ? 'Entrando...' : 'Enviar denúncia'}
          </button>
        </form>
      </div>
    </main>
  );
}
