import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  Save,
  Trash2,
  Sparkles,
  Link2,
  Smile,
  Video,
  Image as ImageIcon,
  Palette,
  ChevronLeft,
  FolderTree,
  ExternalLink,
  Layers,
  ArrowRight,
  Search,
  CheckCircle2,
  AlertCircle,
  Play,
  X
} from 'lucide-react';
import { ConceptEdge, ConceptNode, NodeType, MediaType, ConceptMapData } from '../types/conceptMap';
import { COLOR_PRESETS, POPULAR_EMOJIS, SAMPLE_MAP_AI, DEFAULT_CONCEPT_MAP } from '../utils/sampleMaps';
import { extractYouTubeId, getYouTubeThumbnail, getYouTubeEmbedUrl } from '../utils/youtube';

interface SidebarProps {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
  selectedNode: ConceptNode | null;
  isOpen: boolean;
  themeMode?: 'dark' | 'light';
  onToggleOpen: () => void;
  onAddNode: (nodeData: Omit<ConceptNode, 'id'>, parentNodeId: string | null, relationLabel: string) => void;
  onUpdateNode: (
    nodeId: string,
    nodeData: Partial<ConceptNode>,
    parentNodeId?: string | null,
    relationLabel?: string
  ) => void;
  onDeleteNode: (nodeId: string) => void;
  onClearAll: () => void;
  onSelectNode: (nodeId: string | null) => void;
  onLoadTemplate: (template: ConceptMapData) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  nodes,
  edges,
  selectedNode,
  isOpen,
  onToggleOpen,
  onAddNode,
  onUpdateNode,
  onDeleteNode,
  onClearAll,
  onSelectNode,
  onLoadTemplate,
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'tree' | 'templates'>('form');

  // Form states
  const [parentNodeId, setParentNodeId] = useState<string>('');
  const [parentSearch, setParentSearch] = useState<string>('');
  const [nodeType, setNodeType] = useState<NodeType>('topic');
  const [label, setLabel] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [relationLabel, setRelationLabel] = useState<string>('se relaciona con');
  const [emoji, setEmoji] = useState<string>('💡');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState<boolean>(false);

  // Media states
  const [mediaType, setMediaType] = useState<MediaType>('none');
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [mediaCaption, setMediaCaption] = useState<string>('');
  const [isSidebarVideoPlaying, setIsSidebarVideoPlaying] = useState<boolean>(false);

  // Style states
  const [backgroundColor, setBackgroundColor] = useState<string>('#1E40AF');
  const [textColor, setTextColor] = useState<string>('#FFFFFF');
  const [borderColor, setBorderColor] = useState<string>('#3B82F6');

  // Sync form when selected node changes
  useEffect(() => {
    if (selectedNode) {
      setNodeType(selectedNode.type);
      setLabel(selectedNode.label);
      setDescription(selectedNode.description || '');
      setEmoji(selectedNode.emoji || '📌');
      setMediaType(selectedNode.media?.type || 'none');
      setMediaUrl(selectedNode.media?.url || '');
      setMediaCaption(selectedNode.media?.caption || '');
      setBackgroundColor(selectedNode.style.backgroundColor || '#1E40AF');
      setTextColor(selectedNode.style.textColor || '#FFFFFF');
      setBorderColor(selectedNode.style.borderColor || '#3B82F6');

      const incomingEdge = edges.find((e) => e.target === selectedNode.id);
      if (incomingEdge) {
        setParentNodeId(incomingEdge.source);
        setRelationLabel(incomingEdge.relationLabel || '');
      } else {
        setParentNodeId('');
      }
    } else {
      resetForm();
    }
  }, [selectedNode, edges]);

  const resetForm = () => {
    setNodeType('topic');
    setLabel('');
    setDescription('');
    setRelationLabel('se fundamenta en');
    setEmoji('💡');
    setMediaType('none');
    setMediaUrl('');
    setMediaCaption('');
    setParentNodeId(nodes[0]?.id || '');

    setBackgroundColor('#1E40AF');
    setTextColor('#FFFFFF');
    setBorderColor('#3B82F6');
  };

