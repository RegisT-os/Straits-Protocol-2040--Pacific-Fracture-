import type { GameState } from '../game/types/gameTypes';
import { NODE_MAP } from '../game/data/mapNodes';
import { buildIntelligenceReport } from '../game/engine/intelligenceEngine';

interface Props {
  state: GameState;
}

function severityColor(severity: number): string {
  if (severity >= 75) return 'text-red-400';
  if (severity >= 60) return 'text-amber-400';
  return 'text-slate-300';
}

export function IntelligencePanel({ state }: Props) {
  const report = buildIntelligenceReport(state);

  return (
    <div className="feed-scroll min-h-0 flex-1 overflow-y-auto pr-1" data-testid="intelligence-panel">
      <div className="rounded-md border border-amber-900/60 bg-amber-950/20 p-3">
        <p className="font-mono text-[10px] tracking-wider text-amber-500 uppercase">
          Faction watch
        </p>
        <p className="mt-1 text-xs leading-relaxed text-slate-300">{report.factionWarning}</p>
      </div>

      <h3 className="mt-3 mb-1.5 font-mono text-[10px] tracking-wider text-slate-500 uppercase">
        Top risks this week
      </h3>
      <div className="space-y-2">
        {report.topRisks.length === 0 && (
          <p className="text-xs text-slate-500">
            Nothing critical on the board. Enjoy it — this is 2040.
          </p>
        )}
        {report.topRisks.map((risk, i) => (
          <div key={risk.id} className="rounded-md border border-slate-800 bg-slate-900 p-2.5">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[10px] text-slate-600">{i + 1}.</span>
              <span className={`text-xs font-semibold ${severityColor(risk.severity)}`}>
                {risk.label}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">{risk.detail}</p>
            <p className="mt-1 text-[11px] text-cyan-400/90">
              <span className="font-mono text-[9px] text-slate-600 uppercase">Counterplay · </span>
              {risk.counterplay}
            </p>
          </div>
        ))}
      </div>

      <h3 className="mt-3 mb-1.5 font-mono text-[10px] tracking-wider text-slate-500 uppercase">
        Situation markers
      </h3>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="rounded-md border border-slate-800 bg-slate-900 p-2.5">
          <p className="font-mono text-[9px] text-slate-600 uppercase">Hottest front</p>
          <p className="text-xs font-semibold text-slate-200">{report.hottestFront.name}</p>
          <p className="text-[10px] text-slate-500">
            intensity {Math.round(report.hottestFront.intensity)} · {report.hottestFront.status} ·
            escalation {report.hottestFront.escalationLevel}
          </p>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-900 p-2.5">
          <p className="font-mono text-[9px] text-slate-600 uppercase">Worst campaign</p>
          <p className="text-xs font-semibold text-slate-200">
            {report.worstCampaign?.title ?? 'None active'}
          </p>
          {report.worstCampaign && (
            <p className="text-[10px] text-slate-500">
              intensity {report.worstCampaign.intensity} · counters:{' '}
              {report.worstCampaign.counterActionTags.join(', ')}
            </p>
          )}
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-900 p-2.5">
          <p className="font-mono text-[9px] text-slate-600 uppercase">Most fragile node</p>
          <p className="text-xs font-semibold text-slate-200">
            {NODE_MAP[report.mostFragileNode.id].name}
          </p>
          <p className="text-[10px] text-slate-500">
            risk {Math.round(report.mostFragileNode.riskLevel)} · stability{' '}
            {Math.round(report.mostFragileNode.stability)}
          </p>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-900 p-2.5">
          <p className="font-mono text-[9px] text-slate-600 uppercase">Most exposed asset</p>
          <p className="text-xs font-semibold text-slate-200">
            {report.mostExposedAsset?.name ?? 'No forces raised'}
          </p>
          {report.mostExposedAsset && (
            <p className="text-[10px] text-slate-500">
              exposure {Math.round(report.mostExposedAsset.exposure)} ·{' '}
              {report.mostExposedAsset.status}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
