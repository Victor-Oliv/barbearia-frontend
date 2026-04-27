/**
 * Dashboard — Visão geral com contadores
 *
 * Conceito — Promise.all:
 * Executa múltiplas promises em paralelo. Em vez de aguardar
 * cada chamada de API sequencialmente (lento), todas disparam
 * ao mesmo tempo e esperamos todas terminarem.
 */

import { useEffect, useState } from 'react';
import { clienteService } from '../api/clienteService';
import { barbeiroService } from '../api/barbeiroService';
import { servicoService } from '../api/servicoService';
import { agendamentoService } from '../api/agendamentoService';

const today = new Date().toISOString().split('T')[0];

export default function DashboardPage() {
  const [stats, setStats] = useState({ clientes: 0, barbeiros: 0, servicos: 0, agendamentos: 0 });
  const [agendamentosHoje, setAgendamentosHoje] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      clienteService.listar(),
      barbeiroService.listar(),
      servicoService.listar(),
      agendamentoService.listar(),
    ])
      .then(([clientes, barbeiros, servicos, agendamentos]) => {
        const hoje = agendamentos.filter((a) => a.data === today);
        setStats({
          clientes: clientes.length,
          barbeiros: barbeiros.length,
          servicos: servicos.length,
          agendamentos: agendamentos.length,
        });
        setAgendamentosHoje(hoje);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👤</div>
          <div>
            <div className="stat-value">{stats.clientes}</div>
            <div className="stat-label">Clientes</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✂️</div>
          <div>
            <div className="stat-value">{stats.barbeiros}</div>
            <div className="stat-label">Barbeiros</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🗒️</div>
          <div>
            <div className="stat-value">{stats.servicos}</div>
            <div className="stat-label">Serviços</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div>
            <div className="stat-value">{stats.agendamentos}</div>
            <div className="stat-label">Agendamentos</div>
          </div>
        </div>
      </div>

      {/* Agendamentos de hoje */}
      <div className="table-wrapper">
        <div className="table-toolbar">
          <span className="table-toolbar-title">
            Agendamentos de Hoje ({agendamentosHoje.length})
          </span>
        </div>

        {agendamentosHoje.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <p>Nenhum agendamento para hoje</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Hora</th>
                <th>Cliente</th>
                <th>Barbeiro</th>
                <th>Serviços</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {agendamentosHoje
                .sort((a, b) => a.hora.localeCompare(b.hora))
                .map((ag) => (
                  <tr key={ag.id}>
                    <td>
                      <code style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                        {ag.hora.slice(0, 5)}
                      </code>
                    </td>
                    <td>{ag.cliente.nome}</td>
                    <td>{ag.barbeiro.nome}</td>
                    <td>
                      {ag.itens.map((item) => item.servico.nomeServico).join(', ')}
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                        R$ {parseFloat(ag.valorTotal).toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
