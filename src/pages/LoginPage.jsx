import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', senha: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(location.state?.success ?? '');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userData = await login(form.email, form.senha);
      // Redireciona para área correta conforme role
      if (userData.role === 'BARBEIRO') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/cliente/inicio', { replace: true });
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setError('E-mail ou senha incorretos.');
      } else {
        setError('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <h1>✂ Barbearia</h1>
          <p>Entre com sua conta para continuar</p>
        </div>

        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">E-mail</label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-input"
              placeholder="seu@email.com"
              value={form.email}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="senha">Senha</label>
            <input
              id="senha"
              name="senha"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={form.senha}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: '8px', padding: '11px' }}
            disabled={loading}
          >
            {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Entrar'}
          </button>
        </form>

        <div className="login-divider">
          <span>ou</span>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
          Não tem conta?{' '}
          <Link to="/cadastro" style={{ color: 'var(--text-secondary)', textDecoration: 'underline' }}>
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}
