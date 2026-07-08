import { useState } from 'react';
import type { GameState, MilitaryAssetState } from '../game/types/gameTypes';
import { getEligibleOperations, operationSuccessChance } from '../game/engine/militaryEngine';
import { deltaChips } from './format';

interface Props {
  state: GameState;
  asset: MilitaryAssetState;
  onAssignOperation: (assetId: string, operationId: string) => void;
}

export function OperationAssignmentPanel({ state, asset, onAssignOperation }: Props) {
  const [selectedOperationId, setSelectedOperationId] = useState<string | null>(null);
  const eligible = getEligibleOperations(asset, state);

  if (asset.activeOperationId) {
    return (
      <p className="text-xs text-slate-400">
        <span className="text-cyan-400">{asset.name}</span> is committed to{' '}
        <span className="font-semibold text-slate-200">{asset.mission}</span> until ~week{' '}
        {asset.operationEndsWeek}. It can take new tasking after it reports back.
      </p>
    );
  }
  if (eligible.length === 0) {
    return (
      <p className="text-xs text-slate-400">
        No eligible operations right now — readiness or logistics are too low. The force recovers
        while it holds station.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="font-mono text-[10px] tracking-wider text-slate-500 uppercase">
        Eligible operations for {asset.name}
      </p>
      {eligible.map((op) => {
        const selected = selectedOperationId === op.id;
        const chance = operationSuccessChance(asset, op);
        const chips = deltaChips(op.successMetricEffects);
        return (
          <div
            key={op.id}
            className={`rounded-md border p-2.5 ${
              selected ? 'border-cyan-500 bg-cyan-950/30' : 'border-slate-800 bg-slate-900'
            }`}
          >
            <button
              type="button"
              onClick={() => setSelectedOperationId(selected ? null : op.id)}
              className="w-full text-left"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-semibold text-slate-100">{op.name}</span>
                <span className="font-mono text-[10px] text-slate-500">
                  {op.durationWeeks}wk · {Math.round(chance * 100)}% success
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{op.description}</p>
              <div className="mt-1.5 flex flex-wrap gap-1 font-mono text-[9px]">
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-amber-400">
                  RDY −{op.readinessCost}
                </span>
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-amber-400">
                  LOG −{op.logisticsCost}
                </span>
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-red-400">
                  EXP +{op.exposureChange}
                </span>
                {chips.map((chip) => (
                  <span
                    key={chip.key}
                    className={`rounded px-1.5 py-0.5 ${
                      chip.positive ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'
                    }`}
                  >
                    {chip.short} {chip.value > 0 ? '+' : ''}
                    {chip.value}
                  </span>
                ))}
                {op.campaignCounterTags && op.campaignCounterTags.length > 0 && (
                  <span className="rounded bg-indigo-950 px-1.5 py-0.5 text-indigo-300">
                    counters: {op.campaignCounterTags.join(', ')}
                  </span>
                )}
              </div>
              <p className="mt-1 font-mono text-[9px] text-orange-400/90 uppercase">
                ⚠ {op.riskLabel}
              </p>
            </button>
            {selected && (
              <button
                type="button"
                onClick={() => onAssignOperation(asset.id, op.id)}
                className="mt-2 w-full rounded-md bg-cyan-600 px-3 py-1.5 text-xs font-semibold tracking-wide text-white uppercase transition-colors hover:bg-cyan-500"
              >
                Assign {op.name}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
