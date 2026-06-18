import React, { useState, useMemo, useRef, useEffect } from "react";
import { Category, Thought } from "../types";
import { Search, Compass, Star, Hash, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SearchControlProps {
  categories: Category[];
  thoughts: Thought[];
  onNavigateToCategory: (catId: string) => void;
  onNavigateToThought: (thoughtId: string, catId: string) => void;
}

export default function SearchControl({
  categories,
  thoughts,
  onNavigateToCategory,
  onNavigateToThought,
}: SearchControlProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close list on clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter list containing Categories, Thoughts and Tags
  const searchResults = useMemo(() => {
    if (!query.trim()) return { categories: [], thoughts: [], tags: [] };
    const q = query.toLowerCase().trim();

    // 1. Match Categories
    const filteredCats = categories.filter(
      (c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
    );

    // 2. Match Thoughts
    const filteredThoughts = thoughts.filter(
      (t) => t.text.toLowerCase().includes(q) || t.summary.toLowerCase().includes(q)
    );

    // 3. Match Tags (Unique matching tags across all thoughts)
    const allTags = new Set<string>();
    thoughts.forEach((t) => t.tags.forEach((tag) => allTags.add(tag)));
    const filteredTags = Array.from(allTags).filter((tag) => tag.toLowerCase().includes(q));

    return {
      categories: filteredCats.slice(0, 3),
      thoughts: filteredThoughts.slice(0, 5),
      tags: filteredTags.slice(0, 4),
    };
  }, [query, categories, thoughts]);

  const hasResults =
    searchResults.categories.length > 0 ||
    searchResults.thoughts.length > 0 ||
    searchResults.tags.length > 0;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Bar Input */}
      <div className="relative flex items-center w-full">
        <Search className="absolute left-3.5 text-cosmic-gray" size={14} />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search thoughts, constellations, #tags..."
          className="w-full bg-[#1b1b1d]/80 rounded-lg border border-white/10 pl-10 pr-10 py-2.5 font-sans text-xs text-stellar-white outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-light"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            className="absolute right-3 text-cosmic-gray hover:text-white cursor-pointer"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Auto-Complete drop panel */}
      <AnimatePresence>
        {isOpen && query.trim() && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute left-0 right-0 mt-2 z-50 glass-panel rounded-lg max-h-[350px] overflow-y-auto p-2 flex flex-col gap-3"
          >
            {hasResults ? (
              <>
                {/* CATEGORIES COLUMN */}
                {searchResults.categories.length > 0 && (
                  <div>
                    <div className="px-2 py-1 flex items-center gap-1 text-[9px] font-mono text-primary tracking-widest uppercase">
                      <Compass size={10} />
                      Sectors Map
                    </div>
                    {searchResults.categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          onNavigateToCategory(cat.id);
                          setQuery("");
                          setIsOpen(false);
                        }}
                        className="w-full text-left px-2 py-1.5 rounded-md hover:bg-white/5 transition-all flex flex-col cursor-pointer mt-0.5"
                      >
                        <span className="text-xs font-heading font-normal text-stellar-white">
                          {cat.name}
                        </span>
                        <span className="text-[9px] text-[#bec8d2]/70 font-sans truncate max-w-full">
                          {cat.description}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* THOUGHTS COLUMN */}
                {searchResults.thoughts.length > 0 && (
                  <div>
                    <div className="px-2 py-1 flex items-center gap-1 text-[9px] font-mono text-[#ffb95f] tracking-widest uppercase border-t border-white/5 pt-2 mt-1">
                      <Star size={10} />
                      Thought Nodes
                    </div>
                    {searchResults.thoughts.map((th) => (
                      <button
                        key={th.id}
                        onClick={() => {
                          onNavigateToThought(th.id, th.categoryId);
                          setQuery("");
                          setIsOpen(false);
                        }}
                        className="w-full text-left px-2 py-1.5 rounded-md hover:bg-white/5 transition-all flex flex-col cursor-pointer mt-0.5"
                      >
                        <span className="text-xs font-sans text-[#e4e2e4] truncate max-w-full">
                          "{th.text}"
                        </span>
                        <span className="text-[9px] text-cosmic-gray font-mono">
                          SECTOR: {categories.find((c) => c.id === th.categoryId)?.name || "Void"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* TAGS COLUMN */}
                {searchResults.tags.length > 0 && (
                  <div>
                    <div className="px-2 py-1 flex items-center gap-1 text-[9px] font-mono text-[#bcffd3] tracking-widest uppercase border-t border-white/5 pt-2 mt-1">
                      <Hash size={10} />
                      Tags
                    </div>
                    <div className="flex flex-wrap gap-1 p-2">
                      {searchResults.tags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => {
                            // Find any thought with tag and jump to it
                            const tWithTag = thoughts.find((t) => t.tags.includes(tag));
                            if (tWithTag) {
                              onNavigateToThought(tWithTag.id, tWithTag.categoryId);
                            }
                            setQuery("");
                            setIsOpen(false);
                          }}
                          className="px-2.5 py-1 rounded-full bg-[#bcffd3]/5 border border-[#bcffd3]/10 hover:border-primary text-xs font-mono text-[#bcffd3] cursor-pointer"
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 text-center text-cosmic-gray text-xs font-mono">
                No matching celestial nodes detected
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
