import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Persistent state storage file
const DATA_FILE = path.join(process.cwd(), "galaxy-data.json");

// Helper to load current file data or return seeds
const SEED_DATA = {
  categories: [
    {
      id: "cat-career",
      name: "Career & Craft",
      description: "Ambitious milestones, technical skills, craftsmanship, and developer execution.",
      createdAt: new Date("2026-06-15T12:00:00Z").toISOString(),
      x: -140,
      y: -90,
      connections: ["cat-creative"]
    },
    {
      id: "cat-creative",
      name: "Creative Projects",
      description: "Artistic endeavors, analog synthesizers, landscape photography, and design concepts.",
      createdAt: new Date("2026-06-15T12:05:00Z").toISOString(),
      x: 120,
      y: -140,
      connections: ["cat-career", "cat-travel"]
    },
    {
      id: "cat-travel",
      name: "Wanderlust & Exploration",
      description: "Immersive journeys, high-altitude mountains, winter escapes, and cultural learning.",
      createdAt: new Date("2026-06-15T12:10:00Z").toISOString(),
      x: 160,
      y: 110,
      connections: ["cat-creative"]
    },
    {
      id: "cat-growth",
      name: "Mind & Personal Growth",
      description: "Endurance running, daily fitness targets, contemplative philosophy, and mental resilience.",
      createdAt: new Date("2026-06-15T12:15:00Z").toISOString(),
      x: -160,
      y: 130,
      connections: ["cat-career"]
    }
  ],
  thoughts: [
    {
      id: "th-career-1",
      text: "Build a successful sustainable software startup that operates offline-first.",
      summary: "Develop software solutions emphasizing user autonomy and local-first data privacy.",
      tags: ["startup", "tech", "offline-first", "independence"],
      categoryId: "cat-career",
      subcategory: "Projects",
      createdAt: new Date("2026-06-15T13:00:00Z").toISOString(),
      reason: "Directly relates to independent technical leadership, startup building, and code quality.",
      connections: ["th-career-2"],
      x: -110,
      y: -45
    },
    {
      id: "th-career-2",
      text: "Become proficient in UI/UX typography so every app feels highly crafted.",
      summary: "Cultivate design-led focus on premium spacing, contrast, and refined typography.",
      tags: ["design", "typography", "ui-ux", "craftsmanship"],
      categoryId: "cat-career",
      subcategory: "Aspirations",
      createdAt: new Date("2026-06-15T13:30:00Z").toISOString(),
      reason: "Deals directly with visual design mastery and fine arts in software applications.",
      connections: ["th-career-1"],
      x: 105,
      y: 65
    },
    {
      id: "th-creative-1",
      text: "Publish a high-end visual astronomy photobook containing dark sky captures.",
      summary: "Create a curated print publication celebrating deep space imagery and dark-sky reserves.",
      tags: ["photography", "astronomy", "book", "editorial"],
      categoryId: "cat-creative",
      subcategory: "Projects",
      createdAt: new Date("2026-06-16T10:00:00Z").toISOString(),
      reason: "Aligns with print publication, book layout, and observational night sky fine arts.",
      connections: ["th-travel-2"],
      x: -95,
      y: -80
    },
    {
      id: "th-creative-2",
      text: "Design a modular analog ambient music generator using pure web synthesizers.",
      summary: "Build an interactive audio canvas that loops beautiful generative synthesizer chords.",
      tags: ["music", "synthesizer", "audio", "code-art"],
      categoryId: "cat-creative",
      subcategory: "Projects",
      createdAt: new Date("2026-06-16T10:30:00Z").toISOString(),
      reason: "Integrates technical web audio programming with artistic soundscape designs.",
      connections: ["th-career-1"],
      x: -75,
      y: -130
    },
    {
      id: "th-travel-1",
      text: "Spend a full month traveling through the sub-zero Hokkaido winter landscapes.",
      summary: "Venture deep into Japan's snowiest northern island to observe quiet, frozen wilderness.",
      tags: ["japan", "winter", "travel", "exploration"],
      categoryId: "cat-travel",
      subcategory: "Expeditions",
      createdAt: new Date("2026-06-17T09:00:00Z").toISOString(),
      reason: "Centered entirely on slow travel and experiencing unique cold-climate architecture.",
      connections: ["th-travel-2"],
      x: 100,
      y: 90
    },
    {
      id: "th-travel-2",
      text: "Take direct high-contrast landscape photographs under the high-altitude Andes mountains.",
      summary: "Organize a visual expedition to capture light play across dramatic Andean slopes.",
      tags: ["photography", "travel", "mountains", "andes"],
      categoryId: "cat-travel",
      subcategory: "Expeditions",
      createdAt: new Date("2026-06-17T09:42:00Z").toISOString(),
      reason: "Bridges high-altitude mountaineering travel with creative photographic capture.",
      connections: ["th-creative-1", "th-travel-1"],
      x: 80,
      y: 130
    },
    {
      id: "th-growth-1",
      text: "Establish an early morning reading ritual covering philosophical minimalism.",
      summary: "Dedicate quiet starting hours to digesting meditations on focus, calm, and clarity.",
      tags: ["mindfulness", "philosophy", "morning", "habits"],
      categoryId: "cat-growth",
      subcategory: "Daily Habits",
      createdAt: new Date("2026-06-17T06:00:00Z").toISOString(),
      reason: "Cultivates daily personal routines aimed at strengthening mental clarity.",
      connections: [],
      x: -120,
      y: 85
    },
    {
      id: "th-growth-2",
      text: "Run a continuous half-marathon along pristine coastline paths by August.",
      summary: "Train physical stamina and pacing to conquer a 21km seaside running pathway.",
      tags: ["running", "athletics", "fitness", "coastal"],
      categoryId: "cat-growth",
      subcategory: "Aspirations",
      createdAt: new Date("2026-06-17T07:15:00Z").toISOString(),
      reason: "Directly relates to physical training, health milestones, and endurance habits.",
      connections: [],
      x: 105,
      y: -60
    }
  ],
  insights: [
    {
      id: "ins-1",
      title: "The Camera & The Passport",
      content: "You frequently merge creative fine-art photo concepts directly with travel wanderlust, treating geographical exploration as the fuel of your artistic lens.",
      type: "connection",
      createdAt: new Date().toISOString()
    },
    {
      id: "ins-2",
      title: "Focus on Masterful Craft",
      content: "Your professional interest clusters show a deep respect for self-sufficient digital platforms, minimalist typography systems, and local autonomy.",
      type: "focus",
      createdAt: new Date().toISOString()
    }
  ]
};

