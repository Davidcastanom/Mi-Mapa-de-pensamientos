import dagre from 'dagre';
import { ConceptEdge, ConceptNode, LayoutDirection } from '../types/conceptMap';

export interface LayoutOptions {
  direction?: LayoutDirection;
  nodeSep?: number;
  rankSep?: number;
}

/**
 * Calculates accurate dimensions for a node card based on its full wrapped text content & media.
 * Guarantees that Dagre provides adequate vertical and horizontal clearance so no nodes collide.
 */
export function estimateNodeDimensions(node: ConceptNode): { width: number; height: number } {
  let width = 300;
  if (node.type === 'root') width = 340;
  else if (node.type === 'topic') width = 320;
  else if (node.type === 'subtopic') width = 300;
  else width = 330;

  // Header bar: 36px + top padding: 12px
  let height = 48;

  // Title lines calculation (bold 13.5px font, approx 28-30 chars per line)
  const cleanTitle = (node.label || '').replace(/<[^>]*>|\*\*/g, '');
  const titleCharsPerLine = Math.max(20, Math.floor((width - 24) / 10));
  const titleLines = Math.max(1, Math.ceil(cleanTitle.length / titleCharsPerLine));
  height += titleLines * 20 + 8;

  // Description lines calculation (11px font, approx 34-36 chars per line)
  if (node.description && node.description.trim()) {
    const rawParagraphs = node.description.split('\n');
    const descCharsPerLine = Math.max(22, Math.floor((width - 38) / 7.5));
    let totalWrappedLines = 0;

    rawParagraphs.forEach((p) => {
      const trimmed = p.trim();
      if (!trimmed) return;
      const cleanLine = trimmed.replace(/^[-•*]\s*/, '').replace(/<[^>]*>|\*\*/g, '');
      const wrapped = Math.max(1, Math.ceil(cleanLine.length / descCharsPerLine));
      totalWrappedLines += wrapped;
    });

    height += totalWrappedLines * 18 + rawParagraphs.length * 4;
  }

  // Media preview (Cloudinary image vs YouTube video)
  if (node.media && node.media.type !== 'none' && node.media.url) {
    if (node.media.type === 'cloudinary_image' || !node.media.url.includes('youtube')) {
      height += 185; // Full visible image photo (135px) + caption + direct link pill
    } else {
      height += 115; // YouTube video player card + direct link pill
    }
  }

  // Bottom padding & anchor dot margin
  height += 24;

  return {
    width,
    height: Math.max(160, Math.ceil(height)),
  };
}

/**
 * Computes hierarchical positions for nodes and edges using Dagre with generous separation
 */
export function calculateDagreLayout(
  nodes: ConceptNode[],
  edges: ConceptEdge[],
  options: LayoutOptions = {}
): ConceptNode[] {
  const { direction = 'TB', nodeSep = 80, rankSep = 115 } = options;

  if (nodes.length === 0) return [];

  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: direction,
    nodesep: nodeSep,
    ranksep: rankSep,
    align: 'DL',
    marginx: 80,
    marginy: 80,
  });
  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes to dagre graph with exact estimated dimensions
  nodes.forEach((node) => {
    const { width, height } = estimateNodeDimensions(node);
    g.setNode(node.id, { width, height });
  });

  // Add edges to dagre graph
  edges.forEach((edge) => {
    if (nodes.some((n) => n.id === edge.source) && nodes.some((n) => n.id === edge.target)) {
      g.setEdge(edge.source, edge.target);
    }
  });

  // Execute dagre layout algorithm
  dagre.layout(g);

  // Return nodes with updated calculated positions
  return nodes.map((node) => {
    const dagreNode = g.node(node.id);
    const { width, height } = estimateNodeDimensions(node);

    if (dagreNode) {
      return {
        ...node,
        x: Math.round(dagreNode.x - width / 2),
        y: Math.round(dagreNode.y - height / 2),
        width,
        height,
      };
    }

    return {
      ...node,
      x: node.x ?? 100,
      y: node.y ?? 100,
      width,
      height,
    };
  });
}
