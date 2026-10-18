import jsPDF from 'jspdf';
import confetti from 'canvas-confetti';
import { ConceptEdge, ConceptMapData, ConceptNode, ExportOptions, LayoutDirection } from '../types/conceptMap';
import { isLightBackground } from '../components/CustomNode';
import { calculateDagreLayout } from './dagreLayout';
import { extractYouTubeId } from './youtube';

export interface ExportResult {
  format: 'png' | 'pdf';
  filename: string;
  dataUrl: string;
  blob: Blob;
  blobUrl: string;
  width: number;
  height: number;
  fileSizeBytes: number;
}

export interface MediaLinkArea {
  nodeId: string;
  url: string;
  type: 'youtube' | 'cloudinary_image';
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Calculates bounding box of all nodes with generous framing padding
 */
export function calculateMapBoundingBox(nodes: ConceptNode[], padding = 90) {
  if (nodes.length === 0) {
    return { minX: 0, minY: 0, width: 1100, height: 750, maxX: 1100, maxY: 750 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodes.forEach((node) => {
    const nx = typeof node.x === 'number' && !isNaN(node.x) ? node.x : 100;
    const ny = typeof node.y === 'number' && !isNaN(node.y) ? node.y : 100;
    const nw = node.width ?? 300;
    const nh = node.height ?? 180;

    minX = Math.min(minX, nx);
    minY = Math.min(minY, ny);
    maxX = Math.max(maxX, nx + nw);
    maxY = Math.max(maxY, ny + nh);
  });

  if (!isFinite(minX) || !isFinite(minY)) {
    return { minX: 0, minY: 0, width: 1100, height: 750, maxX: 1100, maxY: 750 };
  }

  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(700, Math.ceil(maxX - minX)),
    height: Math.max(500, Math.ceil(maxY - minY)),
  };
}

/**
 * Triggers celebration confetti on export success
 */
export function fireCelebration() {
  try {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#38bdf8', '#60a5fa', '#34d399', '#f59e0b', '#c084fc'],
    });
  } catch (e) {
    console.debug('Confetti disabled', e);
  }
}

/**
 * Converts a Data URI (Base64) to a standard binary Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Download mechanism for iframe and desktop environments.
 * Uses a same-origin Blob URL, preventing Chrome's iframe data: URL block policy.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener noreferrer';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    if (link.parentNode) {
      link.parentNode.removeChild(link);
    }
    URL.revokeObjectURL(url);
  }, 3000);
}

/**
 * One-click copy image to system clipboard (PNG)
 */
export async function copyImageToClipboard(dataUrl: string): Promise<boolean> {
  try {
    const blob = dataUrlToBlob(dataUrl);
    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob,
        }),
      ]);
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Clipboard write failed:', err);
    return false;
  }
}

/**
 * Opens a generated Blob in a new tab for printing or manual saving
 */
export function openBlobInNewTab(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (link.parentNode) link.parentNode.removeChild(link);
    }, 1500);
  }
}

/**
 * Helper to wrap text inside a given width on Canvas 2D
 */
function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = ctx.measureText(testLine).width;

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

/**
 * Safely preloads an image with crossOrigin = 'anonymous'.
 * If CORS is permitted (e.g. Cloudinary, Unsplash), returns the image.
 * If CORS fails or times out, safely returns null to prevent tainting the canvas.
 */
async function preloadCorsImage(url: string): Promise<HTMLImageElement | null> {
  if (!url) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
    setTimeout(() => resolve(null), 3000);
  });
}

/**
 * Helper to draw an image inside a rounded rectangle with object-fit: cover
 */
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  radius = 8
) {
  ctx.save();
  ctx.beginPath();
  if (typeof (ctx as any).roundRect === 'function') {
    (ctx as any).roundRect(x, y, w, h, radius);
  } else {
    ctx.rect(x, y, w, h);
  }
  ctx.clip();

  const imgRatio = img.width / img.height;
  const targetRatio = w / h;
  let sWidth = img.width;
  let sHeight = img.height;
  let sx = 0;
  let sy = 0;

  if (imgRatio > targetRatio) {
    sWidth = img.height * targetRatio;
    sx = (img.width - sWidth) / 2;
  } else {
    sHeight = img.width / targetRatio;
    sy = (img.height - sHeight) / 2;
  }

  ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, w, h);
  ctx.restore();

  // Sleek border around image
  ctx.save();
  ctx.beginPath();
  if (typeof (ctx as any).roundRect === 'function') {
    (ctx as any).roundRect(x, y, w, h, radius);
  } else {
    ctx.rect(x, y, w, h);
  }
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