function getOrCreateData(): any {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
      // Basic sanity check
      if (parsed.categories && parsed.thoughts) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Failed to read galaxy-data.json, returning seeds.", err);
  }
  return JSON.parse(JSON.stringify(SEED_DATA));
}

function saveData(data: any) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write galaxy-data.json", err);
  }
}

// Lazy Gemini Client Initialization
let geminiClient: GoogleGenAI | null = null;
let isGeminiConfigured = false;

function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY" && key.trim() !== "") {
      try {
        geminiClient = new GoogleGenAI({
          apiKey: key,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });
        isGeminiConfigured = true;
        console.log("Gemini API Client successfully initialized.");
      } catch (err) {
        console.error("Error creating GoogleGenAI client:", err);
      }
    } else {
      console.warn("GEMINI_API_KEY is not configured or left as default placeholder. Running in Offline Local Heuristic Mode.");
    }
  }
  return geminiClient;
}

// Heuristic offline analyzer keywords for mapping categories
const HEURISTIC_KEYWORDS: { [key: string]: string[] } = {
  "cat-career": [
    "job", "career", "startup", "founder", "hustle", "work", "tech", "coding", "software", 
    "business", "company", "money", "code", "programming", "mastery", "typography", "design", "app",
    "feature", "toggle", "button", "screen", "frontend", "backend", "system", "database", "api", 
    "function", "module", "component", "interface", "develop", "git", "deploy", "server", "architecture",
    "automation", "workspace", "product", "milestone", "tool"
  ],
  "cat-creative": [
    "music", "photo", "art", "creative", "camera", "writing", "book", "photography", "paint", 
    "drawing", "synth", "instrument", "guitar", "piano", "video", "youtube", "photobook", "podcast", "synthesizer",
    "sketch", "animation", "audio", "illustration", "exhibition", "portfolio", "creative projects", "aspirations"
  ],
  "cat-travel": ["travel", "japan", "visit", "trip", "holiday", "explore", "mountains", "andes", "photograph", "hokkaido", "europe", "destination", "flights", "passport", "adventure", "wanderlust", "expeditions"],
  "cat-growth": ["focus", "growth", "meditate", "philosophy", "habit", "gym", "health", "mind", "run", "reading", "sleep", "athletics", "personal", "improve", "diet", "mental", "daily habits", "aspirations"]
};

