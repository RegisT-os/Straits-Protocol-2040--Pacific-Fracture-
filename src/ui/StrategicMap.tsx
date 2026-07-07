import type { GameState, MapNodeId, MapNodeState, TheatreId } from '../game/types/gameTypes';
import { MAP_NODES, NODE_MAP, THEATRES } from '../game/data/mapNodes';
import { getMapWarnings, summarizeTheatres } from '../game/engine/mapEngine';

interface Props {
  state: GameState;
  onSelectNode: (nodeId: MapNodeId | null) => void;
}

const THEATRE_SHORT: Record<TheatreId, string> = {
  'malaysia-core': 'CORE',
  'malacca-strait': 'STRT',
  'south-china-sea': 'SCS',
  'cyber-financial': 'CYBF',
  orbital: 'ORB',
  'asean-region': 'ASEAN',
  external: 'EXT',
};

function riskColor(risk: number): string {
  if (risk < 40) return 'text-emerald-400';
  if (risk < 60) return 'text-amber-400';
  return 'text-red-400';
}

function riskBg(risk: number): string {
  if (risk < 40) return 'bg-emerald-500';
  if (risk < 60) return 'bg-amber-500';
  return 'bg-red-500';
}

function stabilityColor(stability: number): string {
  if (stability >= 55) return 'text-emerald-400';
  if (stability >= 35) return 'text-amber-400';
  return 'text-red-400';
}

function NodeTile({
  node,
  selected,
  onClick,
}: {
  node: MapNodeState;
  selected: boolean;
  onClick: () => void;
}) {
  const def = NODE_MAP[node.id];
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${def.name} — risk ${Math.round(node.riskLevel)}, stability ${Math.round(node.stability)}`}
      className={`rounded-md border px-2 py-1.5 text-left transition-colors ${
        selected
          ? 'border-cyan-500 bg-cyan-950/40 ring-1 ring-cyan-500'
          : 'border-slate-800 bg-slate-900 hover:border-slate-600'
      }`}
    >
      <div className="flex items-baseline justify-between gap-1">
        <span className="truncate text-[11px] font-semibold text-slate-200">{def.name}</span>
        <span className={`font-mono text-[11px] font-bold ${riskColor(node.riskLevel)}`}>
          {Math.round(node.riskLevel)}
        </span>
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full ${riskBg(node.riskLevel)}`}
          style={{ width: `${node.riskLevel}%` }}
        />
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span className="font-mono text-[9px] text-slate-500">
          STB <span className={stabilityColor(node.stability)}>{Math.round(node.stability)}</span>
        </span>
        {node.activeIncidents.length > 0 && (
          <span className="rounded bg-red-950 px-1 font-mono text-[9px] text-red-400">
            ⚠ {node.activeIncidents.length}
          </span>
        )}
      </div>
    </button>
  );
}

