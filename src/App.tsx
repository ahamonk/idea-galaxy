import React, { useState, useEffect } from "react";
import { Category, Thought, Insight, GalaxyData } from "./types";
import GalaxyCanvas from "./components/GalaxyCanvas";
import DetailPanel from "./components/DetailPanel";
import InsightsPanel from "./components/InsightsPanel";
import SearchControl from "./components/SearchControl";
import AddThoughtModal from "./components/AddThoughtModal";
import { Sparkles, Plus, Compass, Activity, Moon, Sun, Database, RefreshCw, Key } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // Primary Galaxy Datasets
  const [categories, setCategories] = useState<Category[]>([]);
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);

  // Navigation Camera States
  const [viewMode, setViewMode] = useState<'galaxy' | 'category'>('galaxy');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedThoughtId, setSelectedThoughtId] = useState<string | null>(null);

  // Layout UI states
  const [activeTab, setActiveTab] = useState<'detail' | 'insights'>('detail');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Closed by default
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [isAddingThought, setIsAddingThought] = useState(false);
  const [isGeminiActive, setIsGeminiActive] = useState(true);
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "offline">("syncing");

  // Load Galaxy Data on Mount
  const loadGalaxy = async () => {
    try {
      setSyncStatus("syncing");
      const res = await fetch("/api/galaxy");
      if (!res.ok) throw new Error("Server response negative");
      const data = await res.json();
      
      setCategories(data.categories || []);
      setThoughts(data.thoughts || []);
      setInsights(data.insights || []);
      setIsGeminiActive(data.isGeminiActive);
      setSyncStatus("synced");

      // Backup to localStorage for absolute offline safety
      localStorage.setItem("galaxy_categories", JSON.stringify(data.categories));
      localStorage.setItem("galaxy_thoughts", JSON.stringify(data.thoughts));
      localStorage.setItem("galaxy_insights", JSON.stringify(data.insights));
    } catch (err) {
      console.warn("Failed to reach back-end server, launching with localStorage backup coordinates.", err);
      setSyncStatus("offline");
      
      // Fallback local persistence load
      const localCats = localStorage.getItem("galaxy_categories");
      const localThoughts = localStorage.getItem("galaxy_thoughts");
      const localInsights = localStorage.getItem("galaxy_insights");

      if (localCats && localThoughts) {
        setCategories(JSON.parse(localCats));
        setThoughts(JSON.parse(localThoughts));
        if (localInsights) setInsights(JSON.parse(localInsights));
      }
    }
  };

  useEffect(() => {
    loadGalaxy();
  }, []);

  // Sync client newly authored data onto the server (Prevents cleared containers from erasing progress)
  useEffect(() => {
    if (syncStatus === "synced" && thoughts.length > 0) {
      const syncWithServer = async () => {
        try {
          await fetch("/api/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ categories, thoughts, insights })
          });
        } catch (err) {
          console.error("Delayed delta syncing failed.", err);
        }
      };
      
      const timer = setTimeout(syncWithServer, 2000);
      return () => clearTimeout(timer);
    }
  }, [thoughts, categories, insights, syncStatus]);

  // Handlers for Galaxy Operations
  const handleAddThought = async (text: string) => {
    setIsAddingThought(true);
    try {
      const response = await fetch("/api/thoughts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });

      if (!response.ok) throw new Error("Post response failure");
      const data = await response.json();

      if (data.success) {
        setCategories(data.categories);
        setThoughts(data.thoughts);
        
        // Dynamic Zooming: Auto navigate to the correct category and select the newly launched node!
        const newThought = data.thought;
        if (newThought) {
          setSelectedCategoryId(newThought.categoryId);
          setViewMode('category');
          setSelectedThoughtId(newThought.id);
          setActiveTab('detail');
          setIsSidebarOpen(true); // Open panel on launch
        }

        // Save local backup copies
        localStorage.setItem("galaxy_categories", JSON.stringify(data.categories));
        localStorage.setItem("galaxy_thoughts", JSON.stringify(data.thoughts));
      }
    } catch (err) {
      console.error("Could not launch new star system node.", err);
      throw err;
    } finally {
      setIsAddingThought(false);
    }
  };

  const handleDeleteThought = async (id: string) => {
    try {
      const response = await fetch(`/api/thoughts/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) throw new Error("Delete response failure");
      const data = await response.json();

      if (data.success) {
        setThoughts(data.thoughts);
        setSelectedThoughtId(null);
        localStorage.setItem("galaxy_thoughts", JSON.stringify(data.thoughts));

        if (data.categories) {
          setCategories(data.categories);
          localStorage.setItem("galaxy_categories", JSON.stringify(data.categories));
          
          // If our current selected category was deleted, transition back to galaxy view
          if (selectedCategoryId && !data.categories.some((c: any) => c.id === selectedCategoryId)) {
            setSelectedCategoryId(null);
            setViewMode('galaxy');
          }
        }
      }
    } catch (err) {
      console.error("Node dissolution failed.", err);
    }
  };

  const handleGenerateInsights = async () => {
    setIsGeneratingInsights(true);
    try {
      const response = await fetch("/api/insights", {
        method: "POST"
      });

      if (!response.ok) throw new Error("Insights trigger failure");
      const data = await response.json();

      if (data.success) {
        setInsights(data.insights);
        localStorage.setItem("galaxy_insights", JSON.stringify(data.insights));
      }
    } catch (err) {
      console.error("Could not compile mind insights.", err);
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const handleResetConstellations = async () => {
    if (!confirm("Reset all custom thoughts and categories back to standard seed constellations?")) return;
    try {
      const response = await fetch("/api/reset", {
        method: "POST"
      });
      const data = await response.json();
      if (data.success) {
        setCategories(data.data.categories);
        setThoughts(data.data.thoughts);
        setInsights(data.data.insights);
        
        setViewMode('galaxy');
        setSelectedCategoryId(null);
        setSelectedThoughtId(null);

        localStorage.setItem("galaxy_categories", JSON.stringify(data.data.categories));
        localStorage.setItem("galaxy_thoughts", JSON.stringify(data.data.thoughts));
        localStorage.setItem("galaxy_insights", JSON.stringify(data.data.insights));
      }
    } catch (err) {
      console.error("Error resetting galaxy", err);
    }
  };

  // Autocomplete search handlers
  const handleNavigateToCategory = (catId: string) => {
    setSelectedCategoryId(catId);
    setSelectedThoughtId(null);
    setViewMode('category');
    setActiveTab('detail');
  };

  const handleNavigateToThought = (thoughtId: string, catId: string) => {
    setSelectedCategoryId(catId);
    setSelectedThoughtId(thoughtId);
    setViewMode('category');
    setActiveTab('detail');
    setIsSidebarOpen(true); // Open panel on search selection
  };

  return (
    <div className="min-h-screen bg-[#050508] text-slate-200 font-sans flex flex-col relative overflow-hidden select-none">
      
      {/* Background Atmosphere - Geometric Balance */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[150px]" />
        <div className="absolute inset-0 opacity-15" style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      </div>

      {/* PRIMARY APPLICATION HEADER BANNER */}
      <header className="relative z-30 h-16 border-b border-white/10 flex items-center justify-between px-8 backdrop-blur-md bg-black/20 shrink-0">
        <div 
          onClick={() => {
            setViewMode('galaxy');
            setSelectedCategoryId(null);
            setSelectedThoughtId(null);
          }}
          className="flex items-center gap-3 cursor-pointer selection:bg-transparent"
        >
          <div className="w-8 h-8 rounded-full border-2 border-indigo-400 flex items-center justify-center relative">
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
            <div className="absolute -inset-1 rounded-full bg-indigo-400/20 blur-sm opacity-50" />
          </div>
          <div>
            <h1 className="font-heading text-lg font-medium text-white tracking-tight leading-none">
              Idea Galaxy
            </h1>
            <p className="text-[9px] font-mono tracking-widest text-indigo-400 mt-1 uppercase">
              Geometric Balance // Projections
            </p>
          </div>
        </div>

        {/* Global Autocomplete Search */}
        <div className="w-[30%] max-w-sm hidden sm:block">
          <SearchControl
            categories={categories}
            thoughts={thoughts}
            onNavigateToCategory={handleNavigateToCategory}
            onNavigateToThought={handleNavigateToThought}
          />
        </div>

        {/* Header Right Status Control Grid & launch button */}
        <div className="flex items-center gap-4">
          <div className="items-center gap-2 hidden lg:flex font-mono text-[9px] tracking-wide text-slate-500 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
            <Database size={10} className="text-indigo-400" />
            STATUS: 
            <span className={syncStatus === "synced" ? "text-indigo-400" : syncStatus === "syncing" ? "text-indigo-400 animate-pulse" : "text-amber-400"}>
              {syncStatus === "synced" ? "STABLE // ONLINE" : syncStatus === "syncing" ? "SYNCING CORE..." : "HEURISTIC BACKUP"}
            </span>
          </div>

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`px-4 py-2.5 rounded-full text-xs font-mono font-medium border transition-all flex items-center gap-1.5 cursor-pointer bg-transparent ${
              isSidebarOpen 
                ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30" 
                : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <Compass size={12} className={isSidebarOpen ? "animate-spin duration-[8000ms]" : ""} />
            {isSidebarOpen ? "CLOSE INDEX" : "OPEN INDEX"}
          </button>

          <button
            id="btn-add-thought-trigger"
            onClick={() => setIsAddOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer flex items-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] border-none"
          >
            <span>+</span> Launch Thought
          </button>
        </div>
      </header>

      {/* MAIN LAYOUT SPLIT STAGE CONTENT */}
      <main className="flex-1 flex flex-col md:flex-row min-h-0 z-20">
        
        {/* LEFT COLUMN: GALAXY CANVAS RENDERING STAGE */}
        <section className="flex-1 min-h-0 p-4 md:p-6 flex flex-col gap-4 relative">
          <div className="flex-1 relative">
            <GalaxyCanvas
              categories={categories}
              thoughts={thoughts}
              viewMode={viewMode}
              selectedCategoryId={selectedCategoryId}
              selectedThoughtId={selectedThoughtId}
              onSelectCategory={(catId) => {
                setSelectedCategoryId(catId);
                setViewMode('category');
                setSelectedThoughtId(null);
                setActiveTab('detail');
              }}
              onSelectThought={(id) => {
                setSelectedThoughtId(id);
                setActiveTab('detail');
                setIsSidebarOpen(true);
              }}
              onBackToGalaxy={() => {
                setViewMode('galaxy');
                setSelectedCategoryId(null);
                setSelectedThoughtId(null);
              }}
            />
          </div>

          {/* BOTTOM QUICK INSTRUCTIONS STATUS RAIL */}
          <div className="px-4 py-2.5 rounded-xl bg-black/20 backdrop-blur-md border border-white/10 flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono text-slate-500">
            <div className="flex items-center gap-2 leading-none">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />
              <span>
                {viewMode === "galaxy" 
                  ? "Select a Constellation cluster above to navigate deeper into individual thought arrays."
                  : "Click individual star nodes inside the constellation to read summaries, tags and semantic links."}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                id="btn-reset-constellations"
                onClick={handleResetConstellations}
                className="hover:text-indigo-400 transition-all flex items-center gap-1 cursor-pointer bg-transparent border-none text-slate-500 text-[10px]"
              >
                <RefreshCw size={10} />
                RESET GALAXY
              </button>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: OBSERVATORY CONTROL SIDEBAR */}
        <aside className={`transition-all duration-300 ease-out flex flex-col shrink-0 min-h-0 relative ${
          isSidebarOpen 
            ? "w-full md:w-[360px] lg:w-[400px] border-t md:border-t-0 md:border-l border-white/10 bg-black/15 backdrop-blur-md" 
            : "w-0 overflow-hidden border-none bg-transparent opacity-0 pointer-events-none"
        }`}>
          
          {/* TAB BAR SELECTORS */}
          <div className="flex border-b border-white/10 bg-black/35 p-2 gap-1.5 shrink-0">
            <button
              onClick={() => setActiveTab('detail')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-mono text-[10px] tracking-wider uppercase transition-all cursor-pointer ${
                activeTab === "detail"
                  ? "bg-white/5 border border-white/10 text-white font-medium"
                  : "text-slate-500 hover:text-white"
              }`}
            >
              <Compass size={12} />
              COORDINATES INDEX
            </button>
            <button
              id="tab-insights-select"
              onClick={() => setActiveTab('insights')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-mono text-[10px] tracking-wider uppercase transition-all cursor-pointer ${
                activeTab === "insights"
                  ? "bg-white/5 border border-white/10 text-white font-medium"
                  : "text-slate-500 hover:text-white"
              }`}
            >
              <Activity size={12} />
              GLOBAL INSIGHTS
            </button>
          </div>

          {/* ACTIVE PANEL CONTENT WRAPPER */}
          <div className="flex-1 relative min-h-0">
            {activeTab === "detail" ? (
              <DetailPanel
                categories={categories}
                thoughts={thoughts}
                selectedCategoryId={selectedCategoryId}
                selectedThoughtId={selectedThoughtId}
                onSelectThought={setSelectedThoughtId}
                onSelectCategory={handleNavigateToCategory}
                onDeleteThought={handleDeleteThought}
                isGeminiActive={isGeminiActive}
              />
            ) : (
              <div className="absolute inset-0 p-6 overflow-y-auto">
                <InsightsPanel
                  insights={insights}
                  onGenerateInsights={handleGenerateInsights}
                  isGenerating={isGeneratingInsights}
                />
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* MINIMALIST WARNING DISCLOSURE IF OFFLINE */}
      {!isGeminiActive && (
        <div className="absolute top-18 left-1/2 -translate-x-1/2 z-40 bg-indigo-500/10 border border-indigo-500/25 px-4 py-2 rounded-full flex items-center gap-2 pointer-events-none text-[10px] font-mono uppercase text-indigo-300 backdrop-blur-md">
          <Key size={11} className="animate-pulse" />
          <span>OFFLINE LOCAL MODE // Setup Gemini Secret Key for Automatic Oracle Projections</span>
        </div>
      )}

      {/* EXPAND UNIVERSE (ADD THOUGHT) DIALOG MODAL */}
      <AddThoughtModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleAddThought}
        isSubmitting={isAddingThought}
      />
    </div>
  );
}
