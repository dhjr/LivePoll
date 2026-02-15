"use client";
import React from "react";

const ActiveUsersSidebar = ({ users, currentUser }) => {
  const others = users.filter((u) => u.username !== currentUser?.username);

  return (
    <div className="lg:fixed lg:z-40 lg:top-0 lg:bottom-0 lg:left-0 lg:w-72 lg:border-r border-slate-800/50 p-4 transition-all w-full lg:h-full lg:block flex flex-col bg-slate-900/40 backdrop-blur-2xl lg:bg-slate-900/80 mt-12 lg:mt-0 border-t lg:border-t-0 shadow-none lg:shadow-2xl lg:shadow-black/50 custom-scrollbar">
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .custom-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <h3 className="text-sm lg:text-lg font-bold text-white mb-3 lg:mb-6 flex items-center justify-between sticky top-0 bg-transparent py-2 z-10">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Active Users
        </span>
        <span className="text-xs font-bold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/50">
          {users.length}
        </span>
      </h3>

      <div className="flex flex-col h-full overflow-y-auto custom-scrollbar pb-20">
        {/* Current User (Row Layout) */}
        {currentUser && (
          <div className="mb-6">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 pl-1">
              You
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 bg-indigo-500/10 border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 flex items-center justify-center text-sm font-bold text-white uppercase shadow-lg ring-2 ring-black/20">
                  {currentUser.username.charAt(0)}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-900 text-[9px] font-bold px-1.5 rounded-full border border-slate-900 shadow-sm leading-tight">
                  ME
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold truncate text-white">
                  {currentUser.username}
                </span>
                <span className="text-[10px] text-slate-500 font-medium tracking-wide">
                  Host / You
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Other Users (Grid Layout) */}
        {others.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 pl-1">
              Others
            </div>
            <div className="grid grid-cols-3 gap-2">
              {others.map((u, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center p-2 rounded-xl border border-slate-700/30 bg-slate-800/40 hover:bg-slate-800/60 transition-all group"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white uppercase mb-1 ring-2 ring-slate-800 group-hover:ring-slate-700 transition-all">
                    {u.username.charAt(0)}
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 group-hover:text-slate-200 truncate w-full text-center">
                    {u.username}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveUsersSidebar;
