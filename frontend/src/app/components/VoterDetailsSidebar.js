"use client";
import React from "react";
import { X } from "lucide-react";

const VoterDetailsSidebar = ({ option, voters, onClose }) => {
  if (!option) return null;
  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      ></div>
      <div className="fixed z-50 bg-slate-900 border-l border-slate-700/50 p-6 transition-all duration-300 shadow-2xl flex flex-col right-0 top-0 bottom-0 w-80 md:w-96 translate-x-0 animate-fade-in-right rounded-l-3xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white pr-4 leading-tight">
            Voters for "{option}"
          </h3>
          <button
            onClick={onClose}
            className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {voters && voters.length > 0 ? (
            <div className="space-y-3">
              {voters.map((v, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/30"
                >
                  <div className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white uppercase shadow-sm">
                    {v.charAt(0)}
                  </div>
                  <span className="text-slate-200 font-medium text-sm">
                    {v}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500">
              <p>No votes yet for this option.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default VoterDetailsSidebar;
