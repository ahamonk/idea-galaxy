export interface Thought {
  id: string;
  text: string;
  summary: string;
  tags: string[];
  categoryId: string;
  subcategory?: string; // e.g. "Projects", "Aspirations"
  createdAt: string;
  reason: string;
  connections: string[]; // IDs of related thoughts within the same category
  x: number; // local constellation x position (-200 to 200)
  y: number; // local constellation y position (-200 to 200)
  thoughtAngle?: number; // computed angle for smart star text labels
}

export interface Category {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  x: number; // global galaxy x position (-250 to 250)
  y: number; // global galaxy y position (-250 to 250)
  connections: string[]; // IDs of related categories
}

export interface Insight {
  id: string;
  title: string;
  content: string;
  type: 'trend' | 'connection' | 'focus';
  createdAt: string;
}

export interface GalaxyData {
  categories: Category[];
  thoughts: Thought[];
  insights: Insight[];
}