// Local offline fallback analyzer when API is unavailable or errors out
function offlineAnalyzeThought(text: string, currentData: any): any {
  const norm = text.toLowerCase();
  
  // High-priority direct matching short circuits for 100% reliable classification
  let matchedCatId = "cat-growth"; // default
  let forceShortCircuit = false;
  let subcategory = "Inspirations";

  if (norm.includes("gym") || norm.includes("workout") || norm.includes("fitness") || norm.includes("exercise") || norm.includes("muscle") || norm.includes("stamina") || norm.includes("health") || norm.includes("diet") || norm.includes("weightlifting") || norm.includes("running") || norm.includes("marathon") || norm.includes("meditat") || norm.includes("yoga") || norm.includes("physical") || norm.includes("sport") || norm.includes("athletics")) {
    matchedCatId = "cat-growth";
    subcategory = "Daily Habits";
    forceShortCircuit = true;
  } else if (norm.includes("code") || norm.includes("developer") || norm.includes("software") || norm.includes("startup") || norm.includes("api") || norm.includes("react") || norm.includes("database") || norm.includes("backend") || norm.includes("frontend") || norm.includes("program")) {
    matchedCatId = "cat-career";
    subcategory = "Projects";
    forceShortCircuit = true;
  }

  let maxScore = 0;
  
  if (!forceShortCircuit) {
    Object.entries(HEURISTIC_KEYWORDS).forEach(([catId, keywords]) => {
      let score = 0;
      keywords.forEach((word) => {
        if (norm.includes(word)) score += 1;
      });
      // Give some weight to existing custom category descriptions
      const cat = currentData.categories.find((c: any) => c.id === catId);
      if (cat) {
        const descWords = cat.description.toLowerCase().split(/\s+/);
        descWords.forEach((word: string) => {
          if (word.length > 4 && norm.includes(word)) score += 0.5;
        });
      }
      if (score > maxScore) {
        maxScore = score;
        matchedCatId = catId;
      }
    });

    // If match score is 0, check other categories created dynamically
    if (maxScore === 0) {
      for (const cat of currentData.categories) {
        if (!HEURISTIC_KEYWORDS[cat.id]) {
          // dynamic category
          const words = cat.name.toLowerCase().split(/\s+/);
          let score = 0;
          words.forEach((w: string) => {
            if (w.length > 3 && norm.includes(w)) score += 2;
          });
          if (score > maxScore) {
            maxScore = score;
            matchedCatId = cat.id;
          }
        }
      }
    }

    // Generate subcategory
    if (norm.includes("project") || norm.includes("build") || norm.includes("app") || norm.includes("startup") || norm.includes("maker") || norm.includes("design") || norm.includes("tool") || norm.includes("publish")) {
      subcategory = "Projects";
    } else if (norm.includes("want") || norm.includes("learn") || norm.includes("will") || norm.includes("achieve") || norm.includes("become") || norm.includes("aim") || norm.includes("goal") || norm.includes("future") || norm.includes("aspiration") || norm.includes("dream")) {
      subcategory = "Aspirations";
    } else if (norm.includes("habit") || norm.includes("daily") || norm.includes("morning") || norm.includes("routine") || norm.includes("read") || norm.includes("every day") || norm.includes("run")) {
      subcategory = "Daily Habits";
    } else if (norm.includes("travel") || norm.includes("visit") || norm.includes("trip") || norm.includes("explore")) {
      subcategory = "Expeditions";
    }
  }

  // Generate tags
  const defaultWords = norm.split(/[^a-zA-Z]+/).filter(w => w.length > 3 && !["want", "this", "that", "with", "have", "some"].includes(w));
  const tags = Array.from(new Set([...defaultWords.slice(0, 3), "offline-sync"]));

  // Generate summary
  const summary = text.length > 60 ? text.substring(0, 58) + "..." : text;

  // Let's check if match score is STILL 0 and not short-circuited. If so, create a brand-new offline category dynamically!
  if (maxScore === 0 && !forceShortCircuit) {
    let newCatName = "Personal Exploration";
    let newCatDesc = "An untracked celestial domain of custom raw interests.";

    if (norm.includes("cook") || norm.includes("food") || norm.includes("recipe") || norm.includes("gourmet") || norm.includes("kitchen")) {
      newCatName = "Culinary Craft";
      newCatDesc = "Gourmet recipes, culinary techniques, and food appreciation.";
    } else if (norm.includes("finance") || norm.includes("stock") || norm.includes("invest") || norm.includes("crypto") || norm.includes("money") || norm.includes("portfolio")) {
      newCatName = "Wealth & Strategy";
      newCatDesc = "Economic strategies, investment research, and financial growth tracks.";
    } else if (norm.includes("relat") || norm.includes("friend") || norm.includes("family") || norm.includes("love") || norm.includes("human")) {
      newCatName = "Kinship & Resonance";
      newCatDesc = "Interpersonal connections, social records, and human associations.";
    } else if (norm.includes("garden") || norm.includes("flower") || norm.includes("plants") || norm.includes("home") || norm.includes("room") || norm.includes("interior")) {
      newCatName = "Home Sanctuary";
      newCatDesc = "Serene living spaces, botanical gardens, and interior design.";
    } else if (norm.includes("game") || norm.includes("play") || norm.includes("gaming") || norm.includes("nintendo") || norm.includes("steam")) {
      newCatName = "Play & Recreation";
      newCatDesc = "Interactive simulation, theoretical game mechanics, and virtual worlds.";
    }

    const existingCat = currentData.categories.find((c: any) => c.name.toLowerCase() === newCatName.toLowerCase());
    if (existingCat) {
      matchedCatId = existingCat.id;
    } else {
      const newCatId = "cat-" + Math.random().toString(36).substr(2, 9);
      const angle = Math.random() * Math.PI * 2;
      const r = 160 + Math.random() * 60;
      matchedCatId = newCatId;

      return {
        categoryId: newCatId,
        categoryName: newCatName,
        categoryDescription: newCatDesc,
        isNewCategory: true,
        subcategory,
        summary: `[Heuristic Mode] Plan centered around: ${summary}`,
        tags: tags.length > 0 ? tags : ["idea", "insight"],
        reason: `Discovered a distinct conceptual frequency: created beautiful new public sector "${newCatName}".`,
        relatedThoughtIds: [],
        updatedCategoryConnections: ["cat-creative"],
        newCategoryCoords: {
          x: Math.round(Math.cos(angle) * r),
          y: Math.round(Math.sin(angle) * r)
        }
      };
    }
  }

  const matchedCat = currentData.categories.find((c: any) => c.id === matchedCatId);
  const sisterThoughts = currentData.thoughts.filter((t: any) => t.categoryId === matchedCatId);
  const relatedThoughtIds = sisterThoughts.slice(0, 2).map((t: any) => t.id);

  return {
    categoryId: matchedCatId,
    categoryName: matchedCat ? matchedCat.name : "Personal Exploration",
    categoryDescription: matchedCat ? matchedCat.description : "Auto-created cluster of thoughts.",
    isNewCategory: false,
    subcategory,
    summary: `[Heuristic Mode] Plan centered around: ${summary}`,
    tags: tags.length > 0 ? tags : ["idea", "insight"],
    reason: `Based on content analysis, this connects semantically to your thoughts in ${matchedCat ? matchedCat.name : "Personal Exploration"}.`,
    relatedThoughtIds,
    updatedCategoryConnections: matchedCatId === "cat-growth" ? ["cat-career"] : []
  };
}

