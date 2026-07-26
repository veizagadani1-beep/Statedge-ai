import React from 'react';
import { MatchStats, XGTimelinePoint, PossessionMomentumPoint, CardDetail } from '../types';
import { Activity, ShieldAlert, Flag, Target, TrendingUp, AlertTriangle } from 'lucide-react';

interface XGTimelineChartProps {
  timeline?: XGTimelinePoint[];
  homeTeamName: string;
  awayTeamName: string;
  homeXg: number;
  awayXg: number;
}

export const XGTimelineChart: React.FC<XGTimelineChartProps> = ({
  timeline = [],
  homeTeamName,
  awayTeamName,
  homeXg,
  awayXg,
}) => {
  if (!timeline || timeline.length === 0) return null;

  const maxXG = Math.max(homeXg, awayXg, 2.5);

  return (
    <div className="bg-slate-900/90 border border-cyan-500/20 rounded-2xl p-5 backdrop-blur-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Cumulative Expected Goals (xG)</h3>
            <p className="text-xs text-slate-400">Match timeline shot quality step-curve</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
            {homeTeamName} ({homeXg.toFixed(2)})
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
            {awayTeamName} ({awayXg.toFixed(2)})
          </div>
        </div>
      </div>

      {/* Timeline Step Graph */}
      <div className="relative h-44 w-full bg-slate-950/80 rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
        {/* Y Axis Grid Lines */}
        <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none opacity-20">
          <div className="border-b border-slate-500 w-full flex justify-end text-[9px] text-slate-400">
            {maxXG.toFixed(1)} xG
          </div>
          <div className="border-b border-slate-500 w-full flex justify-end text-[9px] text-slate-400">
            {(maxXG / 2).toFixed(1)} xG
          </div>
          <div className="border-b border-slate-500 w-full" />
        </div>

        {/* SVG Step Lines */}
        <svg className="w-full h-full overflow-visible z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Home xG Step Path */}
          <path
            d={timeline.reduce((acc, pt, index) => {
              const x = (pt.minute / 90) * 100;
              const y = 100 - (pt.homeXg / maxXG) * 100;
              if (index === 0) return `M 0 100 L ${x} ${y}`;
              const prevPt = timeline[index - 1];
              const prevY = 100 - (prevPt.homeXg / maxXG) * 100;
              return `${acc} L ${x} ${prevY} L ${x} ${y}`;
            }, '')}
            fill="none"
            stroke="#00F0FF"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Away xG Step Path */}
          <path
            d={timeline.reduce((acc, pt, index) => {
              const x = (pt.minute / 90) * 100;
              const y = 100 - (pt.awayXg / maxXG) * 100;
              if (index === 0) return `M 0 100 L ${x} ${y}`;
              const prevPt = timeline[index - 1];
              const prevY = 100 - (prevPt.awayXg / maxXG) * 100;
              return `${acc} L ${x} ${prevY} L ${x} ${y}`;
            }, '')}
            fill="none"
            stroke="#10B981"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Step points */}
          {timeline.map((pt, i) => {
            const x = (pt.minute / 90) * 100;
            const homeY = 100 - (pt.homeXg / maxXG) * 100;
            const awayY = 100 - (pt.awayXg / maxXG) * 100;
            return (
              <g key={i}>
                {pt.homeXg > 0 && <circle cx={x} cy={homeY} r="2" fill="#00F0FF" />}
                {pt.awayXg > 0 && <circle cx={x} cy={awayY} r="2" fill="#10B981" />}
              </g>
            );
          })}
        </svg>

        {/* X Axis Minute Markers */}
        <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-2">
          <span>0'</span>
          <span>15'</span>
          <span>30'</span>
          <span>HT (45')</span>
          <span>60'</span>
          <span>75'</span>
          <span>90'</span>
        </div>
      </div>
    </div>
  );
};

interface PossessionMomentumChartProps {
  timeline?: PossessionMomentumPoint[];
  homeTeamName: string;
  awayTeamName: string;
}

