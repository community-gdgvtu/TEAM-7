import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Terminal,
  Activity,
  Cpu,
  Database,
  Radio,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  Code2,
  BrainCircuit,
  Network,
  BarChart3,
  RefreshCw,
  Play,
  ChevronRight,
  Eye,
  Layers,
  Server,
  Shield,
} from 'lucide-react';
import type { NegotiationSession } from '../types';
import { healthApi, aiApi, factBusApi } from '../services/apiClient';
import type { SystemHealth, FactBusEvent } from '../services/apiClient';
import {
  createNegotiationAgent,
  PANCHAYAT_TOOL_DECLARATIONS,
  type AgentThought,
  type AgentRunResult,
} from '../services/geminiAgent';

interface CommandCenterProps {
  session: NegotiationSession;
}

// ─── Sub-component: Status Badge ─────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const configs: Record<string, { color: string; dot: string; label: string }> = {
    HEALTHY: { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', dot: 'bg-emerald-400', label: 'HEALTHY' },
    DEGRADED: { color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', dot: 'bg-amber-400 animate-pulse', label: 'DEGRADED' },
    OFFLINE: { color: 'text-red-400 bg-red-500/10 border-red-500/30', dot: 'bg-red-400 animate-ping', label: 'OFFLINE' },
    SUCCESS: { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', dot: 'bg-emerald-400', label: 'SUCCESS' },
    VALIDATION_ERROR: { color: 'text-red-400 bg-red-500/10 border-red-500/30', dot: 'bg-red-400', label: 'VALIDATION_ERROR' },
    AUTHORIZATION_ERROR: { color: 'text-orange-400 bg-orange-500/10 border-orange-500/30', dot: 'bg-orange-400', label: 'AUTH_ERROR' },
    EXECUTION_ERROR: { color: 'text-red-400 bg-red-500/10 border-red-500/30', dot: 'bg-red-400', label: 'EXEC_ERROR' },
  };
  const c = configs[status] ?? { color: 'text-slate-400 bg-slate-800 border-slate-700', dot: 'bg-slate-400', label: status };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold tracking-wider ${c.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
};

// ─── Sub-component: Metric Card ───────────────────────────────────────────────
const MetricCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}> = ({ icon, label, value, sub, accent = 'from-indigo-500 to-purple-600' }) => (
  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center gap-4 hover:border-slate-700 transition-colors">
    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${accent} flex items-center justify-center flex-shrink-0 shadow-lg`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">{label}</p>
      <p className="text-xl font-black text-white leading-tight truncate">{value}</p>
      {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ─── Sub-component: FSM State Visualizer ─────────────────────────────────────
const FSM_STATES = [
  'DISCOVERED', 'CONTACTED', 'INITIAL_OFFER', 'NEGOTIATING',
  'COUNTER_OFFER', 'FINAL_OFFER', 'VERIFICATION', 'COMPLETED'
];

const FsmVisualizer: React.FC<{ currentState: string }> = ({ currentState }) => {
  const idx = FSM_STATES.indexOf(currentState.toUpperCase());
  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-1">
      {FSM_STATES.map((state, i) => {
        const isPast = i < idx;
        const isCurrent = i === idx;
        return (
          <React.Fragment key={state}>
            <div className={`flex flex-col items-center gap-1 flex-shrink-0 px-1 ${isCurrent ? 'scale-110' : ''} transition-transform duration-300`}>
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black transition-all duration-500 ${
                  isCurrent
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/40 ring-2 ring-indigo-400/50'
                    : isPast
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-800 text-slate-600'
                }`}
              >
                {isPast ? <CheckCircle2 className="w-3 h-3" /> : i + 1}
              </div>
              <span className={`text-[8px] font-semibold tracking-tight leading-tight text-center w-14 ${
                isCurrent ? 'text-indigo-300' : isPast ? 'text-emerald-500' : 'text-slate-600'
              }`}>
                {state.replace('_', '\n')}
              </span>
            </div>
            {i < FSM_STATES.length - 1 && (
              <div className={`w-4 h-px flex-shrink-0 mt-[-10px] transition-colors duration-500 ${i < idx ? 'bg-emerald-500' : 'bg-slate-700'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ─── Sub-component: Agent Thought Stream ──────────────────────────────────────
const ThoughtBubble: React.FC<{ thought: AgentThought; index: number }> = ({ thought, index }) => {
  const typeConfig: Record<AgentThought['type'], { icon: React.ReactNode; color: string; label: string }> = {
    reasoning: { icon: <BrainCircuit className="w-3 h-3" />, color: 'border-indigo-500/30 bg-indigo-500/5', label: 'REASONING' },
    tool_call: { icon: <Code2 className="w-3 h-3" />, color: 'border-amber-500/30 bg-amber-500/5', label: 'TOOL CALL' },
    tool_result: { icon: <CheckCircle2 className="w-3 h-3" />, color: 'border-emerald-500/30 bg-emerald-500/5', label: 'RESULT' },
    final_answer: { icon: <Zap className="w-3 h-3" />, color: 'border-purple-500/30 bg-purple-500/5', label: 'FINAL ANSWER' },
  };
  const cfg = typeConfig[thought.type];

  return (
    <div
      className={`border rounded-lg p-3 text-xs animate-fade-in ${cfg.color}`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`flex items-center gap-1 text-[9px] font-bold tracking-widest uppercase ${
          thought.type === 'final_answer' ? 'text-purple-400'
          : thought.type === 'tool_call' ? 'text-amber-400'
          : thought.type === 'tool_result' ? 'text-emerald-400'
          : 'text-indigo-400'
        }`}>
          {cfg.icon} {cfg.label}
        </span>
        <span className="ml-auto text-[9px] text-slate-600">step {thought.step}</span>
      </div>
      {thought.type === 'final_answer' ? (
        <div className="text-slate-200 leading-relaxed whitespace-pre-wrap font-medium">{thought.content}</div>
      ) : (
        <div className="text-slate-400 leading-relaxed">{thought.content}</div>
      )}
      {thought.tool_call && thought.tool_call.status !== 'PENDING' && thought.tool_call.status !== 'EXECUTING' && (
        <div className="mt-2 p-2 bg-slate-950/60 rounded font-mono text-[9px] text-slate-500 overflow-hidden">
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge status={thought.tool_call.status} />
            {thought.tool_call.latency_ms !== undefined && (
              <span className="text-slate-600">{thought.tool_call.latency_ms.toFixed(0)}ms</span>
            )}
            {thought.tool_call.call_id && (
              <span className="text-slate-700 truncate">{thought.tool_call.call_id}</span>
            )}
          </div>
          <pre className="overflow-x-auto max-h-20 text-slate-500 leading-relaxed">
            {JSON.stringify(thought.tool_call.result ?? thought.tool_call.error, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

// ─── Main Command Center ───────────────────────────────────────────────────────

export const CommandCenter: React.FC<CommandCenterProps> = ({ session }) => {
  // Health
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);

  // AI Tool Registry
  const [tools, setTools] = useState<string[]>([]);

  // Agent Run
  const [agentInput, setAgentInput] = useState('');
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentResult, setAgentResult] = useState<AgentRunResult | null>(null);
  const [liveThoughts, setLiveThoughts] = useState<AgentThought[]>([]);
  const thoughtsEndRef = useRef<HTMLDivElement>(null);

  // Fact Bus
  const [factBusEvents, setFactBusEvents] = useState<FactBusEvent[]>([]);
  const [factBusLoading, setFactBusLoading] = useState(false);
  const [selectedFactBusSession, setSelectedFactBusSession] = useState('');

  // Active tab
  const [activePanel, setActivePanel] = useState<'agent' | 'factbus' | 'tools' | 'health'>('agent');

  // ─── Load health on mount + poll every 15s ──────────────────────────────
  const loadHealth = useCallback(async () => {
    setHealthLoading(true);
    const h = await healthApi.getHealth();
    setHealth(h);
    setHealthLoading(false);
  }, []);

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 15000);
    return () => clearInterval(interval);
  }, [loadHealth]);

  // ─── Load tool registry ─────────────────────────────────────────────────
  useEffect(() => {
    aiApi.listTools()
      .then((r) => setTools(r.tools))
      .catch(() => setTools(PANCHAYAT_TOOL_DECLARATIONS.map((t) => t.name)));
  }, []);

  // ─── Auto-scroll thoughts ───────────────────────────────────────────────
  useEffect(() => {
    thoughtsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveThoughts]);

  // ─── Load Fact Bus events ───────────────────────────────────────────────
  const loadFactBusEvents = useCallback(async (sid: string) => {
    if (!sid) return;
    setFactBusLoading(true);
    try {
      const res = await factBusApi.getEvents(sid);
      setFactBusEvents(res.events ?? []);
    } catch {
      setFactBusEvents([]);
    }
    setFactBusLoading(false);
  }, []);

  useEffect(() => {
    if (session.sessionId) {
      setSelectedFactBusSession(session.sessionId);
      loadFactBusEvents(session.sessionId);
    }
  }, [session.sessionId, loadFactBusEvents]);

  // ─── Run AI Agent ────────────────────────────────────────────────────────
  const handleRunAgent = async () => {
    if (!agentInput.trim() || agentRunning) return;
    setAgentRunning(true);
    setLiveThoughts([]);
    setAgentResult(null);

    const agent = createNegotiationAgent('Customer-Live-Demo');

    try {
      const result = await agent.run(agentInput.trim(), (thought) => {
        setLiveThoughts((prev) => [...prev, thought]);
      });
      setAgentResult(result);
    } catch (err) {
      setLiveThoughts((prev) => [
        ...prev,
        {
          step: prev.length + 1,
          type: 'tool_result',
          content: `Agent error: ${String(err)}`,
        },
      ]);
    }

    setAgentRunning(false);
  };

  const QUICK_PROMPTS = [
    'I need a Samsung Galaxy phone under ₹20,000',
    'Find me a laptop for coding under ₹60,000',
    'I want 5kg rice bag under ₹400',
    'Looking for a DSLR camera under ₹45,000',
  ];

  return (
    <div className="py-6 space-y-6">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Terminal className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">AI Command Center</h1>
              <p className="text-xs text-slate-500">Real-time agent orchestration & system observability</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
            health?.status === 'HEALTHY'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : health?.status === 'DEGRADED'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            <Radio className={`w-3 h-3 ${health?.status === 'HEALTHY' ? 'animate-pulse' : ''}`} />
            {healthLoading ? 'Checking...' : health?.status ?? 'OFFLINE'}
          </div>
          <button
            onClick={loadHealth}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Metrics Row ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          icon={<Cpu className="w-5 h-5 text-white" />}
          label="AI Tools Registered"
          value={tools.length || PANCHAYAT_TOOL_DECLARATIONS.length}
          sub="6-Step pipeline enforced"
          accent="from-indigo-500 to-purple-600"
        />
        <MetricCard
          icon={<Shield className="w-5 h-5 text-white" />}
          label="DB Mutation Gate"
          value="LOCKED"
          sub="Model cannot write DB"
          accent="from-emerald-500 to-teal-600"
        />
        <MetricCard
          icon={<Database className="w-5 h-5 text-white" />}
          label="Fact Bus"
          value={session.events?.length ?? 0}
          sub={`Events in session`}
          accent="from-amber-500 to-orange-600"
        />
        <MetricCard
          icon={<Network className="w-5 h-5 text-white" />}
          label="FSM State"
          value={session.status?.replace('_', ' ') ?? 'IDLE'}
          sub="Negotiation engine"
          accent="from-pink-500 to-rose-600"
        />
      </div>

      {/* ── FSM Visualizer ──────────────────────────────────────────── */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Negotiation FSM State</span>
          <span className="ml-auto text-[10px] font-mono text-slate-600">session: {session.sessionId ?? 'none'}</span>
        </div>
        <FsmVisualizer currentState={session.status ?? 'IDLE'} />
      </div>

      {/* ── Panel Tabs ───────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-900/50 p-1 rounded-xl border border-slate-800 w-full overflow-x-auto">
        {[
          { id: 'agent', label: 'AI Agent Run', icon: <BrainCircuit className="w-3.5 h-3.5" /> },
          { id: 'factbus', label: 'Fact Bus', icon: <Radio className="w-3.5 h-3.5" /> },
          { id: 'tools', label: 'Tool Registry', icon: <Code2 className="w-3.5 h-3.5" /> },
          { id: 'health', label: 'System Health', icon: <Activity className="w-3.5 h-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActivePanel(tab.id as typeof activePanel)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold flex-shrink-0 transition-all ${
              activePanel === tab.id
                ? 'bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Agent Run Panel ──────────────────────────────────────────── */}
      {activePanel === 'agent' && (
        <div className="space-y-4">
          {/* Input */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <BrainCircuit className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Gemini Function Calling Agent</span>
              <span className="ml-auto px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                {import.meta.env.VITE_GEMINI_API_KEY ? 'LIVE' : 'DEMO MODE'}
              </span>
            </div>
            
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={agentInput}
                onChange={(e) => setAgentInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRunAgent()}
                placeholder='Try: "I need a laptop for coding under ₹60,000"'
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
              />
              <button
                onClick={handleRunAgent}
                disabled={agentRunning || !agentInput.trim()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-700 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-indigo-500 hover:to-purple-600 transition-all shadow-lg shadow-indigo-500/20"
              >
                {agentRunning ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {agentRunning ? 'Running...' : 'Run Agent'}
              </button>
            </div>

            {/* Quick Prompts */}
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setAgentInput(prompt)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-400 hover:text-slate-200 transition-all border border-slate-700 hover:border-slate-600"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Thought Stream */}
          {(liveThoughts.length > 0 || agentRunning) && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Agent Thought Stream</span>
                {agentRunning && (
                  <div className="ml-auto flex items-center gap-1.5 text-[10px] text-indigo-400 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                    EXECUTING
                  </div>
                )}
                {agentResult && (
                  <div className="ml-auto flex items-center gap-3 text-[10px] text-slate-500">
                    <span className="text-emerald-400 font-semibold">✓ Complete</span>
                    <span>{agentResult.total_steps} steps</span>
                    <span>{agentResult.total_latency_ms}ms</span>
                    <span className="font-mono">{agentResult.model_used}</span>
                  </div>
                )}
              </div>
              <div className="p-4 space-y-2 max-h-[500px] overflow-y-auto">
                {liveThoughts.map((thought, i) => (
                  <ThoughtBubble key={`${thought.step}-${i}`} thought={thought} index={i} />
                ))}
                {agentRunning && (
                  <div className="flex items-center gap-2 text-xs text-indigo-400 animate-pulse p-3">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Agent is processing...
                  </div>
                )}
                <div ref={thoughtsEndRef} />
              </div>
            </div>
          )}

          {/* Tool Call Audit Log */}
          {agentResult && agentResult.tool_calls.length > 0 && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Tool Call Audit Log</span>
                <span className="ml-auto text-[10px] text-slate-600">{agentResult.tool_calls.length} calls</span>
              </div>
              <div className="divide-y divide-slate-800/50">
                {agentResult.tool_calls.map((tc, i) => (
                  <div key={tc.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/30 transition-colors">
                    <span className="text-[10px] text-slate-600 font-mono w-4">{i + 1}</span>
                    <code className="text-xs text-amber-300 font-mono font-semibold min-w-0 flex-1">{tc.tool_name}</code>
                    <StatusBadge status={tc.status} />
                    <span className="text-[10px] text-slate-600 font-mono">
                      {tc.latency_ms !== undefined ? `${tc.latency_ms.toFixed(0)}ms` : '—'}
                    </span>
                    {tc.call_id && (
                      <span className="text-[9px] text-slate-700 font-mono hidden lg:block">{tc.call_id}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Fact Bus Panel ────────────────────────────────────────────── */}
      {activePanel === 'factbus' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-3">
            <Radio className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Immutable Fact Bus — Event Stream</span>
            <div className="ml-auto flex items-center gap-2">
              <input
                type="text"
                value={selectedFactBusSession}
                onChange={(e) => setSelectedFactBusSession(e.target.value)}
                placeholder="Session ID"
                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[10px] text-slate-400 font-mono focus:outline-none focus:border-amber-500 w-48"
              />
              <button
                onClick={() => loadFactBusEvents(selectedFactBusSession)}
                disabled={factBusLoading}
                className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${factBusLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="max-h-[500px] overflow-y-auto">
            {factBusEvents.length === 0 ? (
              <div className="p-8 text-center">
                <Radio className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 text-sm font-medium">No events yet</p>
                <p className="text-slate-600 text-xs mt-1">
                  {selectedFactBusSession ? 'Start a negotiation to publish events.' : 'Enter a session ID to load events.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/50">
                {factBusEvents.map((evt) => (
                  <div key={evt.event_id} className="px-4 py-3 hover:bg-slate-800/20 transition-colors">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[10px] font-bold text-amber-400 font-mono">{evt.event_type}</span>
                      <span className="text-[10px] text-slate-600">·</span>
                      <span className="text-[10px] text-slate-500">{evt.actor_type}</span>
                      <span className="ml-auto text-[10px] text-slate-600 font-mono">{evt.timestamp}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-mono">{evt.source}</span>
                      <ChevronRight className="w-3 h-3 text-slate-700" />
                      <span className="text-[10px] text-slate-400 font-mono truncate">
                        {JSON.stringify(evt.payload).slice(0, 80)}…
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="px-4 py-2 border-t border-slate-800 flex items-center gap-2">
            <Database className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] text-slate-600">
              {factBusEvents.length} events · Append-only · MongoDB Atlas immutable store
            </span>
          </div>
        </div>
      )}

      {/* ── Tool Registry Panel ────────────────────────────────────────── */}
      {activePanel === 'tools' && (
        <div className="space-y-3">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Registered AI Tools — 6-Step Execution Pipeline
              </span>
              <span className="ml-auto px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {PANCHAYAT_TOOL_DECLARATIONS.length} TOOLS
              </span>
            </div>

            {/* Pipeline reminder */}
            <div className="px-4 py-3 bg-slate-950/40 border-b border-slate-800">
              <div className="flex items-center gap-2 text-[10px] text-slate-500 overflow-x-auto">
                {['1. Validate Args', '2. Check Auth', '3. Execute Service', '4. Validate Response', '5. Audit Event', '6. Return Result'].map((step, i) => (
                  <React.Fragment key={step}>
                    <span className="text-slate-400 font-semibold whitespace-nowrap">{step}</span>
                    {i < 5 && <ArrowRight className="w-3 h-3 text-slate-700 flex-shrink-0" />}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="divide-y divide-slate-800/50">
              {PANCHAYAT_TOOL_DECLARATIONS.map((tool, i) => {
                const reqParams = tool.parameters.required ?? [];
                const allParams = Object.keys(tool.parameters.properties ?? {});
                return (
                  <div key={tool.name} className="px-4 py-3 hover:bg-slate-800/20 transition-colors">
                    <div className="flex items-start gap-3">
                      <span className="text-[10px] text-slate-600 font-mono w-4 mt-0.5">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <code className="text-sm text-emerald-300 font-mono font-bold">{tool.name}</code>
                          <div className="flex gap-1 flex-wrap">
                            {reqParams.map((p) => (
                              <span key={p} className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                                {p}*
                              </span>
                            ))}
                            {allParams.filter((p) => !reqParams.includes(p)).map((p) => (
                              <span key={p} className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-500 border border-slate-700 font-mono">
                                {p}
                              </span>
                            ))}
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">{tool.description}</p>
                      </div>
                      <StatusBadge status="SUCCESS" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── System Health Panel ────────────────────────────────────────── */}
      {activePanel === 'health' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {health && Object.entries(health.components).map(([name, comp]) => (
              <div key={name} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  {name === 'database' ? <Database className="w-4 h-4 text-amber-400" /> :
                   name === 'ai_engine' ? <Cpu className="w-4 h-4 text-indigo-400" /> :
                   <Server className="w-4 h-4 text-emerald-400" />}
                  <span className="text-xs font-bold text-slate-300 capitalize">{name.replace('_', ' ')}</span>
                  <div className="ml-auto">
                    <StatusBadge status={(comp as {status: string}).status} />
                  </div>
                </div>
                <div className="space-y-1">
                  {Object.entries(comp as Record<string, unknown>).filter(([k]) => k !== 'status').map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-600 capitalize">{k.replace(/_/g, ' ')}</span>
                      <span className="text-slate-400 font-mono">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {health && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">System Info</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-slate-600 text-[10px] uppercase tracking-widest">Service</p>
                  <p className="text-slate-300 font-mono">{health.service}</p>
                </div>
                <div>
                  <p className="text-slate-600 text-[10px] uppercase tracking-widest">Last Checked</p>
                  <p className="text-slate-300 font-mono">{health.timestamp}</p>
                </div>
                <div>
                  <p className="text-slate-600 text-[10px] uppercase tracking-widest">Overall Status</p>
                  <StatusBadge status={health.status} />
                </div>
              </div>
            </div>
          )}

          {/* Architecture Safety Notice */}
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-emerald-300 mb-1">AI Safety Architecture Active</p>
                <ul className="space-y-1 text-xs text-emerald-400/70">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" /> Model NEVER directly mutates the database</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" /> Every tool call validated → authorized → audited</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" /> Business Rules Engine intercepts all AI price proposals</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" /> Pydantic schema validation rejects malformed model output</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" /> Fact Bus is append-only — no rewriting history</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Error state if offline */}
          {health?.status === 'OFFLINE' && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-300 mb-1">Backend Offline</p>
                <p className="text-xs text-red-400/70">
                  The FastAPI backend at <code className="font-mono">localhost:8000</code> is unreachable.
                  The AI Agent will operate in simulation mode. Run: <code className="font-mono text-amber-400">uvicorn app.main:app --port 8000</code>
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
