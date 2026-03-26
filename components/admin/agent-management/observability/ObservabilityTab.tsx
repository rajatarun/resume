'use client';

import { useState } from 'react';
import { ObservabilityDashboard } from './ObservabilityDashboard';
import { InvocationsList } from './InvocationsList';
import { AgentMetricsView } from './AgentMetricsView';
import { ModelMetricsView } from './ModelMetricsView';

type View = 'dashboard' | 'invocations' | 'agents' | 'models';

const VIEWS: { id: View; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'invocations', label: 'Invocations' },
  { id: 'agents', label: 'Agents' },
  { id: 'models', label: 'Models' },
];

export function ObservabilityTab() {
  const [view, setView] = useState<View>('dashboard');
  // When clicking agent in AgentMetricsView, jump to Invocations pre-filtered
  const [agentFilter, setAgentFilter] = useState<string | undefined>();

  const handleAgentClick = (agentId: string) => {
    setAgentFilter(agentId);
    setView('invocations');
  };

  const handleModelClick = (modelId: string) => {
    // Navigate to invocations pre-filtered by model — reuse InvocationsList with model_id
    // We pass the model as a filter via the initialAgentId prop is for agents;
    // For models we just switch view (InvocationsList supports model filter via FilterSidebar)
    // For now, jump to invocations and let user apply filter
    void modelId; // model filter via FilterSidebar
    setView('invocations');
  };

  return (
    <div className="space-y-4">
      {/* Sub-nav */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-700">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => {
              setView(v.id);
              if (v.id !== 'invocations') setAgentFilter(undefined);
            }}
            className={`-mb-px border-b-2 px-3 py-2 text-sm transition-colors ${
              view === v.id
                ? 'border-brand-500 font-medium text-brand-500'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* View */}
      {view === 'dashboard' && <ObservabilityDashboard />}
      {view === 'invocations' && <InvocationsList initialAgentId={agentFilter} />}
      {view === 'agents' && <AgentMetricsView onAgentClick={handleAgentClick} />}
      {view === 'models' && <ModelMetricsView onModelClick={handleModelClick} />}
    </div>
  );
}
