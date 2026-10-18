import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Edit3,
  ExternalLink,
  Play,
  Image as ImageIcon,
  ArrowRight,
  Sparkles,
  Link2,
  Layers,
  BookOpen,
  GitBranch,
  Move,
  Check,
  Save,
  AlertCircle,
  CornerDownRight,
  Maximize2
} from 'lucide-react';
import { ConceptEdge, ConceptNode } from '../types/conceptMap';
import { getYouTubeEmbedUrl, isDirectVideoUrl } from '../utils/youtube';

interface NodeDetailModalProps {
  node: ConceptNode | null;
  allNodes: ConceptNode[];
  allEdges: ConceptEdge[];
  incomingEdge?: ConceptEdge | null;
  parentNode?: ConceptNode | null;
  childNodes: { node: ConceptNode; edge: ConceptEdge }[];
  onClose: () => void;
  onEdit: (node: ConceptNode) => void;
  onNavigateToNode: (nodeId: string) => void;
  onReassignParent?: (nodeId: string, newParentId: string | null, newRelationLabel?: string) => void;
  onUpdateNodeContent?: (nodeId: string, updates: Partial<ConceptNode>) => void;
  onUpdateNodePosition?: (nodeId: string, x: number, y: number) => void;
}

export const NodeDetailModal: React.FC<NodeDetailModalProps> = ({
  node,
  allNodes,
  allEdges,
  incomingEdge,
  parentNode,
  childNodes,
  onClose,
  onEdit,
  onNavigateToNode,
  onReassignParent,
  onUpdateNodeContent,
  onUpdateNodePosition,
}) => {
  // Re-parenting state
  const [isChangingParent, setIsChangingParent] = useState(false);
  const [selectedNewParentId, setSelectedNewParentId] = useState<string>(parentNode?.id || '');
  const [relationText, setRelationText] = useState<string>(incomingEdge?.relationLabel || 'se relaciona con');
  const [reassignSuccessMsg, setReassignSuccessMsg] = useState<string | null>(null);

  // Quick Inline Edit state
  const [isQuickEditing, setIsQuickEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(node?.label || '');
  const [editEmoji, setEditEmoji] = useState(node?.emoji || '📌');
  const [editDescription, setEditDescription] = useState(node?.description || '');
  const [editMediaUrl, setEditMediaUrl] = useState(node?.media?.url || '');

  // Coordinate adjustments
  const [coordX, setCoordX] = useState<number>(Math.round(node?.x ?? 0));
  const [coordY, setCoordY] = useState<number>(Math.round(node?.y ?? 0));

  // Sync state whenever node or parent changes
  useEffect(() => {
    if (node) {
      setSelectedNewParentId(parentNode?.id || '');
      setRelationText(incomingEdge?.relationLabel || 'se fundamenta en');
      setEditLabel(node.label);
      setEditEmoji(node.emoji || '📌');
      setEditDescription(node.description || '');
      setEditMediaUrl(node.media?.url || '');
      setCoordX(Math.round(node.x ?? 0));
      setCoordY(Math.round(node.y ?? 0));
    }
  }, [node, parentNode, incomingEdge]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Filter valid candidate parent nodes (exclude node itself and any of its descendants to avoid cycles)
  const availableParents = useMemo(() => {
    if (!node) return [];

    const isDescendant = (currentParentId: string, targetNodeId: string): boolean => {
      const directChildren = allEdges
        .filter((e) => e.source === currentParentId)
        .map((e) => e.target);
      if (directChildren.includes(targetNodeId)) return true;
      return directChildren.some((childId) => isDescendant(childId, targetNodeId));
    };

    return allNodes.filter((candidate) => {
      if (candidate.id === node.id) return false;
      // Candidate must not be a descendant of this node
      if (isDescendant(node.id, candidate.id)) return false;
      return true;
    });
  }, [node, allNodes, allEdges]);

  if (!node) return null;

  const isYouTube = node.media?.type === 'youtube_video' && !!node.media.url;
  const isDirectVideo = isDirectVideoUrl(node.media?.url || '');
  const hasVideo = isYouTube || isDirectVideo;
  const isCloudinary = node.media?.type === 'cloudinary_image' && !isDirectVideo && !!node.media.url;
  const hasMedia = hasVideo || isCloudinary;
  const embedUrl = isYouTube ? getYouTubeEmbedUrl(node.media.url) : null;

  // Level badge styling
  const levelBadge = {
    root: { label: 'Nodo Raíz Central', bg: 'bg-amber-400/20 text-amber-300 border-amber-400/40' },
    topic: { label: 'Rama Principal (Tema)', bg: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/40' },
    subtopic: { label: 'Subtema Intermedio', bg: 'bg-sky-400/20 text-sky-300 border-sky-400/40' },
    detail: { label: 'Detalle / Caso de Estudio', bg: 'bg-purple-400/20 text-purple-300 border-purple-400/40' },
  }[node.type] || { label: 'Concepto', bg: 'bg-slate-700 text-slate-300 border-slate-600' };

  // Parse inline text with bold and italic
  const parseInline = (text: string) => {
    const parts = text.split(/(<b>.*?<\/b>|<i>.*?<\/i>|\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('<b>') && part.endsWith('</b>')) {
        return <strong key={i} className="font-extrabold text-white">{part.slice(3, -4)}</strong>;
      }
      if (part.startsWith('<i>') && part.endsWith('</i>')) {
        return <em key={i} className="italic text-sky-200">{part.slice(3, -4)}</em>;
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-extrabold text-white">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  // Render expanded text line by line
  const renderExpandedText = (raw: string) => {
    if (!raw) return null;
    const lines = raw.split('\n');

    return (
      <div className="space-y-2.5">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return null;

          const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ');
          const clean = isBullet ? trimmed.replace(/^[-•*]\s*/, '') : trimmed;

          if (isBullet) {
            return (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-sm md:text-base text-slate-200 leading-relaxed shadow-sm"
              >
                <span className="w-2 h-2 rounded-full bg-sky-400 mt-2 shrink-0 shadow-sm shadow-sky-400/50" />
                <span className="flex-1">{parseInline(clean)}</span>
              </div>
            );
          }

          return (
            <p key={idx} className="text-sm md:text-base text-slate-200 leading-relaxed">
              {parseInline(clean)}
            </p>
          );
        })}
      </div>
    );
  };

  // Handle re-parenting submission
  const handleSaveReassign = () => {
    if (!onReassignParent) return;
    onReassignParent(
      node.id,
      selectedNewParentId ? selectedNewParentId : null,
      relationText.trim()
    );
    setIsChangingParent(false);
    setReassignSuccessMsg('¡Punto de conexión actualizado correctamente!');
    setTimeout(() => setReassignSuccessMsg(null), 3500);
  };

  // Handle inline content update
  const handleSaveQuickEdit = () => {
    if (!onUpdateNodeContent) return;
    onUpdateNodeContent(node.id, {
      label: editLabel.trim() || node.label,
      emoji: editEmoji.trim() || node.emoji,
      description: editDescription.trim(),
      media: {
        ...node.media,
        url: editMediaUrl.trim(),
      },
    });
    setIsQuickEditing(false);
    setReassignSuccessMsg('¡Contenido guardado con éxito!');
    setTimeout(() => setReassignSuccessMsg(null), 3000);
  };

  // Handle position save
  const handleSavePosition = () => {
    if (!onUpdateNodePosition) return;
    onUpdateNodePosition(node.id, coordX, coordY);
    setReassignSuccessMsg(`¡Ubicación movida a X:${coordX}, Y:${coordY}!`);
    setTimeout(() => setReassignSuccessMsg(null), 3000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-slate-900 border-2 border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(56, 189, 248, 0.15)',
        }}
      >
        {/* Top Header Bar */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/70 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border ${levelBadge.bg}`}
            >
              {levelBadge.label}
            </span>

            {/* Parent connection breadcrumb */}
            {parentNode ? (
              <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-900/90 border border-slate-700/70 px-2.5 py-1 rounded-full shadow-xs">
                <Link2 className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-slate-400">Desde:</span>
                <button
                  type="button"
                  onClick={() => onNavigateToNode(parentNode.id)}
                  className="text-sky-300 font-bold hover:underline truncate max-w-[150px]"
                  title={`Navegar a ${parentNode.label}`}
                >
                  {parentNode.label}
                </button>
                {incomingEdge?.relationLabel && (
                  <span className="text-amber-300 italic font-medium">
                    ("{incomingEdge.relationLabel}")
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-950/40 border border-amber-600/50 px-2.5 py-1 rounded-full">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Nodo Raíz Autónomo</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Re-connect / Change Point button */}
            {onReassignParent && (
              <button
                type="button"
                onClick={() => setIsChangingParent((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors shadow-sm ${
                  isChangingParent
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-800 hover:bg-slate-750 text-amber-300 border-amber-500/40 hover:border-amber-400'
                }`}
                title="Cambiar el punto al que se conecta este concepto"
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>{isChangingParent ? 'Cerrar Conexión' : 'Cambiar Punto'}</span>
              </button>
            )}

            {/* Quick Edit Toggle button */}
            {onUpdateNodeContent && (
              <button
                type="button"
                onClick={() => setIsQuickEditing((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors shadow-sm ${
                  isQuickEditing
                    ? 'bg-sky-500 text-white border-sky-400'
                    : 'bg-slate-800 hover:bg-slate-750 text-sky-300 hover:text-white border-slate-700'
                }`}
                title="Editar título y descripción directamente"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isQuickEditing ? 'Vista Normal' : 'Edición Rápida'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onEdit(node);
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-700"
              title="Abrir panel lateral completo"
            >
              <ExternalLink className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Cerrar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success toast notification inside modal */}
        {reassignSuccessMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-950/90 border border-emerald-500/70 text-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg animate-fade-in">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{reassignSuccessMsg}</span>
          </div>
        )}

        {/* Re-parenting Interactive Section ("Editar el punto de donde se encuentra a otro punto") */}
        {isChangingParent && (
          <div className="mx-5 md:mx-6 mt-4 p-4 rounded-xl bg-slate-950/90 border-2 border-amber-500/80 shadow-2xl space-y-3 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-amber-300 font-extrabold text-xs">
                <GitBranch className="w-4 h-4 text-amber-400" />
                <span>Reubicar Punto de Conexión (Cambiar de donde proviene este concepto)</span>
              </div>
              <span className="text-[10px] text-slate-400 italic">Mueve la rama en la jerarquía</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-bold text-white block mb-1">
                  1. Nuevo Nodo Padre de Origen:
                </label>
                <select
                  value={selectedNewParentId}
                  onChange={(e) => setSelectedNewParentId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
                >
                  <option value="">(Sin padre - Convertir en Nodo Raíz Independiente)</option>
                  {availableParents.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.emoji || '📌'} {p.label} [{p.type}]
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 block mt-1">
                  {selectedNewParentId
                    ? `Se conectará como hijo de este nodo seleccionado.`
                    : `Se convertirá en un concepto raíz autónomo sin flecha de entrada.`}
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-white block mb-1">
                  2. Frase o Conector Lógico:
                </label>
                <input
                  type="text"
                  value={relationText}
                  onChange={(e) => setRelationText(e.target.value)}
                  placeholder="ej. se fundamenta en / se clasifica en"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {['se fundamenta en', 'se compone de', 'genera', 'ejemplo de', 'regulado por'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRelationText(preset)}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsChangingParent(false)}
                className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveReassign}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-lg text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar y Mover a este Punto</span>
              </button>
            </div>
          </div>
        )}

        {/* Quick Inline Content Editor */}
        {isQuickEditing && (
          <div className="mx-5 md:mx-6 mt-4 p-4 rounded-xl bg-slate-950/90 border-2 border-sky-500/80 shadow-2xl space-y-3 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-sky-300 font-extrabold text-xs">
                <Edit3 className="w-4 h-4 text-sky-400" />
                <span>Edición Rápida de Información</span>
              </div>
              <span className="text-[10px] text-slate-400 italic">Actualiza texto y recursos multimedia</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1">
              <div className="sm:col-span-1">
                <label className="text-[11px] font-bold text-white block mb-1">Emoji:</label>
                <input
                  type="text"
                  value={editEmoji}
                  onChange={(e) => setEditEmoji(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-center text-lg text-white font-bold"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="text-[11px] font-bold text-white block mb-1">Título del Concepto:</label>
                <input
                  type="text"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold focus:border-sky-400"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-white block mb-1">
                Descripción Detallada (admite viñetas -, • y etiquetas &lt;b&gt;, &lt;i&gt;):
              </label>
              <textarea
                rows={4}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-sky-400 font-sans"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-white block mb-1">
                URL de Recurso Multimedia (Cloudinary / YouTube):
              </label>
              <input
                type="url"
                value={editMediaUrl}
                onChange={(e) => setEditMediaUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-sky-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsQuickEditing(false)}
                className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveQuickEdit}
                className="px-4 py-1.5 bg-sky-500 hover:bg-sky-400 text-white font-extrabold rounded-lg text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
          {/* Main Title & Emoji */}
          <div className="flex items-start gap-3.5">
            <span className="text-3xl md:text-4xl p-2.5 rounded-2xl bg-slate-950/80 border border-slate-700 shadow-md shrink-0">
              {node.emoji || '📌'}
            </span>
            <div className="space-y-1">
              <h2 className="text-lg md:text-2xl font-extrabold text-white tracking-tight leading-snug">
                {parseInline(node.label)}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-3 h-3 rounded-full border border-white/40 shadow-sm"
                    style={{ backgroundColor: node.style.backgroundColor }}
                  />
                  <span>Estilo visual asignado</span>
                </div>
                <div className="flex items-center gap-1 font-mono text-[11px] text-slate-400 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">
                  <Move className="w-3 h-3 text-sky-400" />
                  <span>Posición: X: {Math.round(node.x ?? 0)}px, Y: {Math.round(node.y ?? 0)}px</span>
                </div>
              </div>
            </div>
          </div>

          {/* Expanded Multimedia (Video or Image) */}
          {hasMedia && (
            <div className="rounded-xl overflow-hidden border-2 border-slate-700/80 bg-slate-950 shadow-2xl">
              {isYouTube && embedUrl ? (
                <div className="relative aspect-video w-full bg-black">
                  <iframe
                    src={embedUrl}
                    title={node.label}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ) : isDirectVideo ? (
                <div className="relative aspect-video w-full bg-black flex items-center justify-center">
                  <video
                    src={node.media.url}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : isCloudinary ? (
                <div className="relative max-h-[460px] w-full flex items-center justify-center bg-black/60 overflow-hidden">
                  <img
                    src={node.media.url}
                    alt={node.media.caption || node.label}
                    className="max-h-[440px] w-auto max-w-full object-contain rounded-lg shadow-md"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://placehold.co/600x350/1e293b/94a3b8?text=Recurso+Multimedia';
                    }}
                  />
                  <div className="absolute top-2 right-2 px-2.5 py-1 bg-black/75 backdrop-blur-sm rounded-lg text-xs font-bold text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Cloudinary Asset</span>
                  </div>
                </div>
              ) : null}

              {node.media.caption && (
                <div className="p-3 bg-slate-950 border-t border-slate-800 text-xs text-slate-300 italic flex items-center justify-between">
                  <span>{node.media.caption}</span>
                  {node.media.url && (
                    <a
                      href={node.media.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:underline flex items-center gap-1 text-[11px] font-bold not-italic"
                    >
                      <span>Abrir recurso</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Full Expanded Concept Text */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-sky-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                <span>Contenido y Fundamentación Conceptual</span>
              </span>
              <button
                type="button"
                onClick={() => setIsQuickEditing(true)}
                className="text-[11px] text-sky-400 hover:underline font-bold"
              >
                Editar texto
              </button>
            </h3>

            <div className="p-4 md:p-5 rounded-xl bg-slate-950/70 border border-slate-800/90 shadow-inner">
              {node.description ? (
                renderExpandedText(node.description)
              ) : (
                <p className="text-sm text-slate-400 italic">
                  Este concepto no tiene descripción extendida asignada todavía. Puedes agregarla fácilmente usando el botón de <strong>Edición Rápida</strong> arriba.
                </p>
              )}
            </div>
          </div>

          {/* Physical Coordinate Adjuster section */}
          {onUpdateNodePosition && (
            <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Move className="w-4 h-4 text-sky-400 shrink-0" />
                <div>
                  <span className="font-bold text-white">Posición física en el lienzo:</span>
                  <p className="text-[11px] text-slate-400">Puedes arrastrar este nodo en la pantalla o ajustar sus coordenadas:</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="font-mono text-slate-400">X:</span>
                  <input
                    type="number"
                    value={coordX}
                    onChange={(e) => setCoordX(Number(e.target.value))}
                    className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-center font-mono text-xs text-white"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-slate-400">Y:</span>
                  <input
                    type="number"
                    value={coordY}
                    onChange={(e) => setCoordY(Number(e.target.value))}
                    className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-center font-mono text-xs text-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSavePosition}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded font-bold border border-slate-700 transition-colors"
                >
                  Fijar
                </button>
              </div>
            </div>
          )}

          {/* Connected Children Branches */}
          {childNodes.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                <span>Ramas y Conceptos Derivados ({childNodes.length})</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {childNodes.map(({ node: child, edge }) => (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => onNavigateToNode(child.id)}
                    className="p-3 rounded-xl border border-slate-800 hover:border-sky-400 bg-slate-950/50 hover:bg-sky-950/20 text-left transition-all flex items-center justify-between group shadow-sm"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-lg">{child.emoji || '📌'}</span>
                      <div className="truncate">
                        <div className="text-xs font-bold text-white group-hover:text-sky-300 truncate">
                          {child.label}
                        </div>
                        {edge.relationLabel && (
                          <div className="text-[10px] text-amber-300 italic truncate">
                            {edge.relationLabel}
                          </div>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-1 transition-all shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/70 backdrop-blur-md flex items-center justify-between text-xs text-slate-400">
          <span>Presiona <strong>Esc</strong> o haz clic afuera para volver al mapa</span>
          <div className="flex items-center gap-2">
            {onReassignParent && (
              <button
                type="button"
                onClick={() => setIsChangingParent(true)}
                className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg font-bold transition-colors"
              >
                Mover a otro Punto
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-750 text-white rounded-lg font-bold transition-colors border border-slate-700"
            >
              Cerrar Vista
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
