import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  ArrowDownCircle,
  ArrowRightCircle,
  Compass,
  Edit3,
  Trash2,
  X,
  Check,
  Eye,
  Sliders,
  Sparkles,
  Focus,
  GitBranch,
  Link2
} from 'lucide-react';
import { ConceptEdge, ConceptNode, LayoutDirection } from '../types/conceptMap';
import { CustomNode } from './CustomNode';
import { calculateMapBoundingBox } from '../utils/exportUtils';
import { PastelShade } from './Header';

interface CanvasProps {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
  selectedNodeId: string | null;
  direction: LayoutDirection;
  themeMode: 'dark' | 'light';
  pastelShade?: PastelShade;
  onSelectNode: (nodeId: string | null) => void;
  onEditNode: (node: ConceptNode) => void;
  onAddChildNode: (parentNodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onOpenMedia: (node: ConceptNode) => void;
  onInspectNode: (node: ConceptNode) => void;
  onUpdateNodePosition: (nodeId: string, x: number, y: number) => void;
  onUpdateEdgeRelation: (edgeId: string, newRelation: string) => void;
  onDeleteEdge: (edgeId: string) => void;
  onTriggerLayout: (dir: LayoutDirection) => void;
  onResetToDefault?: () => void;
  onReassignParentNode?: (nodeId: string, newParentId: string | null, newRelationLabel?: string) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  nodes,
  edges,
  selectedNodeId,
  direction,
  themeMode,
  pastelShade = 'linen',
  onSelectNode,
  onEditNode,
  onAddChildNode,
  onDeleteNode,
  onOpenMedia,
  onInspectNode,
  onUpdateNodePosition,
  onUpdateEdgeRelation,
  onDeleteEdge,
  onTriggerLayout,
  onResetToDefault,
  onReassignParentNode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Transform states
  const [zoom, setZoom] = useState<number>(0.75);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 80, y: 60 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Quick Reconnection Dialog state ("editar el punto de donde se encuentra a otro punto")
  const [reconnectingNode, setReconnectingNode] = useState<ConceptNode | null>(null);
  const [targetParentId, setTargetParentId] = useState<string>('');
  const [targetRelation, setTargetRelation] = useState<string>('se fundamenta en');

  // Line Visibility Preferences
  const [lineThickness, setLineThickness] = useState<'normal' | 'thick' | 'ultra'>('thick');
  const [lineGlow, setLineGlow] = useState<boolean>(true);
  const [lineRouting, setLineRouting] = useState<'bezier' | 'orthogonal' | 'straight'>('bezier');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Node Dragging state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [nodeDragOffset, setNodeDragOffset] = useState<{ offsetX: number; offsetY: number }>({
    offsetX: 0,
    offsetY: 0,
  });
  const [dragMoved, setDragMoved] = useState<boolean>(false);

  // Editing Edge label
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);
  const [editingEdgeLabel, setEditingEdgeLabel] = useState<string>('');

  // Stable reference to nodes so fitView doesn't re-create or trigger auto-center on every position update
  const nodesRef = useRef<ConceptNode[]>(nodes);
  nodesRef.current = nodes;

  // Auto-fit to view with safe fallback dimensions (stable callback)
  const fitView = useCallback(() => {
    const currentNodes = nodesRef.current;
    if (!containerRef.current || currentNodes.length === 0) return;
    const container = containerRef.current;
    const { minX, minY, width, height } = calculateMapBoundingBox(currentNodes, 80);

    const containerWidth = container.clientWidth || window.innerWidth || 1200;
    const containerHeight = container.clientHeight || window.innerHeight || 800;

    if (containerWidth <= 120 || containerHeight <= 120) return;

    const scaleX = (containerWidth - 140) / width;
    const scaleY = (containerHeight - 140) / height;
    const newZoom = Math.min(1.0, Math.max(0.28, Math.min(scaleX, scaleY)));

    const newPanX = (containerWidth - width * newZoom) / 2 - minX * newZoom;
    const newPanY = (containerHeight - height * newZoom) / 2 - minY * newZoom;

    setZoom(+newZoom.toFixed(2));
    setPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
  }, []);