interface MeasuredNodeInfo {
  node: ConceptNode;
  width: number;
  height: number;
  titleLines: string[];
  descBlocks: { isBullet: boolean; lines: string[] }[];
  isCloudinaryImage: boolean;
  isYouTubeVideo: boolean;
  cleanDisplayUrl: string;
}

/**
 * DIRECT PURE HTML5 CANVAS 2D RENDERER (WITH CLOUDINARY IMAGES & YOUTUBE DIRECT LINKS)
 * - Renders visible high-resolution Cloudinary photos directly inside cards.
 * - Renders YouTube video reference cards with direct source URL link and PDF active hyperlink.
 * - Dynamic measured node auto-fit guarantees zero text overflow.
 */
export function renderConceptMapToCanvas2D(
  mapData: ConceptMapData,
  direction: LayoutDirection,
  options: ExportOptions,
  preloadedImages: Map<string, HTMLImageElement> = new Map()
): {
  canvas: HTMLCanvasElement;
  dataUrl: string;
  width: number;
  height: number;
  mediaLinks: MediaLinkArea[];
} {
  const scale = options.scale || 2;

  // 1. Offscreen measuring context for exact typography dimensions
  const measureCanvas = document.createElement('canvas');
  const mCtx = measureCanvas.getContext('2d')!;

  const measuredNodeMap = new Map<string, MeasuredNodeInfo>();
  const mediaLinks: MediaLinkArea[] = [];

  // 2. Measure exact dimensions for each node
  mapData.nodes.forEach((node) => {
    let width = node.width ?? 300;
    if (node.type === 'root') width = 340;
    else if (node.type === 'topic') width = 320;
    else if (node.type === 'subtopic') width = 300;
    else width = 330;

    // A. Title
    mCtx.font = 'bold 13.5px "Plus Jakarta Sans", system-ui, sans-serif';
    const cleanTitle = (node.label || '').replace(/<[^>]*>|\*\*/g, '');
    const titleLines = wrapCanvasText(mCtx, cleanTitle, width - 24);

    // B. Description Paragraphs & Bullets
    mCtx.font = '400 11px "Plus Jakarta Sans", system-ui, sans-serif';
    const descBlocks: { isBullet: boolean; lines: string[] }[] = [];

    if (node.description && node.description.trim()) {
      const rawParagraphs = node.description.split('\n');
      rawParagraphs.forEach((rLine) => {
        const trimmed = rLine.trim();
        if (!trimmed) return;
        const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ');
        const cleanDesc = trimmed.replace(/^[-•*]\s*/, '').replace(/<[^>]*>|\*\*/g, '');
        const maxLineWidth = isBullet ? width - 38 : width - 26;
        const wrapped = wrapCanvasText(mCtx, cleanDesc, maxLineWidth);
        descBlocks.push({ isBullet, lines: wrapped });
      });
    }

    // C. Media Check (Cloudinary Image vs YouTube Video)
    const hasMedia = !!(node.media && node.media.type !== 'none' && node.media.url);
    const isYouTube = hasMedia && (node.media.type === 'youtube_video' || node.media.url.includes('youtube'));
    const isCloudinary = hasMedia && !isYouTube;

    let cleanDisplayUrl = '';
    if (isYouTube) {
      const ytId = extractYouTubeId(node.media.url);
      cleanDisplayUrl = ytId ? `https://youtu.be/${ytId}` : node.media.url;
    } else if (isCloudinary) {
      cleanDisplayUrl = node.media.url;
    }

    // D. Compute EXACT total card height
    let exactHeight = 36; // top bar
    exactHeight += 12; // top padding
    exactHeight += titleLines.length * 19;
    exactHeight += 8;

    descBlocks.forEach((block) => {
      exactHeight += block.lines.length * 16.5;
      exactHeight += 4;
    });

    if (isCloudinary) {
      exactHeight += 185; // Image photo (135px) + caption + direct link pill
    } else if (isYouTube) {
      exactHeight += 115; // YouTube video card (header + caption + direct link pill)
    }

    exactHeight += 20; // bottom padding & anchor clearance

    const finalHeight = Math.max(160, Math.ceil(exactHeight));

    measuredNodeMap.set(node.id, {
      node,
      width,
      height: finalHeight,
      titleLines,
      descBlocks,
      isCloudinaryImage: isCloudinary,
      isYouTubeVideo: isYouTube,
      cleanDisplayUrl,
    });
  });

  // 3. Determine positioning: Preserve user custom canvas modifications or run Dagre
  const hasUserPositions =
    mapData.nodes.length > 0 &&
    mapData.nodes.every(
      (n) => typeof n.x === 'number' && !isNaN(n.x) && typeof n.y === 'number' && !isNaN(n.y)
    );

  const shouldPreserveCustom = options.layoutMode !== 'auto' && hasUserPositions;
  const spacingMultiplier = options.spacingMultiplier || 1.0;

  let positionedNodes: ConceptNode[];

  if (shouldPreserveCustom) {
    // PRESERVE USER'S EXACT MODIFICATIONS AND POSITIONS ON THE CANVAS
    positionedNodes = mapData.nodes.map((n) => {
      const m = measuredNodeMap.get(n.id);
      return {
        ...n,
        width: m ? m.width : (n.width ?? 300),
        height: m ? m.height : (n.height ?? 180),
        x: n.x,
        y: n.y,
      };
    });

    // If the user requested custom spacing expansion for printing:
    if (spacingMultiplier !== 1.0 && positionedNodes.length > 1) {
      let sumX = 0;
      let sumY = 0;
      positionedNodes.forEach((n) => {
        sumX += n.x ?? 0;
        sumY += n.y ?? 0;
      });
      const avgX = sumX / positionedNodes.length;
      const avgY = sumY / positionedNodes.length;

      positionedNodes = positionedNodes.map((n) => ({
        ...n,
        x: Math.round(avgX + ((n.x ?? 0) - avgX) * spacingMultiplier),
        y: Math.round(avgY + ((n.y ?? 0) - avgY) * spacingMultiplier),
      }));
    }
  } else {
    // Fallback or explicit auto-layout with Dagre
    const nodesForLayout: ConceptNode[] = mapData.nodes.map((n) => {
      const m = measuredNodeMap.get(n.id);
      return {
        ...n,
        width: m ? m.width : 300,
        height: m ? m.height : 180,
      };
    });

    positionedNodes = calculateDagreLayout(nodesForLayout, mapData.edges, {
      direction,
      nodeSep: Math.round(90 * spacingMultiplier),
      rankSep: Math.round(130 * spacingMultiplier),
    });
  }

  // 4. Calculate bounding box
  const bbox = calculateMapBoundingBox(positionedNodes, 90);
  const headerOffset = 90;
  const footerOffset = 40;

  const totalWidth = bbox.width;
  const totalHeight = bbox.height + headerOffset + footerOffset;

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(totalWidth * scale);
  canvas.height = Math.round(totalHeight * scale);

  const ctx = canvas.getContext('2d', { alpha: options.backgroundColor === 'transparent' });
  if (!ctx) {
    throw new Error('No se pudo inicializar el motor de renderizado Canvas 2D.');
  }

  ctx.scale(scale, scale);

  // Background Theme
  const bgTheme = options.backgroundColor || 'dark';
  let bgColor = '#0b1120';
  let dotColor = 'rgba(148, 163, 184, 0.22)';
  let isDark = true;

  if (bgTheme === 'white') {
    bgColor = '#f8fafc';
    dotColor = 'rgba(100, 116, 139, 0.22)';
    isDark = false;
  } else if (bgTheme === 'transparent') {
    bgColor = 'transparent';
    isDark = false;
  } else {
    bgColor = '#0b1120';
    dotColor = 'rgba(148, 163, 184, 0.22)';
    isDark = true;
  }

  // Draw background color and grid
  if (bgTheme !== 'transparent') {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, totalWidth, totalHeight);

    ctx.fillStyle = dotColor;
    const gridSize = 26;
    for (let x = gridSize / 2; x < totalWidth; x += gridSize) {
      for (let y = gridSize / 2; y < totalHeight; y += gridSize) {
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // 5. Draw Top Header Watermark Banner
  ctx.save();
  ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
  ctx.font = 'bold 22px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(mapData.mapTitle || 'Mapa Conceptual Dinámico', 36, 42);

  ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
  ctx.font = '500 12.5px "Plus Jakarta Sans", system-ui, sans-serif';
  const now = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const statsLine = `ConceptMap Studio • ${positionedNodes.length} Nodos • ${mapData.edges.length} Conexiones Jerárquicas • ${now}`;
  ctx.fillText(statsLine, 36, 64);

  // Divider line
  ctx.strokeStyle = isDark ? 'rgba(51, 65, 85, 0.8)' : 'rgba(203, 213, 225, 0.8)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(36, 76);
  ctx.lineTo(totalWidth - 36, 76);
  ctx.stroke();
  ctx.restore();

  // Helper coordinate mapper
  const getNodeWorld = (nodeId: string) => {
    const node = positionedNodes.find((n) => n.id === nodeId);
    const m = measuredNodeMap.get(nodeId);
    const w = m ? m.width : (node?.width ?? 300);
    const h = m ? m.height : (node?.height ?? 180);

    return {
      x: (node?.x ?? 0) - bbox.minX,
      y: (node?.y ?? 0) - bbox.minY + headerOffset,
      w,
      h,
    };
  };

  // 6. Draw Connecting Edges
  mapData.edges.forEach((edge) => {
    const sNode = positionedNodes.find((n) => n.id === edge.source);
    const tNode = positionedNodes.find((n) => n.id === edge.target);
    if (!sNode || !tNode) return;

    const s = getNodeWorld(sNode.id);
    const t = getNodeWorld(tNode.id);

    let startX = s.x + s.w / 2;
    let startY = s.y + s.h / 2;
    let endX = t.x + t.w / 2;
    let endY = t.y + t.h / 2;

    if (direction === 'TB') {
      const dy = endY - startY;
      if (dy >= 0) {
        startY = s.y + s.h; // Connects cleanly from bottom of expanded card
        endY = t.y;
      } else {
        startY = s.y;
        endY = t.y + t.h;
      }
    } else {
      const dx = endX - startX;
      if (dx >= 0) {
        startX = s.x + s.w;
        endX = t.x;
      } else {
        startX = s.x;
        endX = t.x + t.w;
      }
    }

    let cp1x = startX;
    let cp1y = startY;
    let cp2x = endX;
    let cp2y = endY;

    if (direction === 'TB') {
      const curvature = Math.max(45, Math.abs(endY - startY) * 0.45);
      cp1y = startY + curvature;
      cp2y = endY - curvature;
    } else {
      const curvature = Math.max(45, Math.abs(endX - startX) * 0.45);
      cp1x = startX + curvature;
      cp2x = endX - curvature;
    }

    const midX = 0.125 * startX + 0.375 * cp1x + 0.375 * cp2x + 0.125 * endX;
    const midY = 0.125 * startY + 0.375 * cp1y + 0.375 * cp2y + 0.125 * endY;

    const mainStroke = isDark ? '#38bdf8' : '#2563eb';
    const haloStroke = isDark ? '#020617' : '#ffffff';

    ctx.save();
    // Halo
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
    ctx.strokeStyle = haloStroke;
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Main line
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
    ctx.strokeStyle = mainStroke;
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Arrowhead
    const angle = Math.atan2(endY - cp2y, endX - cp2x);
    const arrowLen = 14;
    const arrowWidth = 6.5;

    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - arrowLen * Math.cos(angle) + arrowWidth * Math.sin(angle),
      endY - arrowLen * Math.sin(angle) - arrowWidth * Math.cos(angle)
    );
    ctx.lineTo(
      endX - arrowLen * Math.cos(angle) - arrowWidth * Math.sin(angle),
      endY - arrowLen * Math.sin(angle) + arrowWidth * Math.cos(angle)
    );
    ctx.closePath();
    ctx.fillStyle = mainStroke;
    ctx.fill();
    ctx.strokeStyle = haloStroke;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Relation badge
    const label = edge.relationLabel?.trim() || '+';
    ctx.font = 'bold 11px "Plus Jakarta Sans", system-ui, sans-serif';
    const textMetrics = ctx.measureText(label);
    const badgeW = Math.max(86, textMetrics.width + 24);
    const badgeH = 26;
    const badgeX = midX - badgeW / 2;
    const badgeY = midY - badgeH / 2;

    ctx.beginPath();
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(badgeX, badgeY, badgeW, badgeH, 13);
    } else {
      ctx.rect(badgeX, badgeY, badgeW, badgeH);
    }
    ctx.fillStyle = isDark ? '#020617' : '#ffffff';
    ctx.fill();
    ctx.strokeStyle = mainStroke;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = isDark ? '#e0f2fe' : '#1e3a8a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, midX, midY + 0.5);
    ctx.restore();
  });

  // 7. Draw Concept Nodes
  positionedNodes.forEach((node) => {
    const { x, y, w, h } = getNodeWorld(node.id);
    const m = measuredNodeMap.get(node.id);
    const isLight = isLightBackground(node.style.backgroundColor);

    ctx.save();

    // Drop Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 6;

    // Node Card Body
    ctx.beginPath();
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(x, y, w, h, 14);
    } else {
      ctx.rect(x, y, w, h);
    }
    ctx.fillStyle = node.style.backgroundColor || (isDark ? '#1e293b' : '#ffffff');
    ctx.fill();

    // Border
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = node.style.borderColor || '#3b82f6';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Top Header Bar
    ctx.beginPath();
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(x, y, w, 36, [14, 14, 0, 0]);
    } else {
      ctx.rect(x, y, w, 36);
    }
    ctx.fillStyle = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.35)';
    ctx.fill();

    // Emoji icon
    ctx.font = '18px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.emoji || '📌', x + 10, y + 18);

    // Hierarchy Level Badge Pill
    const badgeLabel = {
      root: 'RAÍZ PRINCIPAL',
      topic: 'RAMA PRINCIPAL',
      subtopic: 'SUBTEMA',
      detail: 'DETALLE / CASO',
    }[node.type] || 'TEMA';

    ctx.font = 'bold 9px "Plus Jakarta Sans", system-ui, sans-serif';
    const badgeTextW = ctx.measureText(badgeLabel).width;
    const bPillW = badgeTextW + 14;
    const bPillH = 18;
    const bPillX = x + 38;
    const bPillY = y + 9;

    ctx.beginPath();
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(bPillX, bPillY, bPillW, bPillH, 9);
    } else {
      ctx.rect(bPillX, bPillY, bPillW, bPillH);
    }
    ctx.fillStyle = isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.15)';
    ctx.fill();
    ctx.strokeStyle = isLight ? '#94a3b8' : 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = isLight ? '#1e293b' : '#f8fafc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeLabel, bPillX + bPillW / 2, bPillY + bPillH / 2 + 0.5);

    // Concept Title
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 13.5px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillStyle = node.style.textColor || (isLight ? '#0f172a' : '#ffffff');

    let curY = y + 46;
    if (m && m.titleLines) {
      m.titleLines.forEach((tLine) => {
        ctx.fillText(tLine, x + 12, curY);
        curY += 19;
      });
    }

    curY += 6;

    // Description Blocks & Bullets
    ctx.font = '400 11px "Plus Jakarta Sans", system-ui, sans-serif';
    const bodyColor = isLight ? '#334155' : '#e2e8f0';
    const bulletColor = isLight ? '#2563eb' : '#38bdf8';

    if (m && m.descBlocks) {
      m.descBlocks.forEach((block) => {
        block.lines.forEach((wLine, lineIdx) => {
          if (block.isBullet && lineIdx === 0) {
            ctx.fillStyle = bulletColor;
            ctx.font = 'bold 13px sans-serif';
            ctx.fillText('•', x + 12, curY - 1);
            ctx.font = '400 11px "Plus Jakarta Sans", system-ui, sans-serif';
          }
          ctx.fillStyle = bodyColor;
          ctx.fillText(wLine, x + (block.isBullet ? 24 : 12), curY);
          curY += 16.5;
        });
        curY += 4;
      });
    }

    // MULTIMEDIA SECTION: CLOUDINARY IMAGES (VISIBLE PHOTO) & YOUTUBE (DIRECT LINK)
    if (m && m.isCloudinaryImage && node.media.url) {
      curY += 6;
      const imgW = w - 24;
      const imgH = 130;
      const loadedImg = preloadedImages.get(node.id);

      // Draw the visible photo if preloaded
      if (loadedImg) {
        drawImageCover(ctx, loadedImg, x + 12, curY, imgW, imgH, 8);
      } else {
        // Fallback photo placeholder
        ctx.beginPath();
        if (typeof (ctx as any).roundRect === 'function') {
          (ctx as any).roundRect(x + 12, curY, imgW, imgH, 8);
        } else {
          ctx.rect(x + 12, curY, imgW, imgH);
        }
        ctx.fillStyle = '#064e3b';
        ctx.fill();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🖼️ Imagen Cloudinary', x + 12 + imgW / 2, curY + imgH / 2 - 10);
      }

      // Top badge overlay on image
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.beginPath();
      if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(x + 18, curY + 6, 120, 20, 4);
      } else {
        ctx.rect(x + 18, curY + 6, 120, 20);
      }
      ctx.fill();
      ctx.fillStyle = '#6ee7b7';
      ctx.font = 'bold 9.5px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('🖼️ Cloudinary / Foto', x + 24, curY + 16);

      // Caption bar
      if (node.media.caption) {
        ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
        ctx.fillRect(x + 12, curY + imgH - 24, imgW, 24);
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'italic 10px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const capText = node.media.caption.length > 38 ? `${node.media.caption.slice(0, 36)}…` : node.media.caption;
        ctx.fillText(capText, x + 20, curY + imgH - 12);
      }

      curY += imgH + 6;

      // Direct Access Link Pill below image
      const linkBoxH = 26;
      ctx.beginPath();
      if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(x + 12, curY, imgW, linkBoxH, 6);
      } else {
        ctx.rect(x + 12, curY, imgW, linkBoxH);
      }
      ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(241, 245, 249, 0.95)';
      ctx.fill();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = isDark ? '#34d399' : '#059669';
      ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('🔗 Ver recurso original en la fuente', x + 22, curY + linkBoxH / 2);

      // Record for PDF active hyperlink
      mediaLinks.push({
        nodeId: node.id,
        url: node.media.url,
        type: 'cloudinary_image',
        x: x + 12,
        y: curY - imgH - 6,
        w: imgW,
        h: imgH + linkBoxH + 6,
      });

      curY += linkBoxH;
    } else if (m && m.isYouTubeVideo && node.media.url) {
      // YOUTUBE VIDEO CARD WITH DIRECT SOURCE LINK
      curY += 6;
      const videoCardW = w - 24;
      const videoCardH = 92;

      ctx.save();
      // Outer video container
      ctx.beginPath();
      if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(x + 12, curY, videoCardW, videoCardH, 8);
      } else {
        ctx.rect(x + 12, curY, videoCardW, videoCardH);
      }
      ctx.fillStyle = isDark ? '#18121e' : '#fdf2f2';
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // YouTube red top pill
      ctx.beginPath();
      if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(x + 20, curY + 10, 140, 22, 11);
      } else {
        ctx.rect(x + 20, curY + 10, 140, 22);
      }
      ctx.fillStyle = '#dc2626';
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10.5px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('▶ Video en YouTube', x + 90, curY + 21);

      // Caption
      const videoCap = node.media.caption || 'Explicación multimedia del concepto';
      ctx.fillStyle = isDark ? '#e2e8f0' : '#334155';
      ctx.font = '500 10px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        videoCap.length > 36 ? `${videoCap.slice(0, 34)}…` : videoCap,
        x + 20,
        curY + 44
      );

      // Direct Clickable URL Box
      const urlBoxY = curY + 58;
      const urlBoxH = 24;
      ctx.beginPath();
      if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(x + 20, urlBoxY, videoCardW - 16, urlBoxH, 6);
      } else {
        ctx.rect(x + 20, urlBoxY, videoCardW - 16, urlBoxH);
      }
      ctx.fillStyle = isDark ? '#020617' : '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const displayUrlText = `🔗 ${m.cleanDisplayUrl}`;
      ctx.fillText(
        displayUrlText.length > 34 ? `${displayUrlText.slice(0, 32)}…` : displayUrlText,
        x + 26,
        urlBoxY + urlBoxH / 2
      );

      ctx.restore();

      // Record for PDF active hyperlink
      mediaLinks.push({
        nodeId: node.id,
        url: node.media.url,
        type: 'youtube',
        x: x + 12,
        y: curY,
        w: videoCardW,
        h: videoCardH,
      });

      curY += videoCardH;
    }

    // Anchor Connection Dots
    const dotRad = 3.5;
    const anchorColor = '#38bdf8';
    const anchorStroke = '#0f172a';

    const anchors = [
      { ax: x + w / 2, ay: y },
      { ax: x + w / 2, ay: y + h },
      { ax: x, ay: y + h / 2 },
      { ax: x + w, ay: y + h / 2 },
    ];

    anchors.forEach(({ ax, ay }) => {
      ctx.beginPath();
      ctx.arc(ax, ay, dotRad, 0, Math.PI * 2);
      ctx.fillStyle = anchorColor;
      ctx.fill();
      ctx.strokeStyle = anchorStroke;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    });

    ctx.restore();
  });

  return {
    canvas,
    dataUrl: canvas.toDataURL('image/png', 1.0),
    width: totalWidth,
    height: totalHeight,
    mediaLinks,
  };
}