export const PossessionMomentumChart: React.FC<PossessionMomentumChartProps> = ({
  timeline = [],
  homeTeamName,
  awayTeamName,
}) => {
  if (!timeline || timeline.length === 0) return null;

  return (
    <div className="bg-slate-900/90 border border-cyan-500/20 rounded-2xl p-5 backdrop-blur-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Match Momentum & Pressure</h3>
            <p className="text-xs text-slate-400">Territorial dominant attack intensity (5-min intervals)</p>
          </div>
        </div>
      </div>

      {/* Momentum Bar Graph */}
      <div className="h-32 w-full bg-slate-950/80 rounded-xl p-3 border border-slate-800 flex items-center justify-between gap-2 relative">
        {/* Zero baseline line */}
        <div className="absolute inset-x-0 top-1/2 border-b border-slate-700/60 pointer-events-none" />

        {timeline.map((pt, i) => {
          const isHomeDominant = pt.homeMomentum >= 0;
          const heightPct = Math.min(Math.abs(pt.homeMomentum), 90);

          return (
            <div key={i} className="flex-1 flex flex-col items-center h-full justify-center relative group">
              {/* Tooltip */}
              <div className="absolute -top-9 hidden group-hover:flex flex-col items-center bg-slate-950 border border-slate-700 text-[10px] px-2 py-1 rounded shadow-xl z-20 whitespace-nowrap text-slate-200">
                <span>Minute {pt.minute}'</span>
                <span className="font-semibold text-cyan-400">{pt.homePossession}% vs {pt.awayPossession}%</span>
              </div>

              {/* Top Bar (Home) */}
              <div className="w-full flex-1 flex items-end justify-center">
                {isHomeDominant && (
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full max-w-[14px] bg-gradient-to-t from-cyan-500/50 to-cyan-400 rounded-t-sm shadow-sm shadow-cyan-500/30 transition-all"
                  />
                )}
              </div>

              {/* Bottom Bar (Away) */}
              <div className="w-full flex-1 flex items-start justify-center">
                {!isHomeDominant && (
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full max-w-[14px] bg-gradient-to-b from-emerald-500/50 to-emerald-400 rounded-b-sm shadow-sm shadow-emerald-500/30 transition-all"
                  />
                )}
              </div>

              <span className="text-[9px] text-slate-500 font-mono mt-1">{pt.minute}'</span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span className="text-cyan-400 font-medium">&#x25B2; {homeTeamName} Dominance</span>
        <span className="text-emerald-400 font-medium">&#x25BC; {awayTeamName} Dominance</span>
      </div>
    </div>
  );
};

interface FormTenGuideProps {
  form: ('W' | 'D' | 'L')[];
  title?: string;
}

export const FormTenGuide: React.FC<FormTenGuideProps> = ({ form, title = 'Last 10 Matches Form' }) => {
  const wins = form.filter((f) => f === 'W').length;
  const draws = form.filter((f) => f === 'D').length;
  const losses = form.filter((f) => f === 'L').length;
  const points = wins * 3 + draws;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-200 flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          {title}
        </span>
        <span className="text-slate-400 font-mono">
          {points}/30 pts <span className="text-cyan-400 font-bold">({wins}W {draws}D {losses}L)</span>
        </span>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {form.map((res, i) => {
          let bgClass = 'bg-slate-800 text-slate-400 border-slate-700';
          if (res === 'W') bgClass = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold shadow-sm shadow-emerald-500/20';
          if (res === 'D') bgClass = 'bg-amber-500/20 text-amber-400 border-amber-500/40 font-bold';
          if (res === 'L') bgClass = 'bg-red-500/20 text-red-400 border-red-500/40 font-bold';

          return (
            <div
              key={i}
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs border flex-shrink-0 transition-transform hover:scale-110 ${bgClass}`}
            >
              {res}
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface CornersAndCardsProps {
  stats: MatchStats;
  homeTeamName: string;
  awayTeamName: string;
}

export const CornersAndCardsBreakdown: React.FC<CornersAndCardsProps> = ({
  stats,
  homeTeamName,
  awayTeamName,
}) => {
  const homeCorners = stats.corners[0];
  const awayCorners = stats.corners[1];
  const totalCorners = homeCorners + awayCorners || 1;

  const homeYellows = stats.yellowCards[0];
  const awayYellows = stats.yellowCards[1];
  const homeReds = stats.redCards[0];
  const awayReds = stats.redCards[1];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Corner Kicks Analytics */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-bold text-slate-200">Corner Kicks Analysis</h4>
          </div>
          <span className="text-xs text-slate-400 font-mono">Total: {homeCorners + awayCorners}</span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-cyan-400">{homeTeamName}: {homeCorners}</span>
            <span className="text-emerald-400">{awayTeamName}: {awayCorners}</span>
          </div>
          <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
            <div
              style={{ width: `${(homeCorners / totalCorners) * 100}%` }}
              className="bg-cyan-500 h-full"
            />
            <div
              style={{ width: `${(awayCorners / totalCorners) * 100}%` }}
              className="bg-emerald-500 h-full"
            />
          </div>
        </div>

        {/* Half Breakdown */}
        {stats.cornersFirstHalf && stats.cornersSecondHalf && (
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
              <span className="text-slate-400 block text-[10px]">1st Half Corners</span>
              <span className="font-mono font-bold text-slate-200">
                {stats.cornersFirstHalf[0]} - {stats.cornersFirstHalf[1]}
              </span>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
              <span className="text-slate-400 block text-[10px]">2nd Half Corners</span>
              <span className="font-mono font-bold text-slate-200">
                {stats.cornersSecondHalf[0]} - {stats.cornersSecondHalf[1]}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Cards & Discipline Analytics */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <h4 className="text-sm font-bold text-slate-200">Cards & Discipline</h4>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Fouls: {stats.fouls[0]} - {stats.fouls[1]}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300 font-medium">{homeTeamName}</span>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                {homeYellows} Y
              </span>
              {homeReds > 0 && (
                <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-mono font-bold border border-red-500/30">
                  {homeReds} R
                </span>
              )}
            </div>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300 font-medium">{awayTeamName}</span>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                {awayYellows} Y
              </span>
              {awayReds > 0 && (
                <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-mono font-bold border border-red-500/30">
                  {awayReds} R
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Caution log */}
        {stats.cardDetails && stats.cardDetails.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Caution Log</span>
            <div className="max-h-24 overflow-y-auto space-y-1 text-[11px] pr-1">
              {stats.cardDetails.map((card, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-slate-950/40 px-2 py-1 rounded border border-slate-800/60"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-3 rounded-sm bg-amber-400 flex-shrink-0" />
                    <span className="text-slate-200 font-medium">{card.player}</span>
                  </div>
                  <span className="text-slate-500 font-mono">{card.minute}'</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
