import type { GameState, MapNodeId } from '../game/types/gameTypes';
import { BoardModeTabs } from './BoardModeTabs';
import type { BoardMode } from './boardModes';
import { StrategicMap } from './StrategicMap';
import { WarFrontsPanel } from './WarFrontsPanel';
import { ActiveCampaignsPanel } from './ActiveCampaignsPanel';
import { MilitaryOperationsPanel } from './MilitaryOperationsPanel';
import { IntelligencePanel } from './IntelligencePanel';

interface Props {
  state: GameState;
  mode: BoardMode;
  onChangeMode: (mode: BoardMode) => void;
  onSelectNode: (nodeId: MapNodeId | null) => void;
  selectedAssetId: string | null;
  onSelectAsset: (assetId: string | null) => void;
  onAssignOperation: (assetId: string, operationId: string) => void;
}

/**
 * The main theatre board: one large mode-switched surface instead of five
 * equal panels. Board modes render existing panels; no game rules live here.
 */
export function MainTheatreBoard({
  state,
  mode,
  onChangeMode,
  onSelectNode,
  selectedAssetId,
  onSelectAsset,
  onAssignOperation,
}: Props) {
  const activeCampaigns = state.activePressureCampaigns.filter((c) => c.status === 'active').length;
  const onMission = state.militaryAssets.filter((a) => a.status === 'on-mission').length;

  return (
    <section className="flex min-h-0 flex-col">
      <BoardModeTabs
        mode={mode}
        onChange={onChangeMode}
        badges={{ campaigns: activeCampaigns, military: onMission }}
      />
      <div className="flex min-h-0 flex-1 flex-col rounded-lg rounded-tl-none border border-slate-800 bg-slate-900/60 p-3">
        {mode === 'map' && (
          <div className="flex min-h-0 flex-1 flex-col [&>section]:flex-1">
            <StrategicMap state={state} onSelectNode={onSelectNode} />
          </div>
        )}
        {mode === 'fronts' && (
          <div className="flex min-h-0 flex-1 flex-col [&>section]:flex-1">
            <WarFrontsPanel state={state} />
          </div>
        )}
        {mode === 'military' && (
          <MilitaryOperationsPanel
            state={state}
            selectedAssetId={selectedAssetId}
            onSelectAsset={onSelectAsset}
            onAssignOperation={onAssignOperation}
          />
        )}
        {mode === 'campaigns' && (
          <div className="flex min-h-0 flex-1 flex-col [&>section]:flex-1">
            <ActiveCampaignsPanel state={state} />
          </div>
        )}
        {mode === 'intelligence' && <IntelligencePanel state={state} />}
      </div>
    </section>
  );
}