  // Track if initial fit was completed once on mount (NEVER recenter automatically during node editing or dragging)
  const hasInitiallyFittedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!hasInitiallyFittedRef.current && nodes.length > 0) {
      hasInitiallyFittedRef.current = true;
      const timer = setTimeout(() => {
        fitView();
      }, 70);
      return () => clearTimeout(timer);
    }
  }, [nodes.length, fitView]);

  // Requirement 8: Completely Linear Zoom strictly locked at the exact Center of Viewport
  // (Prevents any sideways drift or deviation to a corner when scrolling wheel)
  const applyLinearCenterZoom = useCallback(
    (delta: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const nextZoom = +Math.min(2.5, Math.max(0.2, zoom + delta)).toFixed(2);
      if (nextZoom === zoom) return;

      // World point currently at the exact center of the screen
      const worldCenterX = (centerX - pan.x) / zoom;
      const worldCenterY = (centerY - pan.y) / zoom;

      // Recalculate pan so that the center of the screen remains strictly identical
      const newPanX = Math.round(centerX - worldCenterX * nextZoom);
      const newPanY = Math.round(centerY - worldCenterY * nextZoom);

      setZoom(nextZoom);
      setPan({ x: newPanX, y: newPanY });
    },
    [pan, zoom]
  );

  // Zoom In button (centered)
  const handleZoomIn = () => {
    applyLinearCenterZoom(0.12);
  };

  // Zoom Out button (centered)
  const handleZoomOut = () => {
    applyLinearCenterZoom(-0.12);
  };

  const handleResetZoom = () => {
    setZoom(1);
    if (nodes.length > 0) {
      fitView();
    } else {
      setPan({ x: 100, y: 80 });
    }
  };

  // Requirement 8: Mouse Wheel zoom handler - strictly linear and centered
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    // Step is linear: ±0.06 per wheel step
    const step = -Math.sign(e.deltaY) * 0.06;
    applyLinearCenterZoom(step);
  };

  // Background Pan Start
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg') {
      setIsPanning(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      onSelectNode(null);
    }
  };

  // Node Drag Start
  const handleNodeDragStart = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const targetNode = nodes.find((n) => n.id === nodeId);
    if (!targetNode) return;

    onSelectNode(nodeId);
    setDraggingNodeId(nodeId);
    setDragMoved(false);

    const mouseWorldX = (e.clientX - pan.x) / zoom;
    const mouseWorldY = (e.clientY - pan.y) / zoom;

    setNodeDragOffset({
      offsetX: mouseWorldX - (targetNode.x ?? 0),
      offsetY: mouseWorldY - (targetNode.y ?? 0),
    });
  };

  // Mouse Move (Handles Pan and Node Drag)
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    } else if (draggingNodeId) {
      setDragMoved(true);
      const mouseWorldX = (e.clientX - pan.x) / zoom;
      const mouseWorldY = (e.clientY - pan.y) / zoom;

      const newX = Math.round(mouseWorldX - nodeDragOffset.offsetX);
      const newY = Math.round(mouseWorldY - nodeDragOffset.offsetY);

      onUpdateNodePosition(draggingNodeId, newX, newY);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  // Stroke width mapping for high visibility
  const strokeWidths = {
    normal: { base: 3.5, halo: 8 },
    thick: { base: 5, halo: 10 },
    ultra: { base: 7, halo: 14 },
  }[lineThickness];

  // Helper to compute anchor coords and curved paths between two nodes
  const calculateEdgePath = (sourceNode: ConceptNode, targetNode: ConceptNode) => {
    const sw = sourceNode.width ?? 300;
    const sh = sourceNode.height ?? 150;
    const tw = targetNode.width ?? 300;
    const th = targetNode.height ?? 150;

    const sx = sourceNode.x ?? 0;
    const sy = sourceNode.y ?? 0;
    const tx = targetNode.x ?? 0;
    const ty = targetNode.y ?? 0;

    const scx = sx + sw / 2;
    const scy = sy + sh / 2;
    const tcx = tx + tw / 2;
    const tcy = ty + th / 2;

    const dx = tcx - scx;
    const dy = tcy - scy;

    let startX = scx;
    let startY = scy;
    let endX = tcx;
    let endY = tcy;

    if (direction === 'TB') {
      if (dy >= 0) {
        startY = sy + sh;
        endY = ty;
      } else {
        startY = sy;
        endY = ty + th;
      }
    } else {
      if (dx >= 0) {
        startX = sx + sw;
        endX = tx;
      } else {
        startX = sx;
        endX = tx + tw;
      }
    }

    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    let pathData = '';

    if (lineRouting === 'straight') {
      pathData = `M ${startX} ${startY} L ${endX} ${endY}`;
    } else if (lineRouting === 'orthogonal') {
      if (direction === 'TB') {
        pathData = `M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`;
      } else {
        pathData = `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`;
      }
    } else {
      // Default: Smooth Cubic Bézier Curve
      if (direction === 'TB') {
        const curvature = Math.max(45, Math.abs(endY - startY) * 0.45);
        pathData = `M ${startX} ${startY} C ${startX} ${startY + curvature}, ${endX} ${
          endY - curvature
        }, ${endX} ${endY}`;
      } else {
        const curvature = Math.max(45, Math.abs(endX - startX) * 0.45);
        pathData = `M ${startX} ${startY} C ${startX + curvature} ${startY}, ${
          endX - curvature
        } ${endY}, ${endX} ${endY}`;
      }
    }

    return { pathData, startX, startY, endX, endY, midX, midY };
  };

  const handleStartEditEdge = (edge: ConceptEdge) => {
    setEditingEdgeId(edge.id);
    setEditingEdgeLabel(edge.relationLabel || '');
  };

  const handleSaveEditEdge = (edgeId: string) => {
    onUpdateEdgeRelation(edgeId, editingEdgeLabel.trim());
    setEditingEdgeId(null);
  };

  const isDark = themeMode === 'dark';

  const gridClass = isDark
    ? 'canvas-grid-dark'
    : pastelShade === 'linen'
    ? 'canvas-grid-pastel-linen'
    : pastelShade === 'sage'
    ? 'canvas-grid-pastel-sage'
    : pastelShade === 'lavender'
    ? 'canvas-grid-pastel-lavender'
    : 'canvas-grid-pastel-mist';

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={`relative w-full h-full overflow-hidden select-none cursor-grab active:cursor-grabbing transition-colors duration-300 ${gridClass}`}
    >
      {/* Floating Canvas Action Bar (Top Left) */}
      <div
        data-export-ignore="true"
        className={`absolute top-4 left-4 z-40 flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl backdrop-blur-md border shadow-2xl transition-colors ${
          isDark
            ? 'bg-slate-900/95 border-slate-700 text-slate-300'
            : 'bg-slate-900/90 border-slate-700 text-slate-200'
        }`}
      >
        <button
          type="button"
          onClick={() => onTriggerLayout('TB')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            direction === 'TB'
              ? 'bg-indigo-600 text-white shadow'
              : 'hover:bg-slate-800 text-slate-300'
          }`}
          title="Auto-organizar jerárquicamente de arriba hacia abajo (Vertical)"
        >
          <ArrowDownCircle className="w-4 h-4 text-sky-400" />
          <span>Vertical (TB)</span>
        </button>

        <button
          type="button"
          onClick={() => onTriggerLayout('LR')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            direction === 'LR'
              ? 'bg-indigo-600 text-white shadow'
              : 'hover:bg-slate-800 text-slate-300'
          }`}
          title="Auto-organizar jerárquicamente de izquierda a derecha (Horizontal)"
        >
          <ArrowRightCircle className="w-4 h-4 text-emerald-400" />
          <span>Horizontal (LR)</span>
        </button>

        <div className="w-px h-5 mx-1 bg-slate-700" />

        <button
          type="button"
          onClick={fitView}
          className="px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium hover:bg-slate-800 text-slate-200 hover:text-white"
          title="Encuadrar todo el mapa en pantalla (Fit View)"
        >
          <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Encuadrar</span>
        </button>

        <div className="w-px h-5 mx-1 bg-slate-700" />

        {/* Line Thickness Toggle */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg border bg-slate-950/70 border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 px-1.5 flex items-center gap-1">
            <Sliders className="w-3 h-3 text-sky-400" />
            Líneas:
          </span>
          <button
            type="button"
            onClick={() => setLineThickness('normal')}
            className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
              lineThickness === 'normal'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Normal
          </button>
          <button
            type="button"
            onClick={() => setLineThickness('thick')}
            className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
              lineThickness === 'thick'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Gruesa
          </button>
          <button
            type="button"
            onClick={() => setLineThickness('ultra')}
            className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
              lineThickness === 'ultra'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Ultra
          </button>
        </div>

        {/* Routing Selector */}
        <select
          value={lineRouting}
          onChange={(e) => setLineRouting(e.target.value as any)}
          className="bg-slate-950 text-slate-200 border border-slate-700 rounded-lg px-2 py-1 text-xs font-medium focus:outline-none focus:border-indigo-500"
          title="Estilo de enrutamiento de conectores"
        >
          <option value="bezier">Curva Bézier</option>
          <option value="orthogonal">Ortogonal (Escalonada)</option>
          <option value="straight">Línea Recta</option>
        </select>

        {/* Glow toggle */}
        <button
          type="button"
          onClick={() => setLineGlow((g) => !g)}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
            lineGlow
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:bg-slate-800'
          }`}
          title="Activar/desactivar resplandor luminoso en conexiones"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Resplandor</span>
        </button>
      </div>

      {/* Floating Zoom & Controls Bar (Bottom Left) */}
      <div
        data-export-ignore="true"
        className={`absolute bottom-4 left-4 z-40 flex items-center gap-1 p-1 rounded-xl backdrop-blur-md border shadow-2xl transition-colors ${
          isDark
            ? 'bg-slate-900/95 border-slate-700 text-slate-300'
            : 'bg-slate-900/90 border-slate-700 text-slate-200'
        }`}
      >
        <button
          type="button"
          onClick={handleZoomIn}
          className="p-2 rounded-lg transition-colors hover:bg-slate-800 text-slate-300 hover:text-white"
          title="Aumentar zoom lineal (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleResetZoom}
          className="px-2.5 py-1 text-xs font-mono font-bold text-sky-400 hover:bg-slate-800 rounded-lg transition-colors min-w-[50px] text-center"
          title="Restablecer zoom al 100% y centrar"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          type="button"
          onClick={handleZoomOut}
          className="p-2 rounded-lg transition-colors hover:bg-slate-800 text-slate-300 hover:text-white"
          title="Disminuir zoom lineal (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <div className="w-px h-5 mx-0.5 bg-slate-700" />

        <button
          type="button"
          onClick={fitView}
          className="p-2 rounded-lg transition-colors hover:bg-slate-800 text-slate-300 hover:text-white"
          title="Encuadrar todo el mapa"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Mini-map Navigator (Bottom Right) */}
      <div
        data-export-ignore="true"
        className={`absolute bottom-4 right-4 z-40 hidden md:block w-48 h-36 rounded-xl backdrop-blur-md border shadow-2xl p-2.5 overflow-hidden pointer-events-auto transition-colors ${
          isDark
            ? 'bg-slate-900/95 border-slate-700 text-slate-300'
            : 'bg-slate-900/90 border-slate-700 text-slate-200'
        }`}
      >
        <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-semibold mb-1">
          <span className="flex items-center gap-1 text-sky-400 font-bold">
            <Compass className="w-3.5 h-3.5" />
            Navegador
          </span>
          <span className="font-mono text-slate-300">{nodes.length} Nodos</span>
        </div>

        {/* Mini map preview */}
        <div className="relative w-full h-24 rounded-lg border overflow-hidden bg-slate-950 border-slate-800">
          {(() => {
            const { minX, minY, width, height } = calculateMapBoundingBox(nodes, 80);
            return (
              <>
                {nodes.map((n) => {
                  const left = (((n.x ?? 0) - minX) / width) * 100;
                  const top = (((n.y ?? 0) - minY) / height) * 100;
                  const nodeW = Math.max(5, ((n.width ?? 300) / width) * 100);
                  const nodeH = Math.max(4, ((n.height ?? 140) / height) * 100);

                  const isSelected = selectedNodeId === n.id;

                  return (
                    <div
                      key={n.id}
                      style={{
                        left: `${left}%`,
                        top: `${top}%`,
                        width: `${nodeW}%`,
                        height: `${nodeH}%`,
                        backgroundColor: isSelected ? '#38bdf8' : n.style.borderColor || '#3b82f6',
                      }}
                      className={`absolute rounded-[1px] transition-all ${
                        isSelected ? 'ring-2 ring-white z-10' : 'opacity-85'
                      }`}
                    />
                  );
                })}
              </>
            );
          })()}
        </div>
      </div>

      {/* Main Canvas World (Transformed by Pan & Zoom) */}
      <div
        id="exportable-concept-map-container"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
        className="absolute inset-0 pointer-events-none w-full h-full"
      >
        {/* SVG Edges Layer with Ultra High Visibility */}
        <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-auto">
          <defs>
            {/* Filter for vivid neon glow */}
            <filter id="neon-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Default High-Contrast Arrowhead */}
            <marker
              id="arrowhead-vivid"
              markerWidth="13"
              markerHeight="13"
              refX="10"
              refY="5"
              orient="auto"
            >
              <polygon
                points="0 1, 10 5, 0 9"
                fill={isDark ? '#38bdf8' : '#1d4ed8'}
                stroke={isDark ? '#020617' : '#ffffff'}
                strokeWidth="1.2"
              />
            </marker>

            {/* Active / Highlight Arrowhead */}
            <marker
              id="arrowhead-highlight"
              markerWidth="15"
              markerHeight="15"
              refX="11"
              refY="5"
              orient="auto"
            >
              <polygon
                points="0 0.5, 12 5, 0 9.5"
                fill="#f59e0b"
                stroke="#0f172a"
                strokeWidth="1.5"
              />
            </marker>
          </defs>

          {/* Render each connecting edge */}
          {edges.map((edge) => {
            const sourceNode = nodes.find((n) => n.id === edge.source);
            const targetNode = nodes.find((n) => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;

            const { pathData, midX, midY } = calculateEdgePath(sourceNode, targetNode);
            const isEditing = editingEdgeId === edge.id;
            const isConnectedToSelected =
              selectedNodeId === edge.source || selectedNodeId === edge.target;
            const isConnectedToHovered =
              hoveredNodeId === edge.source || hoveredNodeId === edge.target;
            const isHighlighted = isConnectedToSelected || isConnectedToHovered;

            const mainStrokeColor = isHighlighted
              ? '#f59e0b'
              : isDark
              ? '#38bdf8'
              : '#1d4ed8';

            // High contrast halo adapts to background
            const haloColor = isDark ? '#020617' : '#ffffff';

            const badgeLabel = edge.relationLabel || '+ Conector';
            const badgeWidth = Math.max(90, Math.min(260, badgeLabel.length * 8.5 + 28));

            return (
              <g key={edge.id} className="group/edge">
                {/* 1. Large Hitbox */}
                <path
                  d={pathData}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="30"
                  className="cursor-pointer"
                  onClick={() => handleStartEditEdge(edge)}
                />

                {/* 2. Contrast Halo Behind the Line */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={haloColor}
                  strokeWidth={strokeWidths.halo + (isHighlighted ? 4 : 0)}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={isDark ? 0.95 : 0.9}
                />

                {/* 3. Neon Glow Layer */}
                {(lineGlow || isHighlighted) && (
                  <path
                    d={pathData}
                    fill="none"
                    stroke={mainStrokeColor}
                    strokeWidth={strokeWidths.base + 6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={isHighlighted ? 0.7 : 0.35}
                    filter="url(#neon-glow)"
                  />
                )}

                {/* 4. Main Foreground Line */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={mainStrokeColor}
                  strokeWidth={strokeWidths.base + (isHighlighted ? 2 : 0)}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  markerEnd={isHighlighted ? 'url(#arrowhead-highlight)' : 'url(#arrowhead-vivid)'}
                  className="transition-all duration-150"
                />

                {/* 5. Pure SVG Vector Relation Badge */}
                <g
                  className="cursor-pointer transition-transform hover:scale-105"
                  onClick={() => handleStartEditEdge(edge)}
                >
                  {/* Badge background pill */}
                  <rect
                    x={midX - badgeWidth / 2}
                    y={midY - 14}
                    width={badgeWidth}
                    height="28"
                    rx="14"
                    fill={isHighlighted ? '#451a03' : isDark ? '#020617' : '#ffffff'}
                    stroke={isHighlighted ? '#f59e0b' : isDark ? '#38bdf8' : '#1d4ed8'}
                    strokeWidth={isHighlighted ? '2.5' : '2'}
                    className="shadow-xl"
                  />
                  {/* Badge text */}
                  <text
                    x={midX}
                    y={midY + 4.5}
                    textAnchor="middle"
                    fill={isHighlighted ? '#fde68a' : isDark ? '#e0f2fe' : '#1e3a8a'}
                    fontSize="11.5px"
                    fontWeight="800"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    pointerEvents="none"
                  >
                    {badgeLabel.length > 28 ? `${badgeLabel.slice(0, 26)}…` : badgeLabel}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Floating connector edit popup when active */}
        {editingEdgeId && (() => {
          const edge = edges.find((e) => e.id === editingEdgeId);
          if (!edge) return null;
          const sNode = nodes.find((n) => n.id === edge.source);
          const tNode = nodes.find((n) => n.id === edge.target);
          if (!sNode || !tNode) return null;
          const { midX, midY } = calculateEdgePath(sNode, tNode);

          return (
            <div
              style={{
                position: 'absolute',
                left: `${midX}px`,
                top: `${midY}px`,
                transform: 'translate(-50%, -50%)',
                zIndex: 50,
              }}
              className="flex items-center gap-1.5 bg-slate-900 border-2 border-amber-400 rounded-full px-3 py-1.5 shadow-2xl pointer-events-auto"
            >
              <input
                type="text"
                value={editingEdgeLabel}
                onChange={(e) => setEditingEdgeLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEditEdge(edge.id);
                  if (e.key === 'Escape') setEditingEdgeId(null);
                }}
                autoFocus
                placeholder="Conector lógico..."
                className="text-xs bg-transparent text-amber-300 font-bold focus:outline-none w-36 text-center"
              />
              <button
                type="button"
                onClick={() => handleSaveEditEdge(edge.id)}
                className="p-1 text-emerald-400 hover:text-emerald-300"
                title="Guardar conector"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onDeleteEdge(edge.id)}
                className="p-1 text-rose-400 hover:text-rose-300"
                title="Eliminar conector"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setEditingEdgeId(null)}
                className="p-1 text-slate-400 hover:text-slate-300"
                title="Cancelar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })()}

        {/* HTML Custom Nodes Layer */}
        <div className="absolute inset-0 pointer-events-auto">
          {nodes.map((node) => (
            <div
              key={node.id}
              className="contents"
              onMouseEnter={() => setHoveredNodeId(node.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
            >
              <CustomNode
                node={node}
                isSelected={selectedNodeId === node.id}
                onSelect={onSelectNode}
                onEdit={onEditNode}
                onAddChild={onAddChildNode}
                onDelete={onDeleteNode}
                onOpenMedia={onOpenMedia}
                onInspectNode={onInspectNode}
                onStartDrag={handleNodeDragStart}
                onReassignPoint={(target) => {
                  setReconnectingNode(target);
                  const inEdge = edges.find((e) => e.target === target.id);
                  setTargetParentId(inEdge?.source || '');
                  setTargetRelation(inEdge?.relationLabel || 'se fundamenta en');
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Quick Reconnection Dialog ("Editar el punto de donde se encuentra a otro punto") */}
      {reconnectingNode && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in pointer-events-auto"
          onClick={() => setReconnectingNode(null)}
        >
          <div
            className="w-full max-w-lg bg-slate-900 border-2 border-amber-400/90 rounded-2xl shadow-2xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 35px rgba(251, 191, 36, 0.2)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/40">
                  <GitBranch className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    Cambiar Punto de Conexión
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Mueve este concepto a otro punto de origen en el mapa conceptual
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReconnectingNode(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Concept Badge */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center gap-2.5 text-xs">
              <span className="text-xl">{reconnectingNode.emoji || '📌'}</span>
              <div className="truncate flex-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  Concepto Seleccionado:
                </span>
                <span className="font-extrabold text-white truncate block">
                  {reconnectingNode.label}
                </span>
              </div>
            </div>

            {/* Form to pick new connection point */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-white block mb-1">
                  1. Seleccionar Nuevo Punto de Origen (Nodo Padre):
                </label>
                <select
                  value={targetParentId}
                  onChange={(e) => setTargetParentId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
                >
                  <option value="">(Sin padre - Convertir en Nodo Raíz Independiente)</option>
                  {nodes
                    .filter((n) => {
                      if (n.id === reconnectingNode.id) return false;
                      // Cycle check helper
                      const isDescendant = (parent: string, child: string): boolean => {
                        const direct = edges.filter((e) => e.source === parent).map((e) => e.target);
                        if (direct.includes(child)) return true;
                        return direct.some((d) => isDescendant(d, child));
                      };
                      return !isDescendant(reconnectingNode.id, n.id);
                    })
                    .map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.emoji || '📌'} {candidate.label} [{candidate.type}]
                      </option>
                    ))}
                </select>
              </div>

              {targetParentId && (
                <div>
                  <label className="text-xs font-bold text-white block mb-1">
                    2. Frase Conectora sobre la Flecha:
                  </label>
                  <input
                    type="text"
                    value={targetRelation}
                    onChange={(e) => setTargetRelation(e.target.value)}
                    placeholder="ej. se fundamenta en / se compone de / genera"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1.5">
                    {['se fundamenta en', 'se compone de', 'genera', 'ejemplo de', 'regulado por', 'produce'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setTargetRelation(preset)}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  if (onReassignParentNode) {
                    onReassignParentNode(reconnectingNode.id, null, '');
                  }
                  setReconnectingNode(null);
                }}
                className="text-[11px] font-bold text-slate-400 hover:text-amber-300 underline"
              >
                Hacer Nodo Raíz Autónomo
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReconnectingNode(null)}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onReassignParentNode) {
                      onReassignParentNode(
                        reconnectingNode.id,
                        targetParentId ? targetParentId : null,
                        targetRelation.trim()
                      );
                    }
                    setReconnectingNode(null);
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold shadow-lg transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar Nuevo Punto</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State Overlay when no nodes are on canvas */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center bg-slate-950/70 backdrop-blur-sm pointer-events-auto">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-sky-400 mb-3 shadow-2xl">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">El lienzo está vacío</h3>
          <p className="text-xs text-slate-300 max-w-sm mt-1 mb-5">
            Actualmente no hay conceptos en pantalla. Puedes restaurar el mapa completo de estudio con todas las ramas o crear uno nuevo.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {onResetToDefault && (
              <button
                type="button"
                onClick={onResetToDefault}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restaurar Mapa de Estudio (27 Nodos)</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
