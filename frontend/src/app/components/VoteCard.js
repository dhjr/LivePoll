"use client";
import React from "react";

const VoteCard = ({
  option,
  votes,
  totalVotes,
  isSelected,
  onVote,
  voters,
}) => {
  const percentage = totalVotes ? (votes / totalVotes) * 100 : 0;

  return (
    <button
      onClick={onVote}
      className={`
      relative w-full rounded-2xl transition-all duration-300 overflow-hidden border-2 text-left group
      ${
        isSelected
          ? "bg-purple-900/40 border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.2)] scale-[1.02]"
          : "bg-slate-800/40 border-slate-700/50 hover:border-slate-600 hover:scale-[1.01]"
      }
    `}
    >
      {/* Background Progress Bar */}
      <div
        className={`absolute inset-0 bg-purple-500/10 transition-all duration-1000 ease-out origin-left`}
        style={{ width: `${percentage}%` }}
      ></div>

      <div className="relative z-10 p-4">
        {/* Header: Option */}
        <div className="flex justify-between items-start gap-4 mb-3">
          <span className="font-bold text-lg md:text-xl text-white leading-tight wrap-break-word flex-1">
            {option}
          </span>
          {isSelected && (
            <span className="shrink-0 text-[10px] font-bold bg-green-500/20 text-green-300 border border-green-500/30 px-2 py-1 rounded-full uppercase tracking-wider animate-fade-in">
              Selected
            </span>
          )}
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl font-black text-purple-300">
            {Math.round(percentage)}%
          </span>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-900/50 px-2 py-1 rounded-md border border-slate-700/50">
            {votes} Votes
          </span>
        </div>

        {/* Facepile (Visual Only) */}
        {voters.length > 0 && (
          <div className="flex -space-x-2 overflow-hidden pt-2 border-t border-white/5">
            {voters.slice(0, 5).map((v, idx) => (
              <div
                key={idx}
                className="h-6 w-6 rounded-full ring-2 ring-slate-900 bg-slate-700 flex items-center justify-center text-[8px] font-bold text-white"
                title={v}
              >
                {v.charAt(0)}
              </div>
            ))}
            {voters.length > 5 && (
              <div className="h-6 w-6 rounded-full ring-2 ring-slate-900 bg-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-400">
                +{voters.length - 5}
              </div>
            )}
          </div>
        )}
      </div>
    </button>
  );
};

export default VoteCard;