/**
 * High-fidelity diagram capture engine with image preloading.
 * Preloads all Cloudinary and external images with CORS so they are rendered as visible photos.
 */
export async function captureConceptMapDataUrl(
  mapData: ConceptMapData,
  direction: LayoutDirection,
  options: ExportOptions
): Promise<{
  dataUrl: string;
  width: number;
  height: number;
  mediaLinks: MediaLinkArea[];
}> {
  // Preload all media images safely with CORS
  const imageMap = new Map<string, HTMLImageElement>();
  await Promise.all(
    mapData.nodes.map(async (node) => {
      if (node.media && node.media.url) {
        const isYt = node.media.type === 'youtube_video' || node.media.url.includes('youtube');
        if (!isYt) {
          const img = await preloadCorsImage(node.media.url);
          if (img) {
            imageMap.set(node.id, img);
          }
        }
      }
    })
  );

  const result = renderConceptMapToCanvas2D(mapData, direction, options, imageMap);

  return {
    dataUrl: result.dataUrl,
    width: result.width,
    height: result.height,
    mediaLinks: result.mediaLinks,
  };
}

/**
 * Exports entire concept map to high-resolution PNG image
 */
export async function exportConceptMapToPng(
  mapData: ConceptMapData,
  direction: LayoutDirection,
  options: ExportOptions
): Promise<ExportResult> {
  const { dataUrl, width, height } = await captureConceptMapDataUrl(mapData, direction, options);
  const blob = dataUrlToBlob(dataUrl);

  const sanitizedTitle = (mapData.mapTitle || 'mapa_conceptual')
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, '_');
  const filename = `${sanitizedTitle}_${Date.now()}.png`;

  downloadBlob(blob, filename);
  fireCelebration();

  return {
    format: 'png',
    filename,
    dataUrl,
    blob,
    blobUrl: URL.createObjectURL(blob),
    width,
    height,
    fileSizeBytes: blob.size,
  };
}

