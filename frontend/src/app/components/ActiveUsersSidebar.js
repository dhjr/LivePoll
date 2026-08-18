"use client";
import React from "react";

const ActiveUsersSidebar = ({ users = [], currentUserId, currentUser }) => {
  const meUsername = currentUser?.username;
  const list = Array.isArray(users) ? users : [];

  const maxVisible = 6;
  const visibleUsers = list.slice(0, maxVisible);
  const remainingCount = list.length - maxVisible;

  return (
    <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800/80 backdrop-blur-md px-3 py-1 rounded-full shadow-lg">
      <div className="flex items-center gap-1.5 shrink-0 pr-2 border-r border-slate-800">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="text-xs font-bold text-slate-300">Active ({list.length})</span>
      </div>

      <div className="flex items-center -space-x-2 overflow-hidden">
        {visibleUsers.map((u, idx) => {
          const isMe = u.userId === currentUserId || u.username === meUsername;
          return (
            <div
              key={u.userId || idx}
              title={`${u.username}${isMe ? " (You)" : ""}`}
              className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold uppercase ring-2 ring-slate-950 shadow-md transition-transform hover:scale-110 hover:z-20 ${
                isMe
                  ? "bg-gradient-to-br from-indigo-500 to-blue-600 text-white"
                  : "bg-slate-800 text-slate-200 border border-slate-700"
              }`}
            >
              {u.username ? u.username.charAt(0) : "?"}
            </div>
          );
        })}

        {remainingCount > 0 && (
          <div
            className="h-7 px-2 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center ring-2 ring-slate-950 shadow-md"
            title={`${remainingCount} more active user${remainingCount === 1 ? "" : "s"}`}
          >
            +{remainingCount}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveUsersSidebar;
