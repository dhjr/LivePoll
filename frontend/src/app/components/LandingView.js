"use client";
import React, { useState, useEffect } from "react";
import { getRecentPolls, clearRecentPolls } from "../../utils/recentPolls";

const LandingView = ({ onCreate, onJoinPoll, error, user, onLogout }) => {
  const [joinId, setJoinId] = useState("");
  const [recentPolls, setRecentPolls] = useState([]);

  useEffect(() => {
    setRecentPolls(getRecentPolls());
  }, []);

  const handleClearRecent = () => {
    clearRecentPolls();
    setRecentPolls([]);
  };

  return (
    <div className="w-full max-w-md transition-all duration-300 animate-fade-in-up px-4 py-6">
      <header className="text-center mb-6 md:mb-8">
        <h1 className="text-4xl md:text-5xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-300 drop-shadow-sm tracking-tight">
          LIVE POLL
        </h1>
        <div className="flex flex-col items-center gap-1.5">
          <p className="text-indigo-200 uppercase tracking-[0.2em] text-[10px] md:text-xs font-semibold opacity-80">
            Welcome,{" "}
            <span className="text-white font-bold">{user?.username}</span>
          </p>
          <button
            onClick={onLogout}
            className="text-xs text-slate-500 hover:text-slate-300 underline"
          >
            Switch Account
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-5 items-start">
        <div className="w-full max-w-md mx-auto space-y-5">
          {/* Create Section */}
          <div className="bg-slate-900/80 backdrop-blur-2xl border border-indigo-500/20 p-5 md:p-6 rounded-3xl hover:border-indigo-500/40 transition-all shadow-xl shadow-black/20 group">
            <button
              onClick={onCreate}
              className="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 shadow-lg shadow-indigo-900/30 group-hover:shadow-indigo-900/50 hover:scale-[1.01] active:scale-[0.99] transition-all text-white text-base flex items-center justify-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Create New Poll
            </button>
            <p className="mt-2.5 text-slate-400 text-xs font-medium text-center">
              Start a new real-time session
            </p>
          </div>

          <div className="relative flex items-center justify-center py-1">
            <div className="h-px bg-slate-800 w-full absolute"></div>
            <span className="bg-slate-950 px-3 text-slate-500 text-xs z-10 font-bold uppercase tracking-widest">
              OR
            </span>
          </div>

          {/* Join Section */}
          <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-700/50 p-5 md:p-6 rounded-3xl shadow-lg shadow-black/20">
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center justify-center gap-2 animate-fade-in">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <span className="text-slate-500 text-base font-mono">#</span>
                </div>
                <input
                  value={joinId}
                  onChange={(e) => setJoinId(e.target.value.toUpperCase())}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    joinId.length >= 6 &&
                    onJoinPoll(joinId)
                  }
                  placeholder="ENTER CODE"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-3 text-white text-center font-mono tracking-[0.2em] text-base focus:outline-none focus:border-indigo-500 focus:bg-slate-800 transition-colors uppercase placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-600"
                  maxLength={6}
                />
              </div>
              <button
                onClick={() => onJoinPoll(joinId)}
                disabled={joinId.length < 6}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center text-sm ${
                  joinId.length >= 6
                    ? "bg-slate-200 text-slate-900 hover:bg-white hover:scale-102 active:scale-98"
                    : "bg-slate-800 text-slate-600 cursor-not-allowed"
                }`}
              >
                JOIN
              </button>
            </div>
            <p className="mt-2 text-slate-500 text-xs text-center">
              Enter the 6-character poll code
            </p>
          </div>

          {/* Recent Polls Section */}
          {recentPolls.length > 0 && (
            <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-800/80 p-4 md:p-5 rounded-3xl shadow-lg shadow-black/20 animate-fade-in">
              <div className="flex items-center justify-between mb-2.5 px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Recently Visited Polls
                </span>
                <button
                  onClick={handleClearRecent}
                  className="text-[10px] text-slate-500 hover:text-slate-300 font-semibold"
                >
                  Clear History
                </button>
              </div>

              <div className="space-y-2 max-h-44 overflow-y-auto pr-0.5">
                {recentPolls.map((poll) => (
                  <button
                    key={poll.pollId}
                    onClick={() => onJoinPoll(poll.pollId)}
                    className="w-full bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-indigo-500/50 p-2.5 rounded-xl flex items-center justify-between text-left transition-all group"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 shrink-0">
                        #{poll.pollId}
                      </span>
                      <span className="text-xs font-semibold text-white truncate">
                        {poll.title}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 group-hover:text-indigo-300 shrink-0">
                      Rejoin →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LandingView;
