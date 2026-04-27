/**
 * Página pública de cadastro de cliente.
 *
 * Melhoria implementada: auto-login após cadastro.
 * Após criar a conta com sucesso, o usuário é automaticamente
 * autenticado e redirecionado para a área do cliente.
 * Isso evita a fricção de ter que digitar email/senha novamente.
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { clienteService } from '../api/clienteService';
import { useAuth } from '../contexts/AuthContext';

export default function CadastroPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ nome: '', telefone: '', email: '', senha: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Cria a conta
      await clienteService.criar(form);
      // 2. Faz login automático com as mesmas credenciais
      await login(form.email, form.senha);
      // 3. Redireciona para a área do cliente
      navigate('/cliente/inicio', { replace: true });
    } catch (err) {
      // Se o cadastro funcionou mas o login falhou, vai para o login manual
      if (err.response?.status === 401) {
        navigate('/login', { state: { success: 'Conta criada! Faça login para continuar.' } });
        return;
      }
      setError(
        err.response?.data?.message ?? 'Erro ao criar conta. Verifique os dados e tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <h1>✂ Barbearia</h1>
          <p>Crie sua conta</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nome</label>
            <input
              name="nome"
              type="text"
              className="form-input"
              placeholder="Seu nome"
              value={form.nome}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Telefone</label>
            <input
              name="telefone"
              type="tel"
              className="form-input"
              placeholder="(11) 99999-9999"
              value={form.telefone}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">E-mail</label>
            <input
              name="email"
              type="email"
              className="form-input"
              placeholder="seu@email.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Senha</label>
            <input
              name="senha"
              type="password"
              className="form-input"
              placeholder="Mínimo 6 caracteres"
              value={form.senha}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: '8px', padding: '11px' }}
            disabled={loading}
          >
            {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Criar conta'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 20 }}>
          Já tem conta?{' '}
          <Link to="/login" style={{ color: 'var(--text-secondary)', textDecoration: 'underline' }}>
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