  const handleApplyPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setBackgroundColor(preset.bg);
    setTextColor(preset.text);
    setBorderColor(preset.border);
    setNodeType(preset.level);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    if (selectedNode) {
      onUpdateNode(
        selectedNode.id,
        {
          type: nodeType,
          label: label.trim(),
          description: description.trim(),
          emoji,
          media: {
            type: mediaType,
            url: mediaUrl.trim(),
            caption: mediaCaption.trim(),
          },
          style: {
            backgroundColor,
            textColor,
            borderColor,
          },
        },
        parentNodeId || null,
        relationLabel.trim()
      );
    } else {
      onAddNode(
        {
          type: nodeType,
          label: label.trim(),
          description: description.trim(),
          emoji,
          media: {
            type: mediaType,
            url: mediaUrl.trim(),
            caption: mediaCaption.trim(),
          },
          style: {
            backgroundColor,
            textColor,
            borderColor,
          },
        },
        parentNodeId || null,
        relationLabel.trim()
      );
      resetForm();
    }
  };

  // Helper to prevent cycle when reparenting
  const isDescendant = (currentParentId: string, targetNodeId: string): boolean => {
    const directChildren = edges
      .filter((e) => e.source === currentParentId)
      .map((e) => e.target);
    if (directChildren.includes(targetNodeId)) return true;
    return directChildren.some((childId) => isDescendant(childId, targetNodeId));
  };

  const filteredParentNodes = nodes.filter((n) => {
    if (selectedNode) {
      if (n.id === selectedNode.id) return false;
      if (isDescendant(selectedNode.id, n.id)) return false;
    }
    return n.label.toLowerCase().includes(parentSearch.toLowerCase());
  });

  return (
    <aside
      className={`fixed lg:static top-16 bottom-0 left-0 z-40 transition-all duration-300 flex flex-col shadow-2xl backdrop-blur-2xl bg-slate-900/95 border-r border-slate-700/80 text-white select-none ${
        isOpen ? 'w-80 md:w-96 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:border-none'
      }`}
    >
      {/* Top Sidebar Tab Navigation - Translucent Glass Effect */}
      <div className="flex items-center justify-between px-3 pt-3 border-b border-slate-700/80 bg-slate-950/70 backdrop-blur-md">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`px-3 py-2 text-xs font-extrabold rounded-t-lg transition-colors flex items-center gap-1.5 border-b-2 ${
              activeTab === 'form'
                ? 'border-sky-400 text-sky-300 bg-slate-900/90 shadow-sm'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5 text-sky-400" />
            <span>{selectedNode ? 'Editar Nodo' : 'Nuevo Nodo'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tree')}
            className={`px-3 py-2 text-xs font-extrabold rounded-t-lg transition-colors flex items-center gap-1.5 border-b-2 ${
              activeTab === 'tree'
                ? 'border-sky-400 text-sky-300 bg-slate-900/90 shadow-sm'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5 text-emerald-400" />
            <span>Árbol ({nodes.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('templates')}
            className={`px-3 py-2 text-xs font-extrabold rounded-t-lg transition-colors flex items-center gap-1.5 border-b-2 ${
              activeTab === 'templates'
                ? 'border-sky-400 text-sky-300 bg-slate-900/90 shadow-sm'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Ejemplos</span>
          </button>
        </div>

        {/* Close/Toggle button */}
        <button
          type="button"
          onClick={onToggleOpen}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg lg:hidden"
          title="Ocultar panel lateral"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Main Tab Content with High-Contrast Typography & Translucent Cards */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Status indicator when in Edit Mode */}
            {selectedNode && (
              <div className="flex items-center justify-between p-3 bg-indigo-950/90 border-2 border-indigo-400 rounded-xl text-xs shadow-lg">
                <div className="flex items-center gap-2 text-indigo-100 font-extrabold">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse shadow-md shadow-sky-400/50" />
                  <span>Modo Edición: <strong className="text-white underline">{selectedNode.label}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectNode(null)}
                  className="text-[11px] text-sky-300 hover:text-white font-extrabold underline transition-colors"
                >
                  Nuevo
                </button>
              </div>
            )}

            {/* 1. Parent Node Selection (Origin Connection Point - Available for both new and existing nodes) */}
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/70 border border-slate-700/80 shadow-md">
              <label className="text-xs font-extrabold text-white flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center justify-center text-[10px] font-bold">1</span>
                  <Link2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {selectedNode
                      ? 'Punto de Conexión de Origen (Mover de un punto a otro)'
                      : 'Nodo Padre (Origen de la Conexión)'}
                  </span>
                </span>
              </label>

              {selectedNode && (
                <p className="text-[11px] text-slate-300 leading-tight">
                  Cambia a qué nodo padre se conecta este concepto para reubicarlo en otra rama del mapa.
                </p>
              )}

              {nodes.length > 0 ? (
                <div className="space-y-2 pt-1">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Filtrar nodos padre por nombre..."
                      value={parentSearch}
                      onChange={(e) => setParentSearch(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-400 shadow-inner font-bold"
                    />
                  </div>
                  <select
                    value={parentNodeId}
                    onChange={(e) => setParentNodeId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400 shadow-inner font-bold"
                  >
                    <option value="">(Sin padre - Nodo Raíz Autónomo)</option>
                    {filteredParentNodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.emoji} {n.label} [{n.type}]
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="text-xs text-amber-300 font-bold italic pt-1">
                  El mapa está vacío. Este será el nodo raíz fundacional.
                </p>
              )}
            </div>

            {/* 2. Logical Connector (Relation Label) */}
            {parentNodeId && (
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/70 border border-slate-700/80 shadow-md">
                <label className="text-xs font-extrabold text-white flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/40 flex items-center justify-center text-[10px] font-bold">2</span>
                    <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
                    <span>Conector Lógico (Frase sobre la flecha)</span>
                  </span>
                </label>
                <input
                  type="text"
                  value={relationLabel}
                  onChange={(e) => setRelationLabel(e.target.value)}
                  placeholder="ej. se fundamenta en / regulado por / da origen a"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-400 shadow-inner font-bold"
                />
                <div className="flex flex-wrap gap-1 pt-1">
                  {['se fundamenta en', 'se compone de', 'genera', 'ejemplo de', 'regulado por', 'produce'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRelationLabel(preset)}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Node Level Hierarchy */}
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/70 border border-slate-700/80 shadow-md">
              <label className="text-xs font-extrabold text-white flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/40 flex items-center justify-center text-[10px] font-bold">3</span>
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                <span>Nivel Jerárquico del Concepto</span>
              </label>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {[
                  { id: 'root', label: 'Raíz', desc: 'Central', color: 'border-amber-400' },
                  { id: 'topic', label: 'Rama Principal', desc: 'Tema Mayor', color: 'border-emerald-400' },
                  { id: 'subtopic', label: 'Subtema', desc: 'Intermedio', color: 'border-sky-400' },
                  { id: 'detail', label: 'Detalle', desc: 'Caso o Ejemplo', color: 'border-purple-400' },
                ].map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => {
                      setNodeType(lvl.id as NodeType);
                      const preset = COLOR_PRESETS.find((p) => p.level === lvl.id);
                      if (preset) {
                        setBackgroundColor(preset.bg);
                        setTextColor(preset.text);
                        setBorderColor(preset.border);
                      }
                    }}
                    className={`p-2.5 rounded-lg border-2 text-left transition-all ${
                      nodeType === lvl.id
                        ? `${lvl.color} bg-sky-500/30 text-white font-extrabold ring-2 ring-sky-400/50 shadow-md`
                        : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-500 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-extrabold text-white">{lvl.label}</div>
                    <div className="text-[10px] text-slate-300 font-semibold">{lvl.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Concept Title & Emoji */}
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/70 border border-slate-700/80 shadow-md">
              <label className="text-xs font-extrabold text-white flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/40 flex items-center justify-center text-[10px] font-bold">4</span>
                <Smile className="w-3.5 h-3.5 text-sky-400" />
                <span>Título del Concepto y Emoji</span>
              </label>
              <div className="flex gap-2 pt-1">
                {/* Emoji trigger */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                    className="w-12 h-10 rounded-lg bg-slate-900 border-2 border-slate-700 hover:border-sky-400 flex items-center justify-center text-xl transition-colors shadow-inner"
                    title="Cambiar emoji"
                  >
                    {emoji}
                  </button>

                  {/* Floating emoji selector */}
                  {isEmojiPickerOpen && (
                    <div className="absolute top-12 left-0 z-50 p-3 bg-slate-900 border-2 border-slate-600 rounded-xl shadow-2xl w-64 backdrop-blur-2xl">
                      <div className="text-xs text-white font-extrabold mb-2 flex justify-between items-center">
                        <span>Selecciona un ícono:</span>
                        <button
                          type="button"
                          onClick={() => setIsEmojiPickerOpen(false)}
                          className="text-slate-400 hover:text-white font-extrabold px-1"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="grid grid-cols-6 gap-1.5 max-h-40 overflow-y-auto">
                        {POPULAR_EMOJIS.map((em) => (
                          <button
                            key={em}
                            type="button"
                            onClick={() => {
                              setEmoji(em);
                              setIsEmojiPickerOpen(false);
                            }}
                            className="p-1.5 text-lg hover:bg-slate-800 rounded transition-transform hover:scale-125"
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <input
                  type="text"
                  required
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Título breve y claro (ej. Ventaja Absoluta)"
                  className="flex-1 bg-slate-900 border-2 border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-400 font-extrabold shadow-inner"
                />
              </div>
            </div>

            {/* 5. Description / Markdown Extended Content */}
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/70 border border-slate-700/80 shadow-md">
              <label className="text-xs font-extrabold text-white flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/40 flex items-center justify-center text-[10px] font-bold">5</span>
                  <span>Explicación / Contenido Extendido</span>
                </span>
                <span className="text-[10px] text-sky-300 font-bold bg-sky-950/80 px-2 py-0.5 rounded border border-sky-500/30">
                  Markdown & Viñetas (- )
                </span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Escribe la explicación detallada, principios teóricos o viñetas con guiones (- Punto 1)..."
                rows={4}
                className="w-full bg-slate-900 border-2 border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-400 resize-none font-medium leading-relaxed shadow-inner"
              />
            </div>

            {/* 6. Multimedia Attachment (Cloudinary / YouTube) */}
            <div className="space-y-2.5 p-3 bg-slate-950/70 border border-slate-700/80 rounded-xl shadow-md">
              <label className="text-xs font-extrabold text-white flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/40 flex items-center justify-center text-[10px] font-bold">6</span>
                  <Video className="w-3.5 h-3.5 text-sky-400" />
                  <span>Adjunto Multimedia</span>
                </span>
                <span className="text-[10px] text-emerald-300 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                  Video o Imagen
                </span>
              </label>

              {/* Media type toggle */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900 rounded-lg border border-slate-700">
                <button
                  type="button"
                  onClick={() => setMediaType('none')}
                  className={`py-1.5 text-[11px] font-extrabold rounded transition-colors ${
                    mediaType === 'none'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Sin Recurso
                </button>
                <button
                  type="button"
                  onClick={() => setMediaType('cloudinary_image')}
                  className={`py-1.5 text-[11px] font-extrabold rounded transition-colors flex items-center justify-center gap-1 ${
                    mediaType === 'cloudinary_image'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <ImageIcon className="w-3 h-3 text-emerald-300" />
                  <span>Cloudinary</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMediaType('youtube_video')}
                  className={`py-1.5 text-[11px] font-extrabold rounded transition-colors flex items-center justify-center gap-1 ${
                    mediaType === 'youtube_video'
                      ? 'bg-red-600 text-white shadow'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Video className="w-3 h-3 text-red-300" />
                  <span>YouTube</span>
                </button>
              </div>

              {/* Cloudinary Input */}
              {mediaType === 'cloudinary_image' && (
                <div className="space-y-2 pt-1 animate-fade-in">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-white font-bold">URL Imagen Directa / Cloudinary:</span>
                      <button
                        type="button"
                        onClick={() =>
                          setMediaUrl('https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=800&q=80')
                        }
                        className="text-[10px] text-sky-400 hover:underline font-extrabold"
                      >
                        Demo comercio
                      </button>
                    </div>
                    <input
                      type="url"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder="https://res.cloudinary.com/... ó URL https://"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-400 font-bold"
                    />
                  </div>

                  {mediaUrl && (
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-700 bg-black/60">
                      <img
                        src={mediaUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://placehold.co/400x200/1e293b/ef4444?text=URL+no+valida';
                        }}
                      />
                    </div>
                  )}

                  <input
                    type="text"
                    value={mediaCaption}
                    onChange={(e) => setMediaCaption(e.target.value)}
                    placeholder="Pie de foto / subtítulo explicativo..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-[11px] text-white placeholder:text-slate-400 focus:outline-none font-medium"
                  />
                </div>
              )}

              {/* YouTube Input */}
              {mediaType === 'youtube_video' && (
                <div className="space-y-2 pt-1 animate-fade-in">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-white font-bold">URL del Video de YouTube:</span>
                      <button
                        type="button"
                        onClick={() =>
                          setMediaUrl('https://www.youtube.com/watch?v=kYv_8wXlYvU')
                        }
                        className="text-[10px] text-red-400 hover:underline font-extrabold"
                      >
                        Insertar demo
                      </button>
                    </div>
                    <input
                      type="url"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=... ó youtu.be/..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-400 font-bold"
                    />
                  </div>

                  {mediaUrl && (
                    <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-slate-700 bg-black shadow-md">
                      {extractYouTubeId(mediaUrl) ? (
                        isSidebarVideoPlaying ? (
                          <div className="relative w-full h-full bg-black">
                            <iframe
                              src={getYouTubeEmbedUrl(mediaUrl) || ''}
                              title="Sidebar Video Preview"
                              className="w-full h-full border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                            />
                            <button
                              type="button"
                              onClick={() => setIsSidebarVideoPlaying(false)}
                              className="absolute top-1 right-1 p-1 bg-black/85 hover:bg-black text-rose-300 rounded shadow"
                              title="Cerrar reproductor"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => setIsSidebarVideoPlaying(true)}
                            className="relative w-full h-full cursor-pointer group/yt"
                          >
                            <img
                              src={getYouTubeThumbnail(mediaUrl) || ''}
                              alt="YT Preview"
                              className="w-full h-full object-cover group-hover/yt:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 group-hover/yt:bg-black/20 flex flex-col items-center justify-center gap-1 transition-colors">
                              <div className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white shadow-xl transition-transform group-hover/yt:scale-110">
                                <Play className="w-5 h-5 fill-current ml-0.5" />
                              </div>
                              <span className="text-[10px] font-extrabold text-white bg-black/75 px-2 py-0.5 rounded-full border border-white/20">
                                ▶ Probar y reproducir video aquí
                              </span>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-amber-300 p-2 text-center font-bold">
                          Ingresa un enlace válido de YouTube
                        </div>
                      )}
                    </div>
                  )}

                  <input
                    type="text"
                    value={mediaCaption}
                    onChange={(e) => setMediaCaption(e.target.value)}
                    placeholder="Descripción o crédito del video..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-[11px] text-white placeholder:text-slate-400 focus:outline-none font-medium"
                  />
                </div>
              )}
            </div>

            {/* 7. Aesthetic Customization (Colors) */}
            <div className="space-y-2 p-3 bg-slate-950/70 border border-slate-700/80 rounded-xl shadow-md">
              <label className="text-xs font-extrabold text-white flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/40 flex items-center justify-center text-[10px] font-bold">7</span>
                  <Palette className="w-3.5 h-3.5 text-sky-400" />
                  <span>Personalización Estética (Colores)</span>
                </span>
                <span className="text-[10px] text-slate-300 font-bold">Paletas Rápidas</span>
              </label>

              {/* Presets Grid */}
              <div className="flex flex-wrap gap-2 pt-1">
                {COLOR_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="w-7 h-7 rounded-full border-2 border-white/60 transition-transform hover:scale-125 focus:outline-none shadow-md"
                    style={{ backgroundColor: p.bg }}
                    title={p.name}
                  />
                ))}
              </div>

              {/* Detailed Color Pickers */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-[10px] text-slate-200 font-extrabold mb-1">Fondo:</label>
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-full h-8 rounded border border-slate-700 cursor-pointer bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-200 font-extrabold mb-1">Texto:</label>
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-full h-8 rounded border border-slate-700 cursor-pointer bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-200 font-extrabold mb-1">Borde:</label>
                  <input
                    type="color"
                    value={borderColor}
                    onChange={(e) => setBorderColor(e.target.value)}
                    className="w-full h-8 rounded border border-slate-700 cursor-pointer bg-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Actions Form Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="submit"
                className={`w-full py-2.5 px-4 text-white rounded-xl text-xs font-extrabold transition-all shadow-lg flex items-center justify-center gap-2 ${
                  selectedNode
                    ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/40'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/40'
                }`}
              >
                {selectedNode ? (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Guardar Cambios del Nodo</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>+ Agregar Nodo al Mapa</span>
                  </>
                )}
              </button>

              {selectedNode && (
                <button
                  type="button"
                  onClick={() => onDeleteNode(selectedNode.id)}
                  className="w-full py-2 px-4 bg-rose-500/25 hover:bg-rose-500/40 border-2 border-rose-500/60 text-rose-200 rounded-xl text-xs font-extrabold transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar Nodo con sus Ramas Hijas</span>
                </button>
              )}

              <button
                type="button"
                onClick={resetForm}
                className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-colors border border-slate-600"
              >
                Limpiar Formulario
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Hierarchy Tree View */}
        {activeTab === 'tree' && (
          <div className="space-y-3">
            <div className="text-xs text-slate-200 font-bold">
              Explora y selecciona nodos directamente desde la jerarquía:
            </div>

            <div className="space-y-1.5 max-h-[70vh] overflow-y-auto pr-1">
              {nodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                const childCount = edges.filter((e) => e.source === node.id).length;

                return (
                  <div
                    key={node.id}
                    onClick={() => onSelectNode(node.id)}
                    className={`p-2.5 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-sky-400 bg-sky-500/30 text-white font-extrabold ring-2 ring-sky-400/50'
                        : 'border-slate-800 hover:border-slate-600 bg-slate-950/70 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-base">{node.emoji}</span>
                      <div className="truncate">
                        <div className="text-xs font-bold text-white truncate">{node.label}</div>
                        <div className="text-[10px] text-slate-400 capitalize">
                          {node.type} • {childCount} ramas
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {node.media.type !== 'none' && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm" title="Contiene multimedia" />
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteNode(node.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Eliminar nodo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={onClearAll}
              className="w-full py-2.5 px-3 border border-dashed border-rose-500/70 hover:border-rose-400 text-rose-300 hover:bg-rose-500/20 rounded-xl text-xs font-extrabold transition-colors flex items-center justify-center gap-1.5 mt-4"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpiar Todo el Mapa</span>
            </button>
          </div>
        )}

        {/* Tab 3: Prebuilt Templates */}
        {activeTab === 'templates' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-200 font-bold">
              Carga un mapa conceptual prediseñado completo:
            </p>

            {/* Template 1: Comercio Internacional */}
            <div
              onClick={() => onLoadTemplate(DEFAULT_CONCEPT_MAP)}
              className="p-3.5 rounded-xl border-2 border-slate-700/80 hover:border-sky-400 bg-slate-950/70 hover:bg-sky-950/30 cursor-pointer transition-all space-y-2 group shadow-md"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white group-hover:text-sky-300 flex items-center gap-1.5">
                  <span>🌐</span>
                  <span>Fundamentos del Comercio Internacional</span>
                </h4>
                <span className="text-[10px] bg-sky-500/25 text-sky-300 font-bold px-2 py-0.5 rounded-full border border-sky-500/30">
                  22 Nodos
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Estructura completa con teorías (Smith, Ricardo, H-O), políticas, aranceles y organismos multilaterales (OMC, FMI, BM).
              </p>
            </div>

            {/* Template 2: Inteligencia Artificial */}
            <div
              onClick={() => onLoadTemplate(SAMPLE_MAP_AI)}
              className="p-3.5 rounded-xl border-2 border-slate-700/80 hover:border-purple-400 bg-slate-950/70 hover:bg-purple-950/30 cursor-pointer transition-all space-y-2 group shadow-md"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white group-hover:text-purple-300 flex items-center gap-1.5">
                  <span>🤖</span>
                  <span>IA y Modelos Generativos</span>
                </h4>
                <span className="text-[10px] bg-purple-500/25 text-purple-300 font-bold px-2 py-0.5 rounded-full border border-purple-500/30">
                  5 Nodos
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Machine Learning, Deep Learning, Arquitectura Transformers y Modelos de Lenguaje Masivos (LLMs).
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
