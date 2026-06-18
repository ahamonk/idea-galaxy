import React, { useMemo, useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Category, Thought } from "../types";
import { ArrowLeft, Sparkles, ZoomIn, Eye, Activity, HelpCircle } from "lucide-react";

interface GalaxyCanvasProps {
  categories: Category[];
  thoughts: Thought[];
  viewMode: 'galaxy' | 'category';
  selectedCategoryId: string | null;
  selectedThoughtId: string | null;
  onSelectCategory: (catId: string) => void;
  onSelectThought: (thoughtId: string | null) => void;
  onBackToGalaxy: () => void;
}

export default function GalaxyCanvas({
  categories,
  thoughts,
  viewMode,
  selectedCategoryId,
  selectedThoughtId,
  onSelectCategory,
  onSelectThought,
  onBackToGalaxy,
}: GalaxyCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Pan and drag navigation states
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [draggingState, setDraggingState] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const isDragActive = useRef(false);

  // Update canvas size on window resize
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width || 800,
          height: entry.contentRect.height || 600,
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Reset panning offset when we switch sectors
  useEffect(() => {
    setPanOffset({ x: 0, y: 0 });
  }, [viewMode, selectedCategoryId]);

  const centerX = dimensions.width / 2;
  const centerY = dimensions.height / 2;

  // Active category coordinates for camera centering
  const activeCategory = useMemo(() => {
    if (!selectedCategoryId) return null;
    return categories.find((c) => c.id === selectedCategoryId) || null;
  }, [categories, selectedCategoryId]);

  // Determine transition transforms
  const transformStyle = useMemo(() => {
    let baseTarget = { x: centerX, y: centerY, scale: 1.0 };
    
    if (viewMode === 'category' && activeCategory) {
      // Zoom camera specifically onto category coordinates
      baseTarget = {
        x: centerX - activeCategory.x * 1.5,
        y: centerY - activeCategory.y * 1.5,
        scale: 1.5,
      };
    }
    
    return {
      x: baseTarget.x + panOffset.x,
      y: baseTarget.y + panOffset.y,
      scale: baseTarget.scale,
    };
  }, [viewMode, activeCategory, centerX, centerY, panOffset]);

  // Specific category thoughts with dynamically clustered and distributed coordinates
  const currentCategoryThoughts = useMemo(() => {
    if (!selectedCategoryId) return [];
    const rawThoughts = thoughts.filter((t) => t.categoryId === selectedCategoryId);
    
    // Find all unique subcategories in this category for clean 360-degree distribution
    const uniqueSubs = Array.from(new Set(rawThoughts.map(t => (t.subcategory || "Inspirations") as string)));
    const angleCount = uniqueSubs.length;
    
    return rawThoughts.map((t) => {
      const subName = (t.subcategory || "Inspirations") as string;
      const subIndex = uniqueSubs.indexOf(subName);
      
      // Distribute subcategories evenly in a circle around the sector core (radius 110)
      const stableAngle = angleCount > 0 
        ? (subIndex / angleCount) * 2 * Math.PI + (Math.PI / 4)
        : 0;
      
      const subCenterX = Math.round(Math.cos(stableAngle) * 110);
      const subCenterY = Math.round(Math.sin(stableAngle) * 110);
      
      // Find all thoughts in this specific subcategory to cluster them inside the orbit boundary
      const subThoughts = rawThoughts.filter(th => (th.subcategory || "Inspirations") === subName);
      const thoughtIdx = subThoughts.findIndex(th => th.id === t.id);
      const sameSubCount = subThoughts.length;
      
      // Position thoughts in a neat, symmetrical mini-orbit around their subcategory center (radius 25)
      const thoughtAngle = sameSubCount > 1
        ? (thoughtIdx / sameSubCount) * 2 * Math.PI
        : 0;
      
      const thoughtRadius = 25;
      
      const computedX = Math.round(subCenterX + Math.cos(thoughtAngle) * thoughtRadius);
      const computedY = Math.round(subCenterY + Math.sin(thoughtAngle) * thoughtRadius);
      
      return {
        ...t,
        x: computedX,
        y: computedY,
        thoughtAngle: thoughtAngle
      };
    });
  }, [thoughts, selectedCategoryId]);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    dragStart.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
    isDragActive.current = false;
    setDraggingState(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingState) return;
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;
    
    const dx = newX - panOffset.x;
    const dy = newY - panOffset.y;
    const totalDist = Math.sqrt(dx * dx + dy * dy);
    
    if (totalDist > 2) {
      isDragActive.current = true;
    }
    setPanOffset({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setDraggingState(false);
  };

  const handleMouseLeave = () => {
    setDraggingState(false);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Safe node clicks checking that we weren't just dragging
  const handleCategoryClick = (catId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDragActive.current) return;
    onSelectCategory(catId);
  };

  const handleThoughtClick = (thoughtId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDragActive.current) return;
    onSelectThought(thoughtId);
  };

  const cursorClass = draggingState ? "cursor-grabbing shadow-inner" : "cursor-grab";

  return (
    <div
      id="galaxy-canvas-container"
      ref={containerRef}
      className={`relative w-full h-full bg-transparent overflow-hidden ${cursorClass} select-none rounded-xl border border-white/10 shadow-2xl shadow-indigo-950/20`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onDragStart={handleDragStart}
    >
      {/* Background Star Ambient Dust */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-[20%] left-[30%] w-1 h-1 bg-indigo-400 rounded-full animate-ping duration-[6000ms]" />
        <div className="absolute top-[40%] left-[80%] w-[2px] h-[2px] bg-purple-300 rounded-full animate-pulse" />
        <div className="absolute top-[80%] left-[10%] w-1 h-1 bg-indigo-300 rounded-full animate-ping duration-[8000ms]" />
        <div className="absolute top-[15%] left-[70%] w-[2px] h-[2px] bg-white rounded-full animate-pulse" />
        <div className="absolute top-[65%] left-[50%] w-1 h-1 bg-indigo-200 rounded-full animate-ping duration-[4000ms]" />
        <div className="absolute top-[90%] left-[75%] w-[2px] h-[2px] bg-purple-200 rounded-full animate-pulse" />
      </div>

      {/* Observational Grid overlay */}
      <div className="absolute inset-0 pointer-events-none grid grid-cols-6 grid-rows-6 opacity-5 border border-white/10">
        <div className="border-r border-b border-white/5" />
        <div className="border-r border-b border-white/5" />
        <div className="border-r border-b border-white/5" />
        <div className="border-r border-b border-white/5" />
        <div className="border-r border-b border-white/5" />
        <div className="border-b border-white/5" />
      </div>

      {/* Floating Spatial Mode Indicator */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-3">
        {viewMode === "category" && (
          <button
            id="btn-back-to-galaxy"
            onClick={onBackToGalaxy}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 border border-white/10 text-xs text-indigo-400 font-mono hover:text-white hover:border-indigo-500/50 hover:bg-black/80 transition-all cursor-pointer"
          >
            <ArrowLeft size={12} />
            BACK TO GALAXY
          </button>
        )}
        <div className="px-3 py-1.5 rounded-full bg-black/40 border border-white/10 font-mono text-[10px] tracking-wider text-slate-400 flex items-center gap-1.5 uppercase">
          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
          SYSTEM: {viewMode === "galaxy" ? "Main Galaxy Core" : activeCategory?.name || "Constellation"}
        </div>
      </div>

      {/* Coordinate HUD Labels in corners */}
      <div className="absolute bottom-4 left-4 pointer-events-none font-mono text-[9px] text-slate-500/50">
        R: 4.81 P_SEC <br />
        GALAXY_COORD: {viewMode === "category" && activeCategory ? `${activeCategory.x}, ${activeCategory.y}` : "0, 0"}
      </div>
      <div className="absolute bottom-4 right-4 pointer-events-none font-mono text-[9px] text-slate-500/50 text-right">
        SECTOR: DELTA_09 <br />
        ACTIVE_STARS: {viewMode === "galaxy" ? categories.length : currentCategoryThoughts.length}
      </div>

      {/* MAIN VIEW SVG VIEWPORT */}
      <svg className="w-full h-full select-none">
        <defs>
          {/* Glowing Filter effects */}
          <filter id="primary-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="nebula-glow-filter" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="30" result="blur" />
          </filter>
        </defs>

        {/* TRANSITION GROUP FOR ZOOMING & PANNING */}
        <motion.g
          animate={{
            transform: `translate(${transformStyle.x}px, ${transformStyle.y}px) scale(${transformStyle.scale})`,
          }}
          transition={{ type: "spring", stiffness: 70, damping: 20 }}
          className="origin-center"
        >
          {/* ========================================================= */}
          {/* VIEW: MAIN GALAXY (CATEGORIES) */}
          {/* ========================================================= */}
          {viewMode === "galaxy" && (
            <>
              {/* Category-to-Category Connections (Constellation links) */}
              {categories.map((cat) =>
                cat.connections.map((targetId) => {
                  const target = categories.find((c) => c.id === targetId);
                  if (!target || cat.id > targetId) return null; // Draw once
                  return (
                    <motion.line
                      id={`line-cat-conn-${cat.id}-${targetId}`}
                      key={`line-cat-conn-${cat.id}-${targetId}`}
                      x1={cat.x}
                      y1={cat.y}
                      x2={target.x}
                      y2={target.y}
                      stroke="rgba(129, 140, 248, 0.2)"
                      strokeWidth={1}
                      strokeDasharray="4 2"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5 }}
                    />
                  );
                })
              )}

              {/* Glowing Nebula Halos behind category stars */}
              {categories.map((cat) => {
                const thoughtCount = thoughts.filter((t) => t.categoryId === cat.id).length;
                const baseSize = 30 + Math.min(thoughtCount * 8, 40);
                return (
                  <circle
                    key={`nebula-${cat.id}`}
                    cx={cat.x}
                    cy={cat.y}
                    r={baseSize * 2.2}
                    fill={cat.id === "cat-career" ? "rgba(99, 102, 241, 0.08)" : cat.id === "cat-creative" ? "rgba(168, 85, 247, 0.08)" : cat.id === "cat-travel" ? "rgba(129, 140, 248, 0.06)" : "rgba(192, 132, 252, 0.06)"}
                    filter="url(#nebula-glow-filter)"
                    className="pointer-events-none"
                  />
                );
              })}

              {/* Category Nodes */}
              {categories.map((cat) => {
                const thoughtCount = thoughts.filter((t) => t.categoryId === cat.id).length;
                // Calculate size depending on thoughts count & activity
                const baseRadius = 8 + Math.min(thoughtCount * 1.5, 15);
                const glowColor = cat.connections.length > 1 ? "rgba(168, 85, 247, 0.4)" : "rgba(129, 140, 248, 0.4)";

                return (
                  <g
                    key={`node-group-${cat.id}`}
                    className="pointer-events-auto cursor-pointer"
                    onClick={(e) => handleCategoryClick(cat.id, e)}
                  >
                    {/* Continuous Hit Shield to prevent flickering */}
                    <rect
                      x={cat.x - 85}
                      y={cat.y - 45}
                      width={170}
                      height={100}
                      fill="transparent"
                      className="cursor-pointer pointer-events-auto"
                    />

                    {/* Ripple Ambient Halo on click/hover */}
                    <circle
                      cx={cat.x}
                      cy={cat.y}
                      r={baseRadius * 2.8}
                      fill="transparent"
                      stroke={glowColor}
                      strokeWidth={0.5}
                      strokeOpacity={0.15}
                      className="hover:scale-125 transition-transform duration-500"
                    />

                    {/* Glowing Core Star */}
                    <circle
                      cx={cat.x}
                      cy={cat.y}
                      r={baseRadius}
                      fill="#ffffff"
                      filter="url(#primary-glow)"
                      className="transition-all duration-300"
                    />

                    {/* Secondary Accent Core Ring */}
                    <circle
                      cx={cat.x}
                      cy={cat.y}
                      r={baseRadius - 3 > 2 ? baseRadius - 3 : 2}
                      fill={cat.id === "cat-career" ? "#818cf8" : cat.id === "cat-creative" ? "#c084fc" : cat.id === "cat-travel" ? "#a5b4fc" : "#a855f7"}
                    />

                    {/* Pulse Animation node for active/important category */}
                    {thoughtCount > 2 && (
                      <circle
                        cx={cat.x}
                        cy={cat.y}
                        r={baseRadius * 2.2}
                        fill="none"
                        stroke={glowColor}
                        strokeWidth={0.8}
                        className="animate-ping opacity-25"
                      />
                    )}

                    {/* Category Label text */}
                    <text
                      x={cat.x}
                      y={cat.y + baseRadius + 18}
                      textAnchor="middle"
                      fill="#e2e8f0"
                      fontSize={11}
                      fontWeight={500}
                      fontFamily="Inter"
                      letterSpacing="0.05em"
                      className="uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] fill-slate-200"
                    >
                      {cat.name}
                    </text>

                    {/* Count Indicator */}
                    <text
                      x={cat.x}
                      y={cat.y + baseRadius + 29}
                      textAnchor="middle"
                      fill="#64748b"
                      fontSize={8}
                      fontFamily="JetBrains Mono"
                      className="fill-slate-500 text-[8px]"
                    >
                      {thoughtCount} {thoughtCount === 1 ? "thought" : "thoughts"}
                    </text>
                  </g>
                );
              })}
            </>
          )}

          {/* ========================================================= */}
          {/* VIEW: CONSTELLATION ZOOM (INDIVIDUAL THOUGHTS FOR SELECTED CATEGORY) */}
          {/* ========================================================= */}
          {viewMode === "category" && activeCategory && (
            <>
              {/* Dimmed category circle relative boundary */}
              <circle
                cx={activeCategory.x}
                cy={activeCategory.y}
                r={240}
                fill="none"
                stroke="rgba(255,255,255,0.03)"
                strokeWidth={1}
                strokeDasharray="5,10"
              />

              {/* Render Subcategory orbital clusters and boundaries */}
              {(() => {
                const uniqueSubs: string[] = Array.from(new Set(currentCategoryThoughts.map(t => (t.subcategory || "Inspirations") as string)));
                const angleCount = uniqueSubs.length;
                return uniqueSubs.map((subName, subIndex) => {
                  const stableAngle = angleCount > 0 
                    ? (subIndex / angleCount) * 2 * Math.PI + (Math.PI / 4)
                    : 0;
                  const subCenterX = Math.round(Math.cos(stableAngle) * 110);
                  const subCenterY = Math.round(Math.sin(stableAngle) * 110);

                  const absoluteSubX = activeCategory.x + subCenterX;
                  const absoluteSubY = activeCategory.y + subCenterY;

                  return (
                    <g key={`subcategory-cluster-${subName}`}>
                      {/* Connection dashed vector to Sector central core */}
                      <line
                        x1={activeCategory.x}
                        y1={activeCategory.y}
                        x2={absoluteSubX}
                        y2={absoluteSubY}
                        stroke="rgba(129, 140, 248, 0.15)"
                        strokeWidth={0.7}
                        strokeDasharray="4 4"
                      />

                      {/* Cluster Boundary Orbit Ring */}
                      <circle
                        cx={absoluteSubX}
                        cy={absoluteSubY}
                        r={45}
                        fill="none"
                        stroke="rgba(129, 140, 248, 0.08)"
                        strokeWidth={0.5}
                        strokeDasharray="2 4"
                      />

                      {/* Small cluster core star anchor */}
                      <circle
                        cx={absoluteSubX}
                        cy={absoluteSubY}
                        r={3}
                        fill="#818cf8"
                        opacity={0.4}
                      />
                      <circle
                        cx={absoluteSubX}
                        cy={absoluteSubY}
                        r={8}
                        fill="none"
                        stroke="#818cf8"
                        strokeWidth={0.5}
                        strokeOpacity={0.2}
                        strokeDasharray="1 2"
                        className="animate-[spin_40s_linear_infinite]"
                      />

                      {/* Subcategory Label Indicator tag */}
                      <text
                        x={absoluteSubX}
                        y={absoluteSubY - 14}
                        textAnchor="middle"
                        fill="#c084fc"
                        fontSize={8}
                        fontWeight={500}
                        fontFamily="monospace"
                        letterSpacing="0.12em"
                        className="uppercase select-none opacity-70 pointer-events-none text-[8px] tracking-widest font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                      >
                        // {subName}
                      </text>
                    </g>
                  );
                });
              })()}

              {/* Constellation lines between related thoughts within the same category */}
              {currentCategoryThoughts.map((t) =>
                t.connections.map((targetId) => {
                  const target = currentCategoryThoughts.find((th) => th.id === targetId);
                  // Ensure we only draw direct lines inside the same category
                  if (!target || target.categoryId !== activeCategory.id || t.id > targetId) return null;
                  
                  // Calculate absolute spatial positions
                  const x1 = activeCategory.x + t.x;
                  const y1 = activeCategory.y + t.y;
                  const x2 = activeCategory.x + target.x;
                  const y2 = activeCategory.y + target.y;

                  const isLinkedToSelected = selectedThoughtId === t.id || selectedThoughtId === targetId;

                  return (
                    <motion.line
                      id={`line-thought-conn-${t.id}-${targetId}`}
                      key={`line-thought-conn-${t.id}-${targetId}`}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={isLinkedToSelected ? "#818cf8" : "rgba(129, 140, 248, 0.2)"}
                      strokeWidth={isLinkedToSelected ? 1.5 : 1}
                      strokeDasharray={isLinkedToSelected ? "none" : "4 2"}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.0 }}
                    />
                  );
                })
              )}

              {/* Star group of current category thought nodes */}
              {currentCategoryThoughts.map((t) => {
                const isSelected = selectedThoughtId === t.id;
                const starX = activeCategory.x + t.x;
                const starY = activeCategory.y + t.y;
                const baseSize = isSelected ? 8 : 4;

                // Smart dynamic text placement to prevent overlaps
                const angle = t.thoughtAngle !== undefined ? t.thoughtAngle : 0;
                const cosA = Math.cos(angle);
                const sinA = Math.sin(angle);
                
                // Push text offset outward from the star based on selection sizing
                const textDistance = isSelected ? 19 : 15;
                const labelX = Math.round(starX + cosA * textDistance);
                // Baseline shift plus slight down bias if pointing downwards
                const labelY = Math.round(starY + sinA * textDistance + (sinA >= -0.2 ? 4 : -2));

                let textAnchor = "middle";
                if (cosA > 0.4) {
                  textAnchor = "start";
                } else if (cosA < -0.4) {
                  textAnchor = "end";
                }

                return (
                  <g
                    key={`thought-star-${t.id}`}
                    className="pointer-events-auto cursor-pointer font-sans"
                    onClick={(e) => handleThoughtClick(t.id, e)}
                  >
                    {/* Continuous Hit Shield to prevent flickering */}
                    <rect
                      x={starX - 60}
                      y={starY - 26}
                      width={120}
                      height={52}
                      fill="transparent"
                      className="cursor-pointer pointer-events-auto"
                    />

                    {/* Pulsing Selection Ring */}
                    {isSelected && (
                      <circle
                        cx={starX}
                        cy={starY}
                        r={22}
                        fill="none"
                        stroke="#818cf8"
                        strokeWidth={1}
                        className="animate-pulse"
                      />
                    )}

                    {/* Standard Star Halo */}
                    <circle
                      cx={starX}
                      cy={starY}
                      r={isSelected ? 14 : 9}
                      fill="none"
                      stroke={isSelected ? "#c084fc" : "#818cf8"}
                      strokeOpacity={isSelected ? 0.6 : 0.3}
                      filter="url(#primary-glow)"
                    />

                    {/* Tiny visual star core */}
                    <circle
                      cx={starX}
                      cy={starY}
                      r={baseSize}
                      fill={isSelected ? "#c084fc" : "#ffffff"}
                      className="transition-all duration-300"
                    />

                    {/* Node Text Label (Dynamically positioned and aligned to avoid overlap) */}
                    <text
                      x={labelX}
                      y={labelY}
                      textAnchor={textAnchor}
                      fill={isSelected ? "#ffffff" : "#cbd5e1"}
                      fontSize={9}
                      fontFamily="Inter, sans-serif"
                      className="select-none font-medium text-[9px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                    >
                      {t.text.length > 25 ? t.text.substring(0, 22) + "..." : t.text}
                    </text>
                  </g>
                );
              })}

              {/* Backglow center indicator of Category Core */}
              <g
                className="pointer-events-auto cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isDragActive.current) return;
                  onBackToGalaxy();
                }}
              >
                <circle
                  cx={activeCategory.x}
                  cy={activeCategory.y}
                  r={22}
                  fill="rgba(129,140,248,0.06)"
                  stroke="rgba(129,140,248,0.2)"
                  strokeWidth={0.5}
                />
                <Eye
                  x={activeCategory.x - 6}
                  y={activeCategory.y - 6}
                  size={12}
                  className="text-indigo-400 pointer-events-none"
                />
                <text
                  x={activeCategory.x}
                  y={activeCategory.y + 26}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.4)"
                  fontSize={8}
                  fontFamily="JetBrains Mono"
                  className="select-none text-[8px]"
                >
                  SYSTEM CORE
                </text>
              </g>
            </>
          )}
        </motion.g>
      </svg>
    </div>
  );
}
