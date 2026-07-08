import type { GameState } from '../game/types/gameTypes';
import { NODE_MAP } from '../game/data/mapNodes';
import { getPlayableFaction } from '../game/data/playableFactions';
import { MilitaryAssetCard } from './MilitaryAssetCard';
import { OperationAssignmentPanel } from './OperationAssignmentPanel';

interface Props {
  state: GameState;
  selectedAssetId: string | null;
  onSelectAsset: (assetId: string | null) => void;
  onAssignOperation: (assetId: string, operationId: string) => void;
}

export function MilitaryOperationsPanel({
  state,
  selectedAssetId,
  onSelectAsset,
  onAssignOperation,
}: Props) {
  const faction = getPlayableFaction(state.playableFactionId);
  const selectedAsset = state.militaryAssets.find((a) => a.id === selectedAssetId) ?? null;

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid="military-panel">
      <p className="mb-2 text-xs text-slate-500">
        {faction.shortName} force posture — select an asset to task it. Operations spend the
        asset&apos;s own readiness and logistics, never an action slot.
      </p>
      <div className="feed-scroll min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-1 gap-2 xl:grid-cols-3">
          {state.militaryAssets.map((asset) => (
            <MilitaryAssetCard
              key={asset.id}
              asset={asset}
              week={state.week}
              selected={selectedAssetId === asset.id}
              onSelect={() => onSelectAsset(selectedAssetId === asset.id ? null : asset.id)}
            />
          ))}
        </div>
        {selectedAsset && (
          <div className="mt-3 rounded-md border border-slate-800 bg-slate-900/70 p-3">
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-100">{selectedAsset.name}</h3>
              <span className="font-mono text-[10px] text-slate-500">
                stationed: {selectedAsset.assignedNodeIds.map((id) => NODE_MAP[id]?.name ?? id).join(' · ')}
              </span>
            </div>
            <p className="mb-3 text-[11px] leading-relaxed text-slate-400 italic">
              {selectedAsset.showcaseText}
            </p>
            <OperationAssignmentPanel
              state={state}
              asset={selectedAsset}
              onAssignOperation={onAssignOperation}
            />
          </div>
        )}
      </div>
    </div>
  );
}
