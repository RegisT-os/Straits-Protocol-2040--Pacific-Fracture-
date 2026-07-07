import { useState } from 'react';
import type { DifficultyId, RoleId } from '../game/types/gameTypes';
import { ROLES } from '../game/data/roles';
import { DIFFICULTIES } from '../game/data/difficulty';

interface Props {
  saveExists: boolean;
  savedAtLabel: string | null;
  onStart: (roleId: RoleId, difficultyId: DifficultyId) => void;
  onLoad: () => void;
}

export function CampaignSetup({ saveExists, savedAtLabel, onStart, onLoad }: Props) {
  const [selected, setSelected] = useState<RoleId | null>(null);
  const [difficulty, setDifficulty] = useState<DifficultyId>('adviser');

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <header className="mb-8 text-center">
          <p className="mb-2 font-mono text-xs tracking-[0.3em] text-cyan-500 uppercase">
            Turn-based crisis simulator · Fictional · 2040
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-100 sm:text-5xl">
            Straits Protocol <span className="text-cyan-400">2040</span>
          </h1>
          <h2 className="mt-1 text-xl font-semibold tracking-widest text-amber-500 uppercase">
            Pacific Fracture
          </h2>
        </header>

        <div className="mb-8 rounded-lg border border-slate-800 bg-slate-900/60 p-5 text-sm leading-relaxed text-slate-300">
          <p>
            Russia won in Ukraine and now runs a grey-zone franchise against Europe. The United
            States pivoted hard to APAC and stopped picking up Brussels&rsquo; calls. Taiwan and its
            allies are fighting a major Pacific war against a weakened, dangerous China. Hormuz is
            open; the Straits of Malacca are not safe. Cyberattacks are weather. Satellites are
            contested. ASEAN cannot decide which meeting room to use.
          </p>
          <p className="mt-3 text-slate-400">
            You advise Malaysia — a middle power trying to survive World War 3.5 without becoming
            anyone&rsquo;s client state. One turn is one week. The campaign runs 104 weeks. Choose
            who you are.
          </p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ROLES.map((role) => {
            const active = selected === role.id;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelected(role.id)}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  active
                    ? 'border-cyan-500 bg-cyan-950/40 ring-1 ring-cyan-500'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-600'
                }`}
              >
                <h3 className="text-base font-semibold text-slate-100">{role.name}</h3>
                <p className="mt-0.5 text-xs text-cyan-400">{role.theme}</p>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">{role.description}</p>
                <div className="mt-3 space-y-1 text-xs">
                  {role.strengths.map((s) => (
                    <p key={s} className="text-emerald-400">
                      + {s}
                    </p>
                  ))}
                  {role.weaknesses.map((w) => (
                    <p key={w} className="text-red-400">
                      − {w}
                    </p>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        <h3 className="mb-3 text-center text-sm font-semibold tracking-wide text-slate-300 uppercase">
          Difficulty
        </h3>
        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          {DIFFICULTIES.map((diff) => {
            const active = difficulty === diff.id;
            return (
              <button
                key={diff.id}
                type="button"
                onClick={() => setDifficulty(diff.id)}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  active
                    ? 'border-amber-500 bg-amber-950/30 ring-1 ring-amber-500'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-600'
                }`}
              >
                <h4 className="text-sm font-semibold text-slate-100">{diff.name}</h4>
                <p className="mt-0.5 text-xs text-amber-400/90">{diff.tagline}</p>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">{diff.description}</p>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            disabled={!selected}
            onClick={() => selected && onStart(selected, difficulty)}
            className="rounded-md bg-cyan-600 px-8 py-3 text-sm font-semibold tracking-wide text-white uppercase transition-colors hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
          >
            {selected ? 'Start Campaign' : 'Select a role to begin'}
          </button>
          {saveExists && (
            <button
              type="button"
              onClick={onLoad}
              className="rounded-md border border-slate-700 px-6 py-2 text-sm text-slate-300 transition-colors hover:border-cyan-500 hover:text-cyan-300"
            >
              Load saved campaign{savedAtLabel ? ` · ${savedAtLabel}` : ''}
            </button>
          )}
        </div>

        <p className="mt-10 text-center text-xs text-slate-600">
          A fictional scenario. No real predictions, no real cyber techniques, no real persons.
        </p>
      </div>
    </div>
  );
}
