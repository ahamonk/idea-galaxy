import React, { useState } from "react";
import { Category, Thought } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, Tag, Compass, Trash2, Share2, Star, Link2, Key } from "lucide-react";

interface DetailPanelProps {
  categories: Category[];
  thoughts: Thought[];
  selectedCategoryId: string | null;
  selectedThoughtId: string | null;
  onSelectThought: (id: string | null) => void;
  onSelectCategory: (id: string) => void;
  onDeleteThought: (id: string) => Promise<void>;
  isGeminiActive: boolean;
}

export default function DetailPanel({
  categories,
  thoughts,
  selectedCategoryId,
  selectedThoughtId,
  onSelectThought,
  onSelectCategory,
  onDeleteThought,
  isGeminiActive,
}: DetailPanelProps) {
  const [isConfirmingTop, setIsConfirmingTop] = useState(false);
  const [isConfirmingBottom, setIsConfirmingBottom] = useState(false);

  // Reset confirming state when selected thought changes
  React.useEffect(() => {
    setIsConfirmingTop(false);
    setIsConfirmingBottom(false);
  }, [selectedThoughtId]);

  const selectedThought = thoughts.find((t) => t.id === selectedThoughtId);
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  // Find related thoughts objects
  const relatedThoughts = React.useMemo(() => {
    if (!selectedThought) return [];
    return thoughts.filter((t) => selectedThought.connections.includes(t.id));
  }, [selectedThought, thoughts]);

  const thoughtCount = React.useMemo(() => {
    if (!selectedCategory) return 0;
    return thoughts.filter((t) => t.categoryId === selectedCategory.id).length;
  }, [selectedCategory, thoughts]);

  return (
    <div className="absolute inset-0 overflow-y-auto p-6 text-white scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      <AnimatePresence mode="wait">
        {selectedThought ? (
          <motion.div
            key={`thought-detail-${selectedThought.id}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex flex-col gap-6"
          >
            {/* Thought Core Text */}
            <div>
              <div className="flex justify-between items-start gap-4">
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="font-mono text-[10px] tracking-widest text-[#ffb95f] uppercase bg-[#ffb95f]/15 border border-[#ffb95f]/30 px-2 py-0.5 rounded-sm">
                    THOUGHT NODE
                  </span>
                  {selectedThought.subcategory && (
                    <span className="font-mono text-[9px] tracking-wide text-indigo-300 uppercase bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded-sm font-semibold">
                      🌌 {selectedThought.subcategory}
                    </span>
                  )}
                </div>
                {isConfirmingTop ? (
                  <button
                    id="btn-delete-thought-top-confirm"
                    onClick={async (e) => {
                      e.stopPropagation();
                      onSelectThought(null);
                      await onDeleteThought(selectedThought.id);
                      setIsConfirmingTop(false);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-600 hover:bg-red-500 border border-red-400 text-white font-mono text-[9px] tracking-wider transition-all cursor-pointer uppercase shrink-0 animate-pulse"
                  >
                    <Trash2 size={10} />
                    Confirm?
                  </button>
                ) : (
                  <button
                    id="btn-delete-thought-top"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsConfirmingTop(true);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-950/50 hover:bg-red-500/20 border border-red-500/40 text-red-300 hover:text-red-100 font-mono text-[9px] tracking-wider transition-all cursor-pointer uppercase shrink-0"
                  >
                    <Trash2 size={10} />
                    Dissolve
                  </button>
                )}
              </div>
              <h3 className="mt-3 font-heading text-lg font-light leading-relaxed text-stellar-white tracking-wide">
                "{selectedThought.text}"
              </h3>
            </div>

            {/* AI Summary Block */}
            <div className="p-4 rounded-xl bg-indigo-950/25 border border-indigo-500/20 relative overflow-hidden shadow-[0_0_15px_rgba(99,102,241,0.05)]">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full filter blur-xl pointer-events-none" />
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-indigo-400 mb-2">
                <Star size={10} className="animate-spin duration-3000 text-indigo-300" />
                AI-GENERATED SUMMARY
              </div>
              <p className="font-sans text-xs text-slate-300 leading-relaxed">
                {selectedThought.summary}
              </p>
            </div>

            {/* Explanation / Why it belongs here */}
            {selectedThought.reason && (
              <div className="p-4 rounded-xl bg-black/20 border border-white/10">
                <div className="font-mono text-[10px] text-purple-300 mb-2 uppercase tracking-wide">
                  COSMIC CLASSIFICATION REASON
                </div>
                <p className="font-sans text-[11px] text-slate-400 leading-relaxed italic">
                  "{selectedThought.reason}"
                </p>
              </div>
            )}

            {/* Tags section */}
            <div>
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-500 mb-2.5 uppercase">
                <Tag size={10} className="text-slate-500" />
                Tags
              </div>
              <div id="thought-tags-list" className="flex flex-wrap gap-1.5">
                {selectedThought.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 text-[10px] font-mono tracking-wider text-indigo-400 rounded bg-white/5 border border-white/10"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Connections & Related thoughts */}
            <div className="p-5 rounded-2xl bg-indigo-950/10 border border-indigo-500/20 shadow-[0_0_12px_rgba(99,102,241,0.05)]">
              <h4 className="text-xs font-semibold text-white mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                Related Paths ({relatedThoughts.length})
              </h4>
              
              {relatedThoughts.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {relatedThoughts.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => onSelectThought(t.id)}
                      className="w-full text-left p-2.5 rounded-lg hover:bg-indigo-900/10 bg-black/10 border border-white/5 hover:border-indigo-500/30 transition-all flex items-center justify-between text-xs group cursor-pointer"
                    >
                      <span className="text-slate-300 font-sans truncate pr-4 max-w-[85%] group-hover:text-indigo-400 transition-colors">
                        → {t.text}
                      </span>
                      <span className="text-purple-300 font-mono text-[8px] uppercase tracking-widest shrink-0 opacity-75">
                        SELECT star
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-center rounded-lg border border-dashed border-white/15 text-[10px] text-slate-500 font-mono">
                  SINGLE ORBIT STAR - NO LINKS DETECTED YET
                </div>
              )}
            </div>

            {/* Metadatas */}
            <div className="pt-4 border-t border-white/10 flex flex-wrap justify-between items-center text-[10px] font-mono text-cosmic-gray gap-2">
              <span className="flex items-center gap-1">
                <Calendar size={10} />
                {new Date(selectedThought.createdAt).toLocaleDateString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <button
                onClick={() => {
                  const catId = selectedThought.categoryId;
                  onSelectThought(null);
                  onSelectCategory(catId);
                }}
                className="hover:text-primary transition-all cursor-pointer"
              >
                Category Hub: {selectedCategory?.name}
              </button>
            </div>

            {/* Actions for cleanup */}
            <div className="pt-4 flex items-center gap-2 border-t border-white/5">
              {isConfirmingBottom ? (
                <button
                  id="btn-delete-thought-confirm"
                  onClick={async () => {
                    onSelectThought(null);
                    await onDeleteThought(selectedThought.id);
                    setIsConfirmingBottom(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-red-500 bg-red-700 hover:bg-red-600 text-white font-mono text-[10px] tracking-wider transition-all cursor-pointer uppercase animate-pulse"
                >
                  <Trash2 size={12} />
                  CONFIRM DISSOLUTION // CLICK TO DISINTEGRATE
                </button>
              ) : (
                <button
                  id="btn-delete-thought"
                  onClick={() => setIsConfirmingBottom(true)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-red-500/30 bg-red-950/15 hover:bg-red-500/10 text-red-400 font-mono text-[10px] tracking-wider transition-all cursor-pointer uppercase"
                >
                  <Trash2 size={12} />
                  Dissolve Star Node
                </button>
              )}
            </div>
          </motion.div>
        ) : selectedCategory ? (
          <motion.div
            key={`category-detail-${selectedCategory.id}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex flex-col gap-5 text-white"
          >
            <div>
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-indigo-400 uppercase">
                <Compass size={11} className="spin-slow" />
                CONSTELLATION SECTOR
              </div>
              <h3 className="mt-2 text-xl font-heading font-light tracking-wide text-white uppercase">
                {selectedCategory.name}
              </h3>
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              {selectedCategory.description}
            </p>

            <div className="p-4 rounded-xl bg-indigo-950/10 border border-white/10 flex flex-col gap-3 font-mono text-xs shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
              <div className="text-[10px] text-slate-500 tracking-wider uppercase">
                Sector Metrics
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1 text-[11px]">
                <span className="text-slate-500">Tension Nodes:</span>
                <span className="text-slate-300">{thoughtCount} stars</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1 text-[11px]">
                <span className="text-slate-500">Galactic Alpha:</span>
                <span className="text-slate-300">{selectedCategory.x}, {selectedCategory.y}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Constellation Links:</span>
                <span className="text-slate-300">{selectedCategory.connections.length} sectors</span>
              </div>
            </div>

            {/* Sector Stars Index */}
            <div>
              <div className="text-[10px] font-mono text-slate-500 tracking-wider mb-2.5 uppercase">
                Sector Stars Index ({thoughtCount})
              </div>
              {thoughtCount > 0 ? (
                <div id="sector-stars-index" className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {thoughts
                    .filter((t) => t.categoryId === selectedCategory.id)
                    .map((t) => (
                      <div
                        key={t.id}
                        className="group flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5 hover:border-indigo-500/20 hover:bg-indigo-950/20 transition-all"
                      >
                        <button
                          onClick={() => onSelectThought(t.id)}
                          className="flex-1 text-left text-xs text-slate-300 hover:text-white truncate pr-2 cursor-pointer bg-transparent border-none"
                        >
                          → "{t.text}"
                          {t.subcategory && (
                            <span className="ml-2 text-[8px] font-mono text-indigo-300 bg-indigo-500/15 border border-indigo-500/25 px-1 rounded uppercase font-semibold">
                              {t.subcategory}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteThought(t.id);
                          }}
                          title="Dissolve Star"
                          className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer border-none bg-transparent shrink-0"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="p-3 text-center rounded-lg border border-dashed border-white/10 text-[10px] text-slate-500 font-mono">
                  NO STAR NODES DETECTED IN THIS SECTOR
                </div>
              )}
            </div>

            {/* Related constellations lists */}
            {selectedCategory.connections.length > 0 && (
              <div>
                <div className="text-[10px] font-mono text-slate-500 tracking-wider mb-2 uppercase">
                  Connected Sectors
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCategory.connections.map((cid) => {
                    const linked = categories.find((c) => c.id === cid);
                    if (!linked) return null;
                    return (
                      <button
                        key={cid}
                        onClick={() => onSelectCategory(cid)}
                        className="px-2.5 py-1 text-[10px] font-mono tracking-wider rounded bg-indigo-500/10 border border-indigo-500/20 hover:border-indigo-400 text-indigo-400 transition-all cursor-pointer"
                      >
                        {linked.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="text-[10px] text-slate-500 font-mono pt-4 border-t border-white/5 leading-relaxed">
              To inspect thoughts in this system, click on any connected star inside the active galaxy viewport stage.
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty-detail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full flex flex-col gap-5 text-white"
          >
            <div>
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-indigo-400 uppercase">
                <Compass size={11} className="spin-slow" />
                SYSTEM-WIDE INDEX
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400 font-sans leading-relaxed">
                Browse every active star categorized within key dimensional networks. Focus a node or dissolve it directly.
              </p>
            </div>

            <div id="system-stars-index" className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
              {categories.map((cat) => {
                const catThoughts = thoughts.filter((t) => t.categoryId === cat.id);
                return (
                  <div key={`idx-cat-${cat.id}`} className="space-y-1.5">
                    <button
                      onClick={() => onSelectCategory(cat.id)}
                      className="w-full text-left font-mono text-[10px] tracking-wider text-purple-300 font-semibold hover:text-white transition-all uppercase flex justify-between items-center bg-transparent border-none p-0 cursor-pointer"
                    >
                      <span>📁 {cat.name}</span>
                      <span className="text-slate-500 font-normal text-[9px] lowercase">{catThoughts.length} stars</span>
                    </button>
                    {catThoughts.length > 0 ? (
                      <div className="flex flex-col gap-1 pl-2">
                        {catThoughts.map((t) => (
                          <div
                            key={t.id}
                            className="group flex items-center justify-between p-1.5 rounded-md bg-white/5 border border-white/5 hover:border-indigo-500/20 hover:bg-indigo-950/5 transition-all"
                          >
                            <button
                              onClick={() => {
                                onSelectCategory(t.categoryId);
                                onSelectThought(t.id);
                              }}
                              className="flex-1 text-left text-[11px] text-slate-400 group-hover:text-slate-200 truncate pr-2 cursor-pointer bg-transparent border-none"
                            >
                              → "{t.text}"
                              {t.subcategory && (
                                <span className="ml-1.5 font-mono text-[8px] text-indigo-300 uppercase">
                                  [{t.subcategory}]
                                </span>
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteThought(t.id);
                              }}
                              title="Dissolve Star"
                              className="p-1 rounded text-slate-500 group-hover:text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer border-none bg-transparent"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="pl-4 py-1 text-[10px] text-slate-600 font-mono italic">
                        No active nodes in this sector
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
