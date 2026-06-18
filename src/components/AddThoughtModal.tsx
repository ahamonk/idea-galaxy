import React, { useState } from "react";
import { X, Sparkles, Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AddThoughtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string) => Promise<void>;
  isSubmitting: boolean;
}

const TEMPLATE_SUGGESTIONS = [
  "I want to learn classical guitar and read sheets this summer.",
  "Start a tech podcast exploring independent offline-first app engineering.",
  "Pre-book winter tickets to the Hokkaido snow festival to capture photography.",
  "Run a scenic seaside half-marathon and establish strong early health logs.",
  "Host a minimalist typography design sprint with high-contrast UI assets."
];

export default function AddThoughtModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: AddThoughtModalProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setError("Please describe your starting thought.");
      return;
    }
    setError("");
    try {
      await onSubmit(text);
      setText("");
      onClose();
    } catch (err) {
      setError("Analysis failed. Please check connection and retry.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Blur Background Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* Modal Card content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg glass-panel p-6 rounded-2xl overflow-hidden text-white flex flex-col"
          >
            {/* Corner Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-cosmic-gray hover:text-white transition-all cursor-pointer"
            >
              <X size={16} />
            </button>

            {isSubmitting ? (
              /* LOADER VIEW WHILE GEMINI CALCULATES PROJECTIONS */
              <div className="py-12 flex flex-col items-center justify-center text-center gap-6">
                <div className="relative">
                  {/* Outer Orbit loop */}
                  <div className="w-16 h-16 rounded-full border border-primary/20 border-t-primary animate-spin" />
                  {/* Inner secondary orbit loop */}
                  <div className="absolute inset-2 rounded-full border border-secondary/15 border-b-secondary animate-spin duration-3000" />
                  <Sparkles className="absolute inset-0 m-auto text-primary animate-pulse" size={18} />
                </div>
                <div className="flex flex-col gap-1.5 z-10">
                  <h3 className="font-heading font-light tracking-widest text-stellar-white uppercase text-xs">
                    Aligning Galactic Coordinates
                  </h3>
                  <div className="flex items-center justify-center gap-1.5 font-mono text-[9px] text-cosmic-gray">
                    <span className="w-1 h-1 bg-primary rounded-full animate-ping" />
                    GEMINI ENGINE IS ORGANIZING MIND SPHERES...
                  </div>
                </div>
              </div>
            ) : (
              /* NORMAL ENTRY INPUT FORM */
              <form onSubmit={handleFormSubmit} className="flex flex-col gap-5">
                {/* Modal Title */}
                <div>
                  <div className="flex items-center gap-1.5 text-[9px] font-mono text-primary tracking-widest uppercase">
                    <Sparkles size={11} className="text-secondary" />
                    Expand Universe
                  </div>
                  <h2 className="mt-1.5 font-heading text-lg font-light tracking-wide text-stellar-white uppercase">
                    PROJECT THOUGHT STAR
                  </h2>
                </div>

                {/* Input Text Area (Minimalist Underline) */}
                <div className="flex flex-col gap-1.5 mt-2">
                  <label className="font-mono text-[9px] text-cosmic-gray uppercase tracking-widest">
                    Describe your project, goal, journal or plan
                  </label>
                  <textarea
                    rows={3}
                    autoFocus
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="e.g. I want to build a startup or travel to Japan..."
                    className="w-full bg-transparent border-b border-white/10 focus:border-stellar-white outline-none py-2 text-xs font-sans font-light tracking-wide text-stellar-white transition-all focus:shadow-[0_4px_12px_-4px_rgba(156,212,255,0.06)] resize-none"
                  />
                  {error && (
                    <div className="text-red-400 font-mono text-[10px] uppercase mt-1">
                      {error}
                    </div>
                  )}
                </div>

                {/* Suggestion Star Clusters */}
                <div>
                  <div className="font-mono text-[9px] text-cosmic-gray uppercase tracking-widest mb-2">
                    Or Project with a Suggestion
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {TEMPLATE_SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => {
                          setText(suggestion);
                          if (error) setError("");
                        }}
                        className="px-2.5 py-1 text-left text-[9px] font-mono tracking-wide rounded-md bg-white/[0.02] border border-white/5 hover:border-primary/45 hover:text-primary text-cosmic-gray transition-all cursor-pointer leading-snug max-w-full truncate"
                      >
                        "{suggestion.length > 55 ? suggestion.substring(0, 52) + "..." : suggestion}"
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Submit button */}
                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg hover:bg-white/5 text-cosmic-gray hover:text-white font-mono text-[10px] tracking-wider transition-all cursor-pointer uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#9cd4ff]/10 border border-[#9cd4ff]/25 hover:border-primary text-primary hover:text-white hover:bg-primary/10 font-mono text-[10px] tracking-widest transition-all cursor-pointer uppercase"
                  >
                    <Plus size={12} />
                    LAUNCH STAR
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
