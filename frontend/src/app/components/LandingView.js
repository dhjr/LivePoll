"use client";
import React, { useState } from "react";

const LandingView = ({ onCreate, onJoinPoll, error, user, onLogout }) => {
  const [joinId, setJoinId] = useState("");

  return (
    <div className="w-full max-w-md transition-all duration-300 animate-fade-in-up px-4">
      <header className="text-center mb-8 md:mb-10">
        <h1 className="text-4xl md:text-6xl font-black mb-3 text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-pink-300 drop-shadow-sm tracking-tight">
          LIVE POLL
        </h1>
        <div className="flex flex-col items-center gap-2">
          <p className="text-purple-200 uppercase tracking-[0.2em] text-[10px] md:text-xs font-semibold opacity-80">
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

      <div className={`grid grid-cols-1 gap-6 md:gap-8 items-start`}>
        {/* Main Action Section (Center/Right) */}
        <div className={`w-full max-w-md mx-auto space-y-6`}>
          {/* Create Section */}
          <div className="bg-slate-900/80 backdrop-blur-2xl border border-purple-500/20 p-6 md:p-8 rounded-4xl hover:border-purple-500/40 transition-all shadow-xl shadow-black/20 group">
            <button
              onClick={onCreate}
              className="w-full py-4 rounded-2xl font-bold bg-linear-to-r from-purple-600 to-pink-600 shadow-lg shadow-purple-900/30 group-hover:shadow-purple-900/50 hover:scale-[1.02] active:scale-[0.98] transition-all text-white text-lg flex items-center justify-center gap-2"
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
            <p className="mt-4 text-slate-400 text-xs font-medium text-center">
              Start a new session as host
            </p>
          </div>

          <div className="relative flex items-center justify-center py-2">
            <div className="h-px bg-slate-800 w-full absolute"></div>
            <span className="bg-slate-950 px-4 text-slate-500 text-xs z-10 font-bold uppercase tracking-widest">
              OR
            </span>
          </div>

          {/* Join Section */}
          <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-700/50 p-6 md:p-8 rounded-4xl shadow-lg shadow-black/20">
            {error && (
              <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center justify-center gap-2 animate-fade-in">
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

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-slate-500 text-lg font-mono">#</span>
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
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-4 text-white text-center font-mono tracking-[0.2em] text-lg focus:outline-none focus:border-purple-500 focus:bg-slate-800 transition-colors uppercase placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-600"
                  maxLength={6}
                />
              </div>
              <button
                onClick={() => onJoinPoll(joinId)}
                disabled={joinId.length < 6}
                className={`w-full sm:w-auto px-8 py-4 sm:py-0 rounded-xl font-bold transition-all flex items-center justify-center ${
                  joinId.length >= 6
                    ? "bg-slate-200 text-slate-900 hover:bg-white hover:scale-105 active:scale-95"
                    : "bg-slate-800 text-slate-600 cursor-not-allowed"
                }`}
              >
                JOIN
              </button>
            </div>
            <p className="mt-4 text-slate-500 text-xs text-center">
              Enter the 6-character code
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingView;