function NodeDetail({
  state,
  nodeId,
  onSelectNode,
}: {
  state: GameState;
  nodeId: MapNodeId;
  onSelectNode: (id: MapNodeId) => void;
}) {
  const def = NODE_MAP[nodeId];
  const node = state.map.nodes[nodeId];
  const values: [string, number][] = [
    ['Maritime', def.maritimeValue],
    ['Financial', def.financialValue],
    ['Orbital', def.orbitalValue],
    ['Energy', def.energyValue],
  ];
  return (
    <div className="border-t border-slate-800 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-bold text-slate-100">{def.name}</h3>
        <span className="font-mono text-[10px] text-slate-500 uppercase">{def.type}</span>
      </div>
      <p className="mt-0.5 text-[10px] text-slate-500">
        {THEATRES.find((t) => t.id === def.theatre)?.name} · {def.owner}
      </p>
      <div className="mt-2 grid grid-cols-3 gap-2 font-mono text-[11px]">
        <span>
          Risk <span className={riskColor(node.riskLevel)}>{Math.round(node.riskLevel)}</span>
        </span>
        <span>
          Stability{' '}
          <span className={stabilityColor(node.stability)}>{Math.round(node.stability)}</span>
        </span>
        <span>
          CybExp{' '}
          <span className={riskColor(node.cyberExposure)}>{Math.round(node.cyberExposure)}</span>
        </span>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-3 font-mono text-[10px] text-slate-400">
        {values
          .filter(([, v]) => v > 0)
          .map(([label, v]) => (
            <span key={label}>
              {label} {v}
            </span>
          ))}
      </div>
      {node.activeIncidents.length > 0 && (
        <div className="mt-2 space-y-1">
          {node.activeIncidents.map((inc) => (
            <div key={inc.id} className="rounded border border-red-900/60 bg-red-950/40 px-2 py-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[11px] font-semibold text-red-300">{inc.title}</span>
                <span className="font-mono text-[9px] text-red-400">SEV {inc.severity}</span>
              </div>
              <p className="text-[9px] text-slate-500">
                {inc.source} · since W{inc.startedWeek} · clears ~W{inc.expiresWeek}
              </p>
            </div>
          ))}
        </div>
      )}
      <div className="mt-2 flex flex-wrap gap-1">
        {def.tags.map((tag) => (
          <span key={tag} className="rounded border border-slate-700 px-1.5 py-0.5 font-mono text-[9px] text-slate-400">
            {tag}
          </span>
        ))}
      </div>
      <p className="mt-2 font-mono text-[9px] text-slate-600 uppercase">Connected</p>
      <div className="mt-1 flex flex-wrap gap-1">
        {def.connectedNodes.map((cid) => (
          <button
            key={cid}
            type="button"
            onClick={() => onSelectNode(cid)}
            className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-cyan-300 transition-colors hover:bg-slate-700"
          >
            {NODE_MAP[cid].name}
          </button>
        ))}
      </div>
    </div>
  );
}

export function StrategicMap({ state, onSelectNode }: Props) {
  const summaries = summarizeTheatres(state);
  const warnings = getMapWarnings(state);
  const selected = state.selectedNode;

  return (
    <section className="flex min-h-0 flex-col rounded-lg border border-slate-800 bg-slate-900/60">
      <header className="border-b border-slate-800 px-4 py-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold tracking-wide text-slate-200 uppercase">
            Strategic Map
          </h2>
          <div className="flex gap-1.5">
            {THEATRES.map((t) => {
              const s = summaries[t.id];
              return (
                <span
                  key={t.id}
                  title={`${t.name}: avg risk ${s.avgRisk}, avg stability ${s.avgStability}, ${s.incidentCount} incident(s)`}
                  className={`rounded px-1.5 py-0.5 font-mono text-[9px] ${riskColor(s.avgRisk)} bg-slate-800`}
                >
                  {THEATRE_SHORT[t.id]} {s.avgRisk}
                </span>
              );
            })}
          </div>
        </div>
        {warnings.length > 0 && (
          <p className="mt-1 text-[10px] text-red-400">⚠ {warnings.join(' · ')}</p>
        )}
      </header>
      <div className="feed-scroll min-h-0 flex-1 overflow-y-auto p-3">
        {THEATRES.map((theatre) => {
          const nodes = MAP_NODES.filter((n) => n.theatre === theatre.id);
          const summary = summaries[theatre.id];
          return (
            <div key={theatre.id} className="mb-3">
              <div className="mb-1.5 flex items-baseline justify-between">
                <h3
                  className="text-[11px] font-semibold tracking-wide text-slate-300 uppercase"
                  title={theatre.description}
                >
                  {theatre.name}
                </h3>
                <span className={`font-mono text-[10px] ${riskColor(summary.avgRisk)}`}>
                  risk {summary.avgRisk} · stab {summary.avgStability}
                  {summary.incidentCount > 0 && ` · ⚠${summary.incidentCount}`}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 xl:grid-cols-4">
                {nodes.map((def) => (
                  <NodeTile
                    key={def.id}
                    node={state.map.nodes[def.id]}
                    selected={selected === def.id}
                    onClick={() => onSelectNode(selected === def.id ? null : def.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {selected && <NodeDetail state={state} nodeId={selected} onSelectNode={onSelectNode} />}
    </section>
  );
}
