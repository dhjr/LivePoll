import React, { useState } from "react";

const CreatePollModal = ({ isOpen = true, onClose, onSubmit }) => {
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newOptions, setNewOptions] = useState(["", ""]);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleAddOption = () => setNewOptions([...newOptions, ""]);
  const handleOptionChange = (i, v) => {
    const copy = [...newOptions];
    copy[i] = v;
    setNewOptions(copy);
    if (error) setError(null);
  };
  const handleRemoveOption = (i) =>
    setNewOptions(newOptions.filter((_, idx) => idx !== i));

  const isFormValid =
    newTitle.trim() &&
    newDesc.trim() &&
    newOptions.filter((o) => o.trim()).length >= 2;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    // Validate duplicates
    const validOpts = newOptions.filter((o) => o.trim());
    const uniqueOpts = new Set(validOpts);
    if (uniqueOpts.size !== validOpts.length) {
      setError("Poll options must be unique");
      return;
    }

    onSubmit({ title: newTitle, description: newDesc, options: validOpts });

    // Reset form
    setNewTitle("");
    setNewDesc("");
    setNewOptions(["", ""]);
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-indigo-500/30 p-6 md:p-8 rounded-3xl w-full max-w-lg shadow-[0_0_50px_rgba(99,102,241,0.2)] overflow-y-auto max-h-[90vh]">
        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent mb-6">
          Create New Poll
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2 animate-fade-in">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-400 text-xs md:text-sm mb-1 uppercase tracking-wider">
              Title
            </label>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 text-sm md:text-base"
              placeholder="Poll Title"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-xs md:text-sm mb-1 uppercase tracking-wider">
              Description
            </label>
            <input
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 text-sm md:text-base"
              placeholder="Description"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-xs md:text-sm mb-2 uppercase tracking-wider">
              Options
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {newOptions.map((opt, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm md:text-base"
                    placeholder={`Option ${idx + 1}`}
                  />
                  {newOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="text-red-400 hover:text-red-300 px-2 text-lg"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddOption}
              className="mt-3 text-xs md:text-sm text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              + Add Option
            </button>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                onClose();
                setError(null);
              }}
              className="flex-1 px-6 py-3 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm md:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid}
              className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all text-sm md:text-base ${isFormValid ? "bg-gradient-to-r from-indigo-600 to-blue-600 shadow-lg" : "bg-slate-800 text-slate-500 cursor-not-allowed"}`}
            >
              Launch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default CreatePollModal;