// Endpoints
app.get("/api/galaxy", (req, res) => {
  const data = getOrCreateData();
  res.json({
    ...data,
    isGeminiActive: isGeminiConfigured || !!process.env.GEMINI_API_KEY
  });
});

app.post("/api/sync", (req, res) => {
  const clientData = req.body;
  const currentData = getOrCreateData();
  if (clientData && Array.isArray(clientData.thoughts) && clientData.thoughts.length > currentData.thoughts.length) {
    console.log("Syncing client-authored data securely onto the server.");
    saveData(clientData);
  }
  res.json({ success: true, count: clientData.thoughts ? clientData.thoughts.length : 0 });
});

app.post("/api/reset", (req, res) => {
  const pristineSeed = JSON.parse(JSON.stringify(SEED_DATA));
  saveData(pristineSeed);
  res.json({ success: true, message: "Galaxy reset to default seed constellations successfully.", data: pristineSeed });
});

app.delete("/api/thoughts/:id", (req, res) => {
  const { id } = req.params;
  const currentData = getOrCreateData();
  const index = currentData.thoughts.findIndex((t: any) => t.id === id);
  if (index !== -1) {
    const deletedThought = currentData.thoughts[index];
    const categoryId = deletedThought.categoryId;
    
    currentData.thoughts.splice(index, 1);
    
    // Clean up thought connections references
    currentData.thoughts.forEach((t: any) => {
      t.connections = t.connections.filter((cid: string) => cid !== id);
    });

    // Check if there are any remaining thoughts in this category
    const hasMoreThoughts = currentData.thoughts.some((t: any) => t.categoryId === categoryId);
    if (!hasMoreThoughts) {
      // Remove the category
      currentData.categories = currentData.categories.filter((c: any) => c.id !== categoryId);
      
      // Clean up connections reference between categories
      currentData.categories.forEach((c: any) => {
        if (c.connections) {
          c.connections = c.connections.filter((cid: string) => cid !== categoryId);
        }
      });
    }

    saveData(currentData);
    res.json({ success: true, thoughts: currentData.thoughts, categories: currentData.categories });
  } else {
    res.status(404).json({ error: "Thought not found" });
  }
});

