export type NodeType = 'root' | 'topic' | 'subtopic' | 'detail';

export type MediaType = 'none' | 'cloudinary_image' | 'youtube_video';

export interface NodeMedia {
  type: MediaType;
  url: string;
  caption?: string;
}

export interface NodeStyle {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
}

export interface ConceptNode {
  id: string;
  type: NodeType;
  label: string;
  description: string;
  emoji: string;
  media: NodeMedia;
  style: NodeStyle;
  // Canvas coordinate positions
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface ConceptEdge {
  id: string;
  source: string;
  target: string;
  relationLabel: string;
}

export interface ConceptMapData {
  mapTitle: string;
  rootNodeId: string;
  nodes: ConceptNode[];
  edges: ConceptEdge[];
}

export type LayoutDirection = 'TB' | 'LR' | 'BT' | 'RL';

export interface ExportOptions {
  format: 'png' | 'pdf';
  scale: 1 | 2 | 3;
  backgroundColor: 'dark' | 'white' | 'transparent';
  pageOrientation?: 'landscape' | 'portrait';
  pageSize?: 'a4' | 'letter';
  includeHeaderFooter?: boolean;
  layoutMode?: 'custom' | 'auto';
  spacingMultiplier?: number;
}
