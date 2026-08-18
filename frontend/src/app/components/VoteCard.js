"use client";
import React from "react";

const VoteCard = ({
  option,
  votes,
  count,
  totalVotes = 0,
  isSelected,
  onVote,
  voters = [],
}) => {
  const voteCount = count !== undefined ? count : (votes || 0);
  const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;

  return (
    <button
      onClick={onVote}
      className={`
      relative inline-flex items-center justify-between rounded-xl transition-all duration-200 overflow-hidden border text-left group py-2 px-3.5 gap-3 shrink-0 flex-grow max-w-full
      ${
        isSelected
          ? "bg-indigo-950/70 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.25)] scale-[1.01]"
          : "bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/70"
      }
    `}
    >
      {/* Background Progress Bar */}
      <div
        className="absolute inset-0 bg-indigo-500/15 transition-all duration-500 ease-out origin-left pointer-events-none"
        style={{ width: `${percentage}%` }}
      ></div>

      <div className="relative z-10 flex items-center justify-between gap-3 w-full">
        {/* Left: Option text & selected badge */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold text-xs sm:text-sm text-white truncate">
            {option}
          </span>
          {isSelected && (
            <span className="shrink-0 text-[8px] font-extrabold bg-green-500/20 text-green-300 border border-green-500/40 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
              ✓ Selected
            </span>
          )}
        </div>

        {/* Right: Voters Facepile & Vote Count */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {voters.length > 0 && (
            <div className="hidden sm:flex -space-x-1.5 overflow-hidden">
              {voters.slice(0, 3).map((v, idx) => (
                <div
                  key={idx}
                  className="h-4.5 w-4.5 rounded-full ring-1 ring-slate-900 bg-slate-700 flex items-center justify-center text-[7px] font-bold text-white uppercase"
                  title={v}
                >
                  {v.charAt(0)}
                </div>
              ))}
              {voters.length > 3 && (
                <div className="h-4.5 w-4.5 rounded-full ring-1 ring-slate-900 bg-slate-800 flex items-center justify-center text-[7px] font-bold text-slate-400">
                  +{voters.length - 3}
                </div>
              )}
            </div>
          )}

          <span className="text-xs font-black text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-500/20">
            {voteCount} {voteCount === 1 ? "Vote" : "Votes"}
          </span>
        </div>
      </div>
    </button>
  );
};

export default VoteCard;