/**
 * Exports entire concept map to professional PDF document with active hyperlinks
 */
export async function exportConceptMapToPdf(
  mapData: ConceptMapData,
  direction: LayoutDirection,
  options: ExportOptions
): Promise<ExportResult> {
  const orientation = options.pageOrientation || 'landscape';
  const format = options.pageSize || 'a4';
  const bg = options.backgroundColor === 'white' ? 'white' : 'dark';

  const { dataUrl, width: diagramWidth, height: diagramHeight, mediaLinks } = await captureConceptMapDataUrl(
    mapData,
    direction,
    {
      ...options,
      backgroundColor: bg,
      scale: 2,
    }
  );

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const marginX = 12;
  const headerHeight = 22;
  const footerHeight = 12;

  const isDark = bg === 'dark';
  if (isDark) {
    pdf.setFillColor(11, 17, 32); // deep slate
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  } else {
    pdf.setFillColor(248, 250, 252); // light slate paper
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  }

  // Header Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(isDark ? 248 : 15, isDark ? 250 : 23, isDark ? 252 : 42);
  pdf.text(mapData.mapTitle || 'Mapa Conceptual Dinámico', marginX, 12);

  // Subtitle / Date
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(isDark ? 148 : 100, isDark ? 163 : 116, isDark ? 184 : 139);
  const now = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  pdf.text(
    `ConceptMap Studio • ${now} • ${mapData.nodes.length} Nodos • ${mapData.edges.length} Relaciones • Enlaces interactivos`,
    marginX,
    17
  );

  // Divider line
  pdf.setDrawColor(isDark ? 51 : 203, isDark ? 65 : 213, isDark ? 85 : 225);
  pdf.setLineWidth(0.3);
  pdf.line(marginX, 19, pageWidth - marginX, 19);

  // Calculate available dimensions for diagram
  const availWidth = pageWidth - marginX * 2;
  const availHeight = pageHeight - headerHeight - footerHeight;

  // Load image to get original aspect ratio
  const img = new Image();
  img.src = dataUrl;
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });

  const imgAspect = img.width / img.height;
  let renderWidth = availWidth;
  let renderHeight = renderWidth / imgAspect;

  if (renderHeight > availHeight) {
    renderHeight = availHeight;
    renderWidth = renderHeight * imgAspect;
  }

  // Centering on page
  const posX = marginX + (availWidth - renderWidth) / 2;
  const posY = headerHeight + (availHeight - renderHeight) / 2;

  pdf.addImage(dataUrl, 'PNG', posX, posY, renderWidth, renderHeight, undefined, 'FAST');

  // Scale factor between Canvas coordinate space and PDF mm space
  const scaleFactor = renderWidth / diagramWidth;

  // Add real, clickable hyperlinks for all YouTube videos and Cloudinary resources
  if (mediaLinks && mediaLinks.length > 0) {
    mediaLinks.forEach((ml) => {
      const linkPdfX = posX + ml.x * scaleFactor;
      const linkPdfY = posY + ml.y * scaleFactor;
      const linkPdfW = ml.w * scaleFactor;
      const linkPdfH = ml.h * scaleFactor;

      // jsPDF active link
      pdf.link(linkPdfX, linkPdfY, linkPdfW, linkPdfH, { url: ml.url });
    });
  }

  // Footer
  pdf.setFontSize(7.5);
  pdf.setTextColor(isDark ? 100 : 120, isDark ? 116 : 130, isDark ? 139 : 140);
  pdf.text(
    'ConceptMap Studio | Los enlaces a videos y recursos multimedia son interactivos (clic para abrir)',
    marginX,
    pageHeight - 6
  );
  pdf.text('Página 1 de 1', pageWidth - marginX - 16, pageHeight - 6);

  const sanitizedTitle = (mapData.mapTitle || 'mapa_conceptual')
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, '_');
  const filename = `${sanitizedTitle}_${Date.now()}.pdf`;

  const pdfBlob = pdf.output('blob');
  downloadBlob(pdfBlob, filename);
  fireCelebration();

  return {
    format: 'pdf',
    filename,
    dataUrl,
    blob: pdfBlob,
    blobUrl: URL.createObjectURL(pdfBlob),
    width: Math.round(pageWidth * 3.78),
    height: Math.round(pageHeight * 3.78),
    fileSizeBytes: pdfBlob.size,
  };
}
