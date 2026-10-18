import React, { useState } from 'react';
import {
  Play,
  Image as ImageIcon,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Maximize2,
  X,
  Film,
  GitBranch,
  Move,
  ChevronDown,
  ChevronUp,
  BookOpen
} from 'lucide-react';
import { ConceptNode } from '../types/conceptMap';
import { getYouTubeThumbnail, getYouTubeEmbedUrl, isDirectVideoUrl } from '../utils/youtube';

interface CustomNodeProps {
  node: ConceptNode;
  isSelected: boolean;
  onSelect: (nodeId: string) => void;
  onEdit: (node: ConceptNode) => void;
  onAddChild: (parentNodeId: string) => void;
  onDelete: (nodeId: string) => void;
  onOpenMedia: (node: ConceptNode) => void;
  onInspectNode: (node: ConceptNode) => void;
  onStartDrag: (e: React.MouseEvent, nodeId: string) => void;
  onReassignPoint?: (node: ConceptNode) => void;
}

/**
 * Calculates luminance to guarantee high-contrast text visibility
 */
export function isLightBackground(hexColor?: string): boolean {
  if (!hexColor || !hexColor.startsWith('#')) return false;
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  // Perceived brightness formula
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.58;
}

export const CustomNode: React.FC<CustomNodeProps> = ({
  node,
  isSelected,
  onSelect,
  onEdit,
  onAddChild,
  onDelete,
  onOpenMedia,
  onInspectNode,
  onStartDrag,
  onReassignPoint,
}) => {
  // Inline video playing state directly inside this node on the canvas
  const [isPlayingInline, setIsPlayingInline] = useState(false);
  // Inline text expansion toggle
  const [isExpanded, setIsExpanded] = useState(false);

  const isYouTube = node.media?.type === 'youtube_video' && !!node.media.url;
  const isDirectVideo = isDirectVideoUrl(node.media?.url || '');
  const hasVideo = isYouTube || isDirectVideo;
  const isCloudinary = node.media?.type === 'cloudinary_image' && !isDirectVideo && !!node.media.url;
  const hasMedia = hasVideo || isCloudinary;

  const ytThumb = isYouTube ? getYouTubeThumbnail(node.media.url) : null;
  const imgUrl = isCloudinary ? node.media.url : ytThumb;
  const embedUrl = isYouTube ? getYouTubeEmbedUrl(node.media.url) : null;

  const isLight = isLightBackground(node.style.backgroundColor);

  // High contrast color schemes depending on node background
  const colors = {
    title: node.style.textColor || (isLight ? '#0f172a' : '#ffffff'),
    body: isLight ? '#1e293b' : '#f8fafc',
    bullet: isLight ? '#2563eb' : '#38bdf8',
    bold: isLight ? '#020617' : '#ffffff',
    italic: isLight ? '#334155' : '#e2e8f0',
    topBarBg: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.35)',
    topBarBorder: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.15)',
    actionBtnColor: isLight ? '#1e293b' : '#ffffff',
    actionBtnHoverBg: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.2)',
  };

  // Level labels and badge color schemes
  const levelBadge = {
    root: {
      label: 'Raíz Principal',
      bg: isLight ? 'bg-amber-100 text-amber-900 border-amber-400' : 'bg-amber-400/25 text-amber-300 border-amber-400/50',
    },
    topic: {
      label: 'Rama Principal',
      bg: isLight ? 'bg-emerald-100 text-emerald-900 border-emerald-400' : 'bg-emerald-400/25 text-emerald-300 border-emerald-400/50',
    },
    subtopic: {
      label: 'Subtema',
      bg: isLight ? 'bg-sky-100 text-sky-900 border-sky-400' : 'bg-sky-400/25 text-sky-300 border-sky-400/50',
    },
    detail: {
      label: 'Detalle / Caso',
      bg: isLight ? 'bg-purple-100 text-purple-900 border-purple-400' : 'bg-purple-400/25 text-purple-300 border-purple-400/50',
    },
  }[node.type] || {
    label: 'Tema',
    bg: isLight ? 'bg-slate-200 text-slate-800 border-slate-300' : 'bg-slate-700 text-slate-300 border-slate-600',
  };

  // Inline formatting parser
  const parseInlineFormatting = (text: string): React.ReactNode => {
    const parts = text.split(/(<b>.*?<\/b>|<i>.*?<\/i>|\*\*.*?\*\*)/g);

    return parts.map((part, i) => {
      if (part.startsWith('<b>') && part.endsWith('</b>')) {
        return (
          <strong key={i} style={{ color: colors.bold, fontWeight: 800 }}>
            {part.slice(3, -4)}
          </strong>
        );
      }
      if (part.startsWith('<i>') && part.endsWith('</i>')) {
        return (
          <em key={i} style={{ color: colors.italic, fontStyle: 'italic' }}>
            {part.slice(3, -4)}
          </em>
        );
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} style={{ color: colors.bold, fontWeight: 800 }}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  // Formatter for descriptions supporting HTML tags (<b>, <i>), bullets (- and •)
  const renderFormattedDescription = (rawText: string) => {
    if (!rawText) return null;
    const lines = rawText.split('\n');
    const displayLines = isExpanded ? lines : lines.slice(0, 5);

    return (
      <div className="space-y-1.5 text-xs leading-relaxed" style={{ color: colors.body }}>
        {displayLines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return null;

          const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ');
          const cleanLine = isBullet ? trimmed.replace(/^[-•*]\s*/, '') : trimmed;
          const parsedContent = parseInlineFormatting(cleanLine);

          if (isBullet) {
            return (
              <div key={idx} className="flex items-start gap-1.5">
                <span
                  style={{ color: colors.bullet }}
                  className="mt-0.5 shrink-0 text-sm leading-none font-extrabold"
                >
                  •
                </span>
                <span className="flex-1" style={{ color: colors.body }}>
                  {parsedContent}
                </span>
              </div>
            );
          }

          return (
            <div key={idx} style={{ color: colors.body }}>
              {parsedContent}
            </div>
          );
        })}

        {lines.length > 5 && !isExpanded && (
          <div className="text-[10px] text-sky-400 font-bold italic pt-0.5">
            + {lines.length - 5} líneas más...
          </div>
        )}
      </div>
    );
  };

  const hasLongDescription = (node.description || '').split('\n').filter((l) => l.trim()).length > 3;

  return (
    <div
      id={`node-${node.id}`}
      style={{
        top: 0,
        left: 0,
        transform: `translate(${node.x ?? 0}px, ${node.y ?? 0}px)`,
        width: `${node.width ?? 300}px`,
        backgroundColor: node.style.backgroundColor || '#1e293b',
        borderColor: isSelected ? '#38bdf8' : node.style.borderColor || '#3b82f6',
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onInspectNode(node);
      }}
      className={`group absolute select-none rounded-xl border-[2.5px] transition-all duration-150 shadow-xl ${
        isSelected
          ? 'ring-4 ring-sky-400/80 shadow-2xl scale-[1.02] z-40'
          : 'hover:border-sky-400 hover:shadow-2xl z-20'
      }`}
    >
      {/* Floating Action Menu when this node is SELECTED */}
      {isSelected && (
        <div
          data-export-ignore="true"
          className="absolute -top-11 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-2.5 py-1.5 bg-slate-900/95 border border-sky-400 rounded-full shadow-2xl backdrop-blur-md animate-fade-in whitespace-nowrap"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 1. Ampliar Información completa */}
          <button
            type="button"
            onClick={() => onInspectNode(node)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-sky-500 hover:bg-sky-400 text-white rounded-full text-[11px] font-extrabold shadow-sm transition-all"
            title="Ampliar información completa (Texto, Video, Imagen y Ramas)"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Ampliar Info</span>
          </button>

          {/* 2. Cambiar Punto de Conexión (Reconectar / Mover a otro nodo) */}
          {onReassignPoint && (
            <button
              type="button"
              onClick={() => onReassignPoint(node)}
              className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/50 rounded-full text-[11px] font-bold transition-all"
              title="Cambiar punto de donde se encuentra / Reconectar a otro nodo"
            >
              <GitBranch className="w-3 h-3 text-amber-400" />
              <span>Cambiar Punto</span>
            </button>
          )}

          {/* 3. Editar datos en panel lateral */}
          <button
            type="button"
            onClick={() => onEdit(node)}
            className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-full text-[11px] font-bold transition-all border border-slate-700"
            title="Editar texto, colores o recursos en el panel lateral"
          >
            <Edit2 className="w-3 h-3 text-sky-300" />
            <span>Editar</span>
          </button>

          {/* 4. Agregar nodo hijo */}
          <button
            type="button"
            onClick={() => onAddChild(node.id)}
            className="p-1 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 rounded-full transition-colors"
            title="Conectar nuevo concepto hijo"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {/* 5. Eliminar */}
          <button
            type="button"
            onClick={() => onDelete(node.id)}
            className="p-1 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-full transition-colors"
            title="Eliminar este concepto"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Drag Handle & Hierarchy Bar (Can drag smoothly to move point anywhere) */}
      <div
        onMouseDown={(e) => onStartDrag(e, node.id)}
        style={{
          backgroundColor: colors.topBarBg,
          borderBottomColor: colors.topBarBorder,
        }}
        className="px-3.5 pt-2.5 pb-2 flex items-center justify-between border-b rounded-t-xl cursor-grab active:cursor-grabbing"
        title="Arrastra para mover este nodo de un punto a otro en el lienzo"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl shrink-0" role="img" aria-label="emoji">
            {node.emoji || '📌'}
          </span>
          <span
            className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-xs ${levelBadge.bg}`}
          >
            {levelBadge.label}
          </span>
        </div>

        {/* Action quick buttons */}
        <div
          data-export-ignore="true"
          className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity"
        >
          {/* Quick coordinate indicator when selected */}
          {isSelected && (
            <span className="text-[9px] font-mono font-bold text-sky-300/80 bg-black/30 px-1.5 py-0.5 rounded mr-1">
              x:{Math.round(node.x || 0)} y:{Math.round(node.y || 0)}
            </span>
          )}

          {/* Prominent button to expand full details */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onInspectNode(node);
            }}
            style={{ color: colors.actionBtnColor }}
            className="px-1.5 py-0.5 rounded bg-black/25 hover:bg-black/40 flex items-center gap-1 text-[10px] font-extrabold transition-colors border border-white/10"
            title="Ampliar información completa (doble clic o botón)"
          >
            <Maximize2 className="w-3 h-3 text-sky-400" />
            <span className="hidden sm:inline">Ampliar</span>
          </button>

          {/* Quick button to reconnect to another point */}
          {onReassignPoint && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onReassignPoint(node);
              }}
              style={{ color: colors.actionBtnColor }}
              className="p-1 rounded hover:bg-black/20 text-amber-400 transition-colors"
              title="Cambiar punto de conexión (nodo padre)"
            >
              <GitBranch className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddChild(node.id);
            }}
            style={{ color: colors.actionBtnColor }}
            className="p-1 rounded hover:bg-black/20 transition-colors"
            title="Agregar nodo hijo conectado"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(node);
            }}
            style={{ color: colors.actionBtnColor }}
            className="p-1 rounded hover:bg-black/20 transition-colors"
            title="Editar este nodo en el panel"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.id);
            }}
            className="p-1 text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 rounded transition-colors"
            title="Eliminar nodo y ramas hijas"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Concept Title & Content */}
      <div
        className="p-3.5 space-y-2.5 cursor-pointer"
        onMouseDown={(e) => {
          // If clicking on text area, also allow dragging card to move position
          const target = e.target as HTMLElement;
          if (!target.closest('button, a, iframe, video')) {
            onStartDrag(e, node.id);
          }
        }}
      >
        <div className="flex items-start justify-between gap-1.5">
          <h4
            style={{ color: colors.title }}
            className="text-sm font-extrabold leading-snug tracking-tight drop-shadow-xs flex-1"
          >
            {parseInlineFormatting(node.label)}
          </h4>
        </div>

        {node.description && (
          <div className="space-y-1.5">
            <div className={`${isExpanded ? 'max-h-96' : 'max-h-56'} overflow-y-auto pr-1 transition-all`}>
              {renderFormattedDescription(node.description)}
            </div>

            {/* Quick Inline Expansion Toggle button (Ampliar / Contraer texto directamente en el nodo) */}
            {hasLongDescription && (
              <div data-export-ignore="true" className="pt-1 flex items-center justify-between border-t border-black/10">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded((prev) => !prev);
                  }}
                  className="flex items-center gap-1 text-[11px] font-extrabold text-sky-400 hover:text-sky-300 transition-colors py-0.5"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span>Contraer texto</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span>Ver más texto en tarjeta</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onInspectNode(node);
                  }}
                  className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-400 hover:underline py-0.5"
                  title="Ampliar en ventana completa"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>Ventana Completa</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Multimedia Player / Card */}
        {hasMedia && (
          <div className="mt-2.5">
            {hasVideo && isPlayingInline ? (
              /* ACTIVE INLINE VIDEO PLAYER DIRECTLY ON NODE CARD */
              <div
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className="relative aspect-video w-full overflow-hidden rounded-xl border-2 border-sky-400 bg-black shadow-2xl"
              >
                {isYouTube && embedUrl ? (
                  <iframe
                    src={embedUrl}
                    title={node.label}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : isDirectVideo ? (
                  <video
                    src={node.media.url}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  />
                ) : null}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPlayingInline(false);
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-black/85 hover:bg-rose-600 text-white rounded-full transition-colors z-20 shadow-md"
                  title="Cerrar reproductor"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              /* THUMBNAIL & MEDIA PREVIEW CARD */
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (hasVideo) {
                    setIsPlayingInline(true);
                  } else {
                    onInspectNode(node);
                  }
                }}
                className="group/media relative overflow-hidden rounded-xl border border-black/20 bg-black/40 hover:border-sky-400 transition-all cursor-pointer shadow-md"
              >
                {imgUrl ? (
                  <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
                    <img
                      src={imgUrl}
                      alt={node.media.caption || node.label}
                      className="w-full h-full object-cover group-hover/media:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://placehold.co/600x350/1e293b/94a3b8?text=Recurso+Multimedia';
                      }}
                    />
                    {/* Dark gradient for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  </div>
                ) : (
                  <div className="aspect-video w-full flex flex-col items-center justify-center bg-slate-950 p-4 text-center">
                    <Film className="w-8 h-8 text-sky-400 mb-1" />
                    <span className="text-xs font-bold text-slate-300">Recurso de Video</span>
                  </div>
                )}

                {/* Video Play Button Overlay */}
                {hasVideo && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-11 h-11 rounded-full bg-red-600/90 hover:bg-red-500 text-white flex items-center justify-center shadow-xl group-hover/media:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>
                )}

                {/* Cloudinary Image Badge */}
                {isCloudinary && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/75 backdrop-blur-sm rounded-md text-[10px] font-extrabold text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shadow-xs">
                    <ImageIcon className="w-3 h-3" />
                    <span>Cloudinary</span>
                  </div>
                )}

                {/* Caption or Click to inspect */}
                <div className="p-2 bg-black/60 backdrop-blur-xs flex items-center justify-between text-[11px] text-white">
                  <span className="truncate max-w-[200px] font-medium">
                    {node.media.caption || (hasVideo ? 'Reproducir video' : 'Ver imagen')}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onInspectNode(node);
                      }}
                      className="p-1 hover:text-sky-300 text-slate-300"
                      title="Ampliar en ventana completa"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                    {node.media.url && (
                      <a
                        href={node.media.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 hover:text-sky-300 text-slate-300"
                        title="Abrir enlace original"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom connection anchor hint */}
      <div
        className="w-full py-1 text-center bg-black/15 border-t border-white/5 rounded-b-xl text-[10px] font-bold text-slate-400 group-hover:text-sky-300 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          onInspectNode(node);
        }}
        title="Haz doble clic o pulsa aquí para ampliar la información completa"
      >
        <span className="opacity-75">🔍 Clic para seleccionar • Doble clic para ampliar</span>
      </div>
    </div>
  );
};