app.post("/api/thoughts", async (req, res) => {
  const { text } = req.body;
  if (!text || text.trim() === "") {
    return res.status(400).json({ error: "Thought content must not be empty." });
  }

  const currentData = getOrCreateData();
  const ai = getGeminiClient();

  let analysis: any = null;

  if (ai) {
    try {
      const activeCategoriesPrompt = currentData.categories.map((c: any) => `- ID: "${c.id}", Name: "${c.name}", Description: "${c.description}"`).join("\n");
      const activeThoughtsPrompt = currentData.thoughts.map((t: any) => `- ID: "${t.id}", Text: "${t.text}", Category ID: "${t.categoryId}"`).join("\n");

      const prompt = `Analyze this user's starting thought: "${text}"

Here are the existing active Galaxy Categories:
${activeCategoriesPrompt}

Here are the existing active Thought nodes:
${activeThoughtsPrompt}

Determine if this new thought fits into one of the existing categories. If it does, return the matching categoryId.
If it is a completely new concept that doesn't fit elegantly under any existing category (such as health, business, travel, career, food, coding), set isNewCategory to true and suggest a beautiful new category. Try to keep categories high-level, elegant, and poetic (e.g. "Culinary Craft" or "Philosophical Inquiry" or "Home Sanctuary").

DO NOT force thoughts into existing categories. If the user's idea represents a distinct domain of life, a brand-new hobby, or a concept that does NOT fit seamlessly and naturally under one of the existing categories, you MUST set isNewCategory to true, setting a brand new ID like "cat-xxx" (e.g., "cat-gaming" or "cat-culinary") and defining a beautiful, poetic categoryName and categoryDescription. Be adventurous in seeding brand-new celestial hubs!

CRITICAL CLUSTERING & CLASSIFICATION RULES:
- Do NOT categorize thoughts based solely on keywords. Categorize thoughts based on the user's underlying intent, motivation, and semantic meaning.
- Act as a clustering engine rather than a static single-keyword classifier:
  1. Analyze the core purpose of the thought.
  2. Compare it against all existing categories and descriptions.
  3. Compare it against existing thoughts in the database (examine their content, semantic similarity, and themes).
  4. Determine the strongest semantic match to build a coherent, evolving knowledge graph.
  5. Suggest a beautiful, poetic new category only if the thought represents a distinct domain of life or a brand-new hobby that does not fit naturally within the existing ones, so as not to create categories that overlap heavily.
- If the thought discusses software development, a feature idea, building, tool design, web layout, backend/frontend engineering, coding tasks, toggle features, or specific database/app capabilities, it MUST be classified under "Career & Craft" (cat-career) or "Creative Projects" (cat-creative). It is FORBIDDEN to categorize these digital construction concepts into "Mind & Personal Growth" (cat-growth).
- "Mind & Personal Growth" (cat-growth) is strictly restricted to raw psychological introspection, sports fitness, marathon running, physical state, breathing/meditation routines, weightlifting, workouts, going to the gym, physical stamina/endurance, and existential wisdom/journaling. It is a severe system error to put gym, fitness, lifting, and workout thoughts anywhere other than "Mind & Personal Growth" (cat-growth).

Also segment this thought into a logical sub-category within its category (e.g., 'Projects' for active creative or career pursuits/tools, 'Aspirations' for future dreams or wishes, 'Expeditions' for travels, 'Daily Habits' for repetitive routines, or other logical sub-divisions). Set this in the 'subcategory' field. It should be short (1-2 words on average, like 'Projects' or 'Aspirations').

Generate a 1-sentence elegant AI summary, 2-4 lowercase tags, a poetic 'reason' explanation of why it belongs in that category.
Find up to 3 closely related thoughts in that category to draw constellation connector lines (return their exact thought IDs in relatedThoughtIds).
Also suggest which other categories are connected based on this thought (return their categoryIds in updatedCategoryConnections).

If isNewCategory is true, specify coordinates newCategoryCoords: { x, y } in range [-220 to 220]. Ensure it is spaced away from existing coordinate locations which are:
${currentData.categories.map((c: any) => `(${c.x}, ${c.y})`).join(", ")}

Return the response strictly inside a clean JSON object conforming EXACTLY to the following typescript schema:
{
  "categoryId": string,
  "categoryName": string,
  "categoryDescription": string,
  "isNewCategory": boolean,
  "subcategory": string,
  "summary": string,
  "tags": string[],
  "reason": string,
  "relatedThoughtIds": string[],
  "updatedCategoryConnections": string[],
  "newCategoryCoords"?: { "x": number, "y": number }
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              categoryId: { type: Type.STRING },
              categoryName: { type: Type.STRING },
              categoryDescription: { type: Type.STRING },
              isNewCategory: { type: Type.BOOLEAN },
              subcategory: { type: Type.STRING },
              summary: { type: Type.STRING },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              reason: { type: Type.STRING },
              relatedThoughtIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              updatedCategoryConnections: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              newCategoryCoords: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER }
                }
              }
            },
            required: ["categoryId", "categoryName", "categoryDescription", "isNewCategory", "subcategory", "summary", "tags", "reason", "relatedThoughtIds", "updatedCategoryConnections"]
          }
        }
      });

      const parsedText = response.text || "";
      console.log("Raw Gemini Output:", parsedText);
      analysis = JSON.parse(parsedText.trim());
    } catch (err) {
      console.error("Gemini failed to analyze thought, falling back to heuristic offline analyzer.", err);
      analysis = offlineAnalyzeThought(text, currentData);
    }
  } else {
    analysis = offlineAnalyzeThought(text, currentData);
  }

  // Apply changes to database
  const ideaId = "th-" + Math.random().toString(36).substr(2, 9);
  let finalCategoryId = analysis.categoryId;

  if (analysis.isNewCategory) {
    const exists = currentData.categories.some((c: any) => c.id === finalCategoryId || c.name.toLowerCase() === analysis.categoryName.toLowerCase());
    if (!exists) {
      finalCategoryId = analysis.categoryId || ("cat-" + Math.random().toString(36).substr(2, 9));
      const newX = analysis.newCategoryCoords?.x ?? (Math.random() * 400 - 200);
      const newY = analysis.newCategoryCoords?.y ?? (Math.random() * 400 - 200);
      
      const newCat = {
        id: finalCategoryId,
        name: analysis.categoryName,
        description: analysis.categoryDescription,
        createdAt: new Date().toISOString(),
        x: Math.round(newX),
        y: Math.round(newY),
        connections: analysis.updatedCategoryConnections || []
      };
      currentData.categories.push(newCat);
    } else {
      // Use existing category ID
      const existing = currentData.categories.find((c: any) => c.id === finalCategoryId || c.name.toLowerCase() === analysis.categoryName.toLowerCase());
      if (existing) {
        finalCategoryId = existing.id;
      }
    }
  } else {
    // If not new category, check if we need to update category connections
    const cat = currentData.categories.find((c: any) => c.id === finalCategoryId);
    if (cat && analysis.updatedCategoryConnections) {
      analysis.updatedCategoryConnections.forEach((cid: string) => {
        if (cid && cid !== finalCategoryId && !cat.connections.includes(cid)) {
          cat.connections.push(cid);
          // Bidirectional
          const target = currentData.categories.find((c: any) => c.id === cid);
          if (target && !target.connections.includes(finalCategoryId)) {
            target.connections.push(finalCategoryId);
          }
        }
      });
    }
  }

  // Segment thoughts belonging to the same subcategory inside this parent category
  const subName = analysis.subcategory || "Inspirations";
  const sisters = currentData.thoughts.filter((t: any) => t.categoryId === finalCategoryId);
  const sameSubSisters = sisters.filter((t: any) => (t.subcategory || "Inspirations").toLowerCase() === subName.toLowerCase());
  const sameSubCount = sameSubSisters.length;

  // Let's find a stable offset center for this subcategory using simple hash
  let hash = 0;
  const subNameLower = subName.toLowerCase();
  for (let charIdx = 0; charIdx < subNameLower.length; charIdx++) {
    hash = subNameLower.charCodeAt(charIdx) + ((hash << 5) - hash);
  }
  const stableAngle = Math.abs(hash % 360) * (Math.PI / 180);
  
  // Outer cluster centers are placed at radius 95 away from the parent sector center (0,0)
  const subCenterX = Math.round(Math.cos(stableAngle) * 95);
  const subCenterY = Math.round(Math.sin(stableAngle) * 95);

  // Individual thoughts within this subcategory spiral around their subcategory-center (subCenterX, subCenterY)
  const subAngle = (sameSubCount * 137.5) * (Math.PI / 180);
  const subRadius = 24 + (sameSubCount * 7); // tight, cohesive orbit
  const localX = Math.round(subCenterX + Math.cos(subAngle) * subRadius);
  const localY = Math.round(subCenterY + Math.sin(subAngle) * subRadius);

  const newThought = {
    id: ideaId,
    text,
    summary: analysis.summary,
    tags: analysis.tags || [],
    categoryId: finalCategoryId,
    subcategory: subName,
    createdAt: new Date().toISOString(),
    reason: analysis.reason,
    connections: analysis.relatedThoughtIds || [],
    x: localX,
    y: localY
  };

  currentData.thoughts.push(newThought);

  // Maintain bi-directional thought connection map inside that category
  if (analysis.relatedThoughtIds) {
    analysis.relatedThoughtIds.forEach((rid: string) => {
      const targetThought = currentData.thoughts.find((t: any) => t.id === rid);
      if (targetThought && !targetThought.connections.includes(ideaId)) {
        targetThought.connections.push(ideaId);
      }
    });
  }

  saveData(currentData);
  res.json({
    success: true,
    thought: newThought,
    categories: currentData.categories,
    thoughts: currentData.thoughts
  });
});

app.post("/api/insights", async (req, res) => {
  const currentData = getOrCreateData();
  const ai = getGeminiClient();

  if (!ai) {
    // Return offline mock insights based on simple rules
    const mostActiveCat = currentData.categories[0]?.name || "None";
    const insights = [
      {
        id: "ins-offline-1",
        title: "Active Core Horizon",
        content: `Your focal point is actively clustering in **${mostActiveCat}**. Integrating regular retrospectives here will accelerate your confidence.`,
        type: "focus",
        createdAt: new Date().toISOString()
      },
      {
        id: "ins-offline-2",
        title: "Emerging Connections",
        content: `Reflecting on all your **${currentData.thoughts.length} thoughts** reveals cohesive relationships bridging logical career habits with creative wanderlust.`,
        type: "connection",
        createdAt: new Date().toISOString()
      }
    ];
    currentData.insights = insights;
    saveData(currentData);
    return res.json({ success: true, insights });
  }

  try {
    const compactDataPrompt = currentData.thoughts.map((t: any) => {
      const catName = currentData.categories.find((c: any) => c.id === t.categoryId)?.name || "Unknown";
      return `- [${catName}] "${t.text}" (Tags: ${t.tags.join(", ")})`;
    }).join("\n");

    const prompt = `You are the Oracle of the Idea Galaxy. Look at the structured list of thoughts below and synthesize 2 to 3 profound trends, patterns, or emergent connections. Speak in an inspiring, poetic yet highly scientific language (Minimalist Cyber-Aviation theme). Avoid cliché.

Here is the user's mind map:
${compactDataPrompt}

Generate 2 to 3 insight items in a structured list. Deliver your response strictly inside a JSON array that has items with: "title", "content", and "type" (one of 'trend' | 'connection' | 'focus').
Example JSON Object structure to match:
{
  "insights": [
    {
      "title": "Title of insight",
      "content": "Sober, gorgeous, analytical yet poetic connection paragraph",
      "type": "trend"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  content: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["trend", "connection", "focus"] }
                },
                required: ["title", "content", "type"]
              }
            }
          },
          required: ["insights"]
        }
      }
    });

    const parsedText = response.text || "";
    const parsed = JSON.parse(parsedText.trim());
    const insights = parsed.insights.map((ins: any, index: number) => ({
      ...ins,
      id: "ins-" + Math.random().toString(36).substr(2, 9) + "-" + index,
      createdAt: new Date().toISOString()
    }));

    currentData.insights = insights;
    saveData(currentData);
    res.json({ success: true, insights });
  } catch (err) {
    console.error("Failed to generate custom insights via Gemini:", err);
    res.status(500).json({ error: "Could not generate insights" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Idea Galaxy full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
