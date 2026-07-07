import { useCallback, useEffect, useRef, useState } from 'react';
import type { DifficultyId, GameState, MapNodeId, RoleId } from './game/types/gameTypes';
import { createInitialState } from './game/data/initialState';
import { randomSeed } from './game/engine/rng';
import {
  advanceTurn,
  resolvePendingEvent,
  selectMapNode,
  setActionTarget,
  togglePendingAction,
} from './game/engine/turnEngine';
import { clearSave, hasSave, loadGame, saveGame, savedAt } from './game/engine/saveEngine';
import { CampaignSetup } from './ui/CampaignSetup';
import { GameShell } from './ui/GameShell';
import { EndingScreen } from './ui/EndingScreen';

export default function App() {
  const [state, setState] = useState<GameState | null>(null);
  const [saveExists, setSaveExists] = useState<boolean>(() => hasSave());
  const [saveFlash, setSaveFlash] = useState(false);
  const flashTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
    };
  }, []);

  const flashSaved = useCallback(() => {
    setSaveFlash(true);
    if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setSaveFlash(false), 1500);
  }, []);

  const handleStart = useCallback((roleId: RoleId, difficultyId: DifficultyId) => {
    const fresh = createInitialState(roleId, randomSeed(), difficultyId);
    setState(fresh);
    saveGame(fresh);
    setSaveExists(true);
  }, []);

  const handleLoad = useCallback(() => {
    const loaded = loadGame();
    if (loaded) setState(loaded);
    else setSaveExists(false); // corrupt/incompatible save — fall back gracefully
  }, []);

  const handleToggleAction = useCallback((actionId: string) => {
    setState((prev) => {
      if (!prev) return prev;
      const next = togglePendingAction(prev, actionId);
      saveGame(next); // selection survives a reload
      return next;
    });
  }, []);

  const handleSetTarget = useCallback((actionId: string, nodeId: MapNodeId) => {
    setState((prev) => {
      if (!prev) return prev;
      const next = setActionTarget(prev, actionId, nodeId);
      saveGame(next); // targets survive a reload too
      return next;
    });
  }, []);

  const handleSelectNode = useCallback((nodeId: MapNodeId | null) => {
    setState((prev) => {
      if (!prev) return prev;
      const next = selectMapNode(prev, nodeId);
      saveGame(next);
      return next;
    });
  }, []);

  const handleAdvance = useCallback(() => {
    setState((prev) => {
      if (!prev || prev.pendingActions.length === 0) return prev;
      const next = advanceTurn(prev, prev.pendingActions);
      saveGame(next); // auto-save every turn
      return next;
    });
  }, []);

  const handleResolveEvent = useCallback((eventId: string, choiceId: string) => {
    setState((prev) => {
      if (!prev) return prev;
      const next = resolvePendingEvent(prev, eventId, choiceId);
      saveGame(next);
      return next;
    });
  }, []);

  const handleSave = useCallback(() => {
    setState((prev) => {
      if (prev) {
        saveGame(prev);
        setSaveExists(true);
      }
      return prev;
    });
    flashSaved();
  }, [flashSaved]);

  const handleAbandon = useCallback(() => {
    if (!window.confirm('Abandon this campaign? The current save will be deleted.')) return;
    clearSave();
    setSaveExists(false);
    setState(null);
  }, []);

  const handleRestart = useCallback(() => {
    clearSave();
    setSaveExists(false);
    setState(null);
  }, []);

  if (!state) {
    return (
      <CampaignSetup
        saveExists={saveExists}
        savedAtLabel={saveExists ? formatSavedAt(savedAt()) : null}
        onStart={handleStart}
        onLoad={handleLoad}
      />
    );
  }

  if (state.status === 'ended') {
    return <EndingScreen state={state} onRestart={handleRestart} />;
  }

  return (
    <GameShell
      state={state}
      onToggleAction={handleToggleAction}
      onSetTarget={handleSetTarget}
      onSelectNode={handleSelectNode}
      onAdvance={handleAdvance}
      onResolveEvent={handleResolveEvent}
      onSave={handleSave}
      onAbandon={handleAbandon}
      saveFlash={saveFlash}
    />
  );
}

function formatSavedAt(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return null;
  }
}
