import React from "react";
import { Insight } from "../types";
import { Sparkles, Activity, Link2, Compass, RotateCw } from "lucide-react";
import { motion } from "motion/react";

interface InsightsPanelProps {
  insights: Insight[];
  onGenerateInsights: () => Promise<void>;
  isGenerating: boolean;
}

export default function InsightsPanel({
  insights,
  onGenerateInsights,
  isGenerating,
}: InsightsPanelProps) {
  return (
    <div className="flex flex-col h-full text-slate-200">
      {/* Header and trigger */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
        <div>
          <h3 className="font-heading text-sm font-medium tracking-wide text-white uppercase flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Gemini Mind Oracle
          </h3>
          <p className="text-[9px] text-slate-500 font-mono mt-0.5 uppercase tracking-wider">
            Geometric Insight Platform
          </p>
        </div>
        <button
          onClick={onGenerateInsights}
          disabled={isGenerating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-mono tracking-wider bg-indigo-600/10 border border-indigo-500/20 hover:border-indigo-400 text-indigo-400 transition-all cursor-pointer disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <RotateCw size={11} className="animate-spin" />
              SYNTHESIZING...
            </>
          ) : (
            <>
              <Sparkles size={11} className="text-purple-300" />
              ANALYZE CORE
            </>
          )}
        </button>
      </div>

      {/* Cards Scroll list */}
      <div className="flex-1 overflow-y-auto mt-4 pr-1 flex flex-col gap-3.5">
        {insights.length > 0 ? (
          insights.map((ins, i) => {
            const isConnection = ins.type === "connection";
            const isFocus = ins.type === "focus";

            return (
              <motion.div
                key={ins.id || i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 rounded-xl glass-panel relative overflow-hidden group hover:border-white/20 transition-all"
              >
                {/* Background accent soft light vector */}
                <div
                  className={`absolute top-0 right-0 w-32 h-32 rounded-full filter blur-3xl pointer-events-none opacity-15 transition-all group-hover:scale-125 duration-700 ${
                    isConnection
                      ? "bg-indigo-400"
                      : isFocus
                      ? "bg-purple-400"
                      : "bg-indigo-600"
                  }`}
                />

                {/* Card classification Header */}
                <div className="flex items-center gap-2 mb-2 bg-white/5 border border-white/5 px-2 py-0.5 rounded-sm w-fit font-mono text-[9px] tracking-wider">
                  {isConnection ? (
                    <Link2 size={10} className="text-indigo-400" />
                  ) : isFocus ? (
                    <Activity size={10} className="text-purple-400" />
                  ) : (
                    <Compass size={10} className="text-slate-300" />
                  )}
                  <span
                    className={
                      isConnection
                        ? "text-indigo-400"
                        : isFocus
                        ? "text-purple-400"
                        : "text-slate-300"
                    }
                  >
                    {ins.type.toUpperCase()} MATCH
                  </span>
                </div>

                {/* Content */}
                <h4 className="font-heading text-xs uppercase font-medium tracking-wide text-white mb-2 leading-snug">
                  {ins.title}
                </h4>
                <p className="font-sans text-[11px] text-slate-300 leading-relaxed">
                  {ins.content}
                </p>
              </motion.div>
            );
          })
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500 gap-3 min-h-[220px]">
            <Sparkles size={24} className="text-indigo-500/20 animate-bounce" />
            <div>
              <div className="font-heading text-xs font-light text-slate-400 mb-1">
                Awaiting Galactic Coordinates
              </div>
              <p className="text-[10px] leading-relaxed max-w-xs font-sans text-slate-500">
                Click the 'Analyze Core' button above for the Gemini engine to process your thoughts and project global insights on your mind constellation.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer metadata system */}
      <div className="pt-3 border-t border-white/5 shrink-0 font-mono text-[9px] text-slate-600 text-center uppercase tracking-wide">
        STABILITY COEFF: 0.992 // CYCLE_COMPLETE: UTC
      </div>
    </div>
  );
}
