"use client";
import React, { useEffect } from "react";

const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-20 right-4 z-50 animate-fade-in-right">
      <div className="bg-slate-800/90 backdrop-blur-md border border-purple-500/30 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
        <div className="bg-purple-500/20 p-2 rounded-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-purple-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div>
          <p className="font-bold text-sm">New Participant</p>
          <p className="text-xs text-slate-300">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-2 text-slate-500 hover:text-white"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default Toast;
