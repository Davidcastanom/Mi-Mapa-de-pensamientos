import React, { useState } from 'react';
import { X, Copy, Download, Upload, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { ConceptMapData } from '../types/conceptMap';

interface JsonModalProps {
  mapData: ConceptMapData;
  onImport: (newData: ConceptMapData) => void;
  onClose: () => void;
}

export const JsonModal: React.FC<JsonModalProps> = ({ mapData, onImport, onClose }) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [copied, setCopied] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  // Clean export without transient UI coordinates if preferred or including coordinates
  const cleanJson = JSON.stringify(
    {
      mapTitle: mapData.mapTitle,
      rootNodeId: mapData.rootNodeId,
      nodes: mapData.nodes.map((n) => ({
        id: n.id,
        type: n.type,
        label: n.label,
        description: n.description,
        emoji: n.emoji,
        media: n.media,
        style: n.style,
      })),
      edges: mapData.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        relationLabel: e.relationLabel,
      })),
    },
    null,
    2
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cleanJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownloadFile = () => {
    const blob = new Blob([cleanJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const sanitizedTitle = (mapData.mapTitle || 'mapa_conceptual')
      .toLowerCase()
      .replace(/[^a-z0-9]/gi, '_');
    link.download = `${sanitizedTitle}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setPasteContent(content);
      validateAndApply(content);
    };
    reader.readAsText(file);
  };

  const validateAndApply = (text: string) => {
    setImportError(null);
    try {
      const parsed = JSON.parse(text);

      if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
        throw new Error('El JSON debe contener un arreglo válido de "nodes".');
      }

      if (!parsed.edges || !Array.isArray(parsed.edges)) {
        throw new Error('El JSON debe contener un arreglo válido de "edges".');
      }

      // Check node minimum structure
      for (const n of parsed.nodes) {
        if (!n.id || !n.label) {
          throw new Error('Cada nodo debe tener al menos un "id" y un "label".');
        }
      }

      const validatedData: ConceptMapData = {
        mapTitle: parsed.mapTitle || 'Mapa Conceptual Importado',
        rootNodeId: parsed.rootNodeId || parsed.nodes[0]?.id || 'node-root',
        nodes: parsed.nodes.map((n: any, index: number) => ({
          id: String(n.id || `node-${index + 1}`),
          type: n.type || (index === 0 ? 'root' : 'topic'),
          label: String(n.label || 'Concepto'),
          description: String(n.description || ''),
          emoji: String(n.emoji || '📌'),
          media: {
            type: n.media?.type || 'none',
            url: n.media?.url || '',
            caption: n.media?.caption || '',
          },
          style: {
            backgroundColor: n.style?.backgroundColor || '#1e3a8a',
            textColor: n.style?.textColor || '#ffffff',
            borderColor: n.style?.borderColor || '#3b82f6',
          },
        })),
        edges: parsed.edges.map((e: any, index: number) => ({
          id: String(e.id || `edge-${index}`),
          source: String(e.source),
          target: String(e.target),
          relationLabel: String(e.relationLabel || ''),
        })),
      };

      onImport(validatedData);
      onClose();
    } catch (err: any) {
      setImportError(err.message || 'Formato JSON inválido.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Gestión de Esquema JSON</span>
              <span className="text-xs bg-indigo-500/20 text-indigo-300 font-mono px-2 py-0.5 rounded">
                Schema v1.0
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Exporta la estructura completa o importa un mapa conceptual en formato JSON.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab buttons */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('export')}
            className={`pb-2.5 px-4 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'export'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Exportar JSON</span>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`pb-2.5 px-4 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'import'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Importar JSON</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'export' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">
                  {mapData.nodes.length} nodos • {mapData.edges.length} relaciones
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-medium transition-colors border border-slate-700"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Código</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDownloadFile}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar .json</span>
                  </button>
                </div>
              </div>

              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto max-h-[380px] leading-relaxed selection:bg-emerald-900">
                {cleanJson}
              </pre>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-xl p-6 text-center transition-colors bg-slate-950/40">
                <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-200">
                  Arrastra un archivo .json o selecciona desde tu equipo
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Estructura compatible con nodes y edges
                </p>
                <label className="mt-3 inline-block">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <span className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 text-xs font-semibold rounded-lg cursor-pointer border border-slate-700 transition-colors">
                    Examinar archivo
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  O pega el contenido JSON aquí:
                </label>
                <textarea
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  placeholder={`{\n  "mapTitle": "Mi Mapa",\n  "nodes": [...],\n  "edges": [...]\n}`}
                  rows={8}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {importError && (
                <div className="flex items-center gap-2 p-3 bg-red-950/50 border border-red-800/80 rounded-xl text-xs text-red-300">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setPasteContent('')}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
                >
                  Limpiar
                </button>
                <button
                  onClick={() => validateAndApply(pasteContent)}
                  disabled={!pasteContent.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Procesar e Importar</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
