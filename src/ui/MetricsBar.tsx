import type { Metrics } from '../game/types/gameTypes';
import { METRIC_INFO } from '../game/data/initialState';
import { metricStatus, STATUS_BAR, STATUS_TEXT } from './format';

interface Props {
  metrics: Metrics;
}

export function MetricsBar({ metrics }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12">
      {METRIC_INFO.map((info) => {
        const value = metrics[info.key];
        const status = metricStatus(info.key, value);
        return (
          <div
            key={info.key}
            title={`${info.label}: ${info.description}`}
            className="rounded-md border border-slate-800 bg-slate-900/70 px-2 py-1.5"
          >
            <div className="flex items-baseline justify-between gap-1">
              <span className="font-mono text-[10px] tracking-wider text-slate-400">
                {info.short}
              </span>
              <span className={`font-mono text-sm font-semibold ${STATUS_TEXT[status]}`}>
                {Math.round(value)}
              </span>
            </div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full transition-all ${STATUS_BAR[status]}`}
                style={{ width: `${value}%` }}
              />
            </div>
            <p className="mt-0.5 truncate text-[9px] text-slate-500">{info.label}</p>
          </div>
        );
      })}
    </div>
  );
}
