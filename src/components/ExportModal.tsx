import React, { useState } from 'react';
import {
  X,
  FileImage,
  FileText,
  CheckCircle2,
  Loader2,
  Sparkles,
  Download,
  Copy,
  ExternalLink,
  Printer,
  Maximize2,
  RefreshCw,
  Check,
  ZoomIn,
  ZoomOut,
  Info,
  Move,
  Sliders,
  Maximize
} from 'lucide-react';
import { ExportOptions, ConceptMapData, LayoutDirection } from '../types/conceptMap';
import { ExportResult, downloadBlob, copyImageToClipboard, openBlobInNewTab } from '../utils/exportUtils';

interface ExportModalProps {
  mapData: ConceptMapData;
  direction: LayoutDirection;
  themeMode: 'dark' | 'light';
  onExport: (options: ExportOptions) => Promise<ExportResult>;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  mapData,
  direction,
  themeMode,
  onExport,
  onClose,
}) => {
  const [format, setFormat] = useState<'png' | 'pdf'>('png');
  const [scale, setScale] = useState<1 | 2 | 3>(2);
  const [backgroundColor, setBackgroundColor] = useState<'dark' | 'white' | 'transparent'>('dark');
  const [pageOrientation, setPageOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [pageSize, setPageSize] = useState<'a4' | 'letter'>('a4');

  // Custom positioning & spacing options
  const [layoutMode, setLayoutMode] = useState<'custom' | 'auto'>('custom');
  const [spacingMultiplier, setSpacingMultiplier] = useState<number>(1.0);

  const [isExporting, setIsExporting] = useState(false);
  const [exportStep, setExportStep] = useState<string>('');
  const [lastResult, setLastResult] = useState<ExportResult | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [previewZoom, setPreviewZoom] = useState<number>(1);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsExporting(true);
    setExportError(null);
    setExportStep('Calculando geometría y encuadre de tus nodos...');

    try {
      await new Promise((r) => setTimeout(r, 60));
      setExportStep('Renderizando nodos con tus posiciones personalizadas...');

      const result = await onExport({
        format,
        scale,
        backgroundColor,
        pageOrientation,
        pageSize,
        includeHeaderFooter: true,
        layoutMode,
        spacingMultiplier,
      });

      setExportStep('Optimizando compresión y preparando archivo...');
      await new Promise((r) => setTimeout(r, 80));

      setLastResult(result);
      setPreviewZoom(1);
    } catch (err: any) {
      console.error('Error durante la exportación:', err);
      setExportError(err?.message || 'Ocurrió un error inesperado al procesar el archivo.');
    } finally {
      setIsExporting(false);
      setExportStep('');
    }
  };

  const handleCopyClipboard = async () => {
    if (!lastResult) return;
    const ok = await copyImageToClipboard(lastResult.dataUrl);
    if (ok) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const handleDownloadAgain = () => {
    if (!lastResult) return;
    downloadBlob(lastResult.blob, lastResult.filename);
  };

  const handleOpenInTab = () => {
    if (!lastResult) return;
    openBlobInNewTab(lastResult.blob);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/95 shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span>Exportación Profesional de Mapa Conceptual</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Genera archivos de alta resolución PNG y PDF sin pixelado, recortes ni pérdida de datos.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {exportError && (
            <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-3">
              <Info className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-rose-100">Error durante la exportación</div>
                <div className="mt-0.5">{exportError}</div>
                <div className="mt-2 text-[11px] text-rose-300">
                  Intenta cambiar el fondo o la resolución y presiona nuevamente Generar.
                </div>
              </div>
            </div>
          )}

          {/* VIEW: RESULT PREVIEW & ACTION SUITE */}
          {lastResult ? (
            <div className="space-y-5 animate-fade-in">
              {/* Success Notification Bar */}
              <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 flex items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-emerald-100">
                      ¡Archivo {lastResult.format.toUpperCase()} generado con éxito!
                    </div>
                    <div className="text-[11px] text-emerald-300/90 font-mono">
                      {lastResult.filename} • {formatFileSize(lastResult.fileSizeBytes)} • {lastResult.width} × {lastResult.height} px
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setLastResult(null)}
                  className="px-2.5 py-1 text-[11px] font-bold text-emerald-300 hover:text-white hover:bg-emerald-800/40 rounded-lg transition-colors flex items-center gap-1 shrink-0"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Otros ajustes</span>
                </button>
              </div>

              {/* Direct Actions Toolbar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* 1. Direct Download Button */}
                <button
                  type="button"
                  onClick={handleDownloadAgain}
                  className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Archivo</span>
                </button>

                {/* 2. Copy to Clipboard Button (PNG) */}
                <button
                  type="button"
                  onClick={handleCopyClipboard}
                  className={`px-4 py-3 border rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    isCopied
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-200'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-100'
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>¡Copiada al Portapapeles!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-sky-400" />
                      <span>Copiar al Portapapeles</span>
                    </>
                  )}
                </button>

                {/* 3. Open in New Tab / Print */}
                <button
                  type="button"
                  onClick={handleOpenInTab}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  {lastResult.format === 'pdf' ? (
                    <>
                      <Printer className="w-4 h-4 text-rose-400" />
                      <span>Abrir / Imprimir PDF</span>
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4 text-amber-400" />
                      <span>Abrir en Pestaña</span>
                    </>
                  )}
                </button>
              </div>

              {/* Interactive High-Res Preview Canvas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-300">
                    Vista previa de alta definición:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPreviewZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
                      className="p-1 rounded hover:bg-slate-800 text-slate-300"
                      title="Alejar vista previa"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-[10px] w-12 text-center text-sky-400 font-bold">
                      {Math.round(previewZoom * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setPreviewZoom((z) => Math.min(2.5, +(z + 0.25).toFixed(2)))}
                      className="p-1 rounded hover:bg-slate-800 text-slate-300"
                      title="Acercar vista previa"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewZoom(1)}
                      className="p-1 rounded hover:bg-slate-800 text-slate-300"
                      title="Restablecer tamaño"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="relative w-full h-80 rounded-xl border border-slate-800 bg-slate-950/80 overflow-auto flex items-center justify-center p-4">
                  {lastResult.format === 'pdf' ? (
                    <div className="flex flex-col items-center justify-center gap-3 text-center p-6">
                      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                        <FileText className="w-8 h-8" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Documento PDF Listo</div>
                        <div className="text-xs text-slate-400 mt-1 max-w-sm">
                          El archivo PDF contiene el mapa jerárquico diagramado, membrete con fecha, conteo de nodos y pie formal.
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={handleDownloadAgain}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Descargar PDF</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleOpenInTab}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Visualizar en visor</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={lastResult.dataUrl}
                      alt="Vista previa del mapa"
                      style={{
                        transform: `scale(${previewZoom})`,
                        transformOrigin: 'center center',
                        transition: 'transform 0.15s ease-out',
                      }}
                      className="max-w-none shadow-2xl rounded-lg border border-slate-800"
                    />
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* VIEW: SETTINGS & EXPORT TRIGGER */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 1. Format Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  1. Formato de Archivo
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormat('png')}
                    className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all text-left ${
                      format === 'png'
                        ? 'border-indigo-500 bg-indigo-500/10 text-white ring-1 ring-indigo-500 shadow-md'
                        : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl ${format === 'png' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      <FileImage className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">Imagen PNG</div>
                      <div className="text-xs text-slate-400">Ultra nítida, 1x/2x/3x para diapositivas</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormat('pdf')}
                    className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all text-left ${
                      format === 'pdf'
                        ? 'border-indigo-500 bg-indigo-500/10 text-white ring-1 ring-indigo-500 shadow-md'
                        : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl ${format === 'pdf' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">Documento PDF</div>
                      <div className="text-xs text-slate-400">Estructurado con membrete formal y pie</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* PNG Settings */}
              {format === 'png' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      2. Resolución de Exportación
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { val: 1, label: '1x Estándar', desc: 'Rápido, Web' },
                        { val: 2, label: '2x Alta Definición (HD)', desc: 'Recomendada, muy nítida' },
                        { val: 3, label: '3x Ultra HD 4K', desc: 'Impresión y póster' },
                      ].map((s) => (
                        <button
                          key={s.val}
                          type="button"
                          onClick={() => setScale(s.val as 1 | 2 | 3)}
                          className={`p-3 rounded-xl border text-center transition-all ${
                            scale === s.val
                              ? 'border-indigo-500 bg-indigo-500/15 text-indigo-200 font-bold shadow-md'
                              : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div className="text-xs font-bold">{s.label}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{s.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      3. Color de Fondo
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'dark', label: 'Modo Oscuro', colorBg: 'bg-slate-900 border-slate-700' },
                        { id: 'white', label: 'Blanco / Papel Claro', colorBg: 'bg-white border-slate-400' },
                        { id: 'transparent', label: 'Transparente (PNG)', colorBg: 'bg-transparent border-dashed border-slate-500' },
                      ].map((bg) => (
                        <button
                          key={bg.id}
                          type="button"
                          onClick={() => setBackgroundColor(bg.id as any)}
                          className={`p-2.5 rounded-xl border text-center text-xs transition-all flex items-center justify-center gap-2 ${
                            backgroundColor === bg.id
                              ? 'border-indigo-500 bg-indigo-500/20 text-white font-bold ring-1 ring-indigo-500'
                              : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 rounded-full border ${bg.colorBg} shrink-0`} />
                          <span>{bg.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* PDF Settings */}
              {format === 'pdf' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      2. Orientación de Hoja
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPageOrientation('landscape')}
                        className={`p-3 rounded-xl border text-center text-xs transition-all ${
                          pageOrientation === 'landscape'
                            ? 'border-indigo-500 bg-indigo-500/15 text-indigo-200 font-bold shadow-md'
                            : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="font-bold">Horizontal (Landscape)</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Óptimo para mapas y ramas</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPageOrientation('portrait')}
                        className={`p-3 rounded-xl border text-center text-xs transition-all ${
                          pageOrientation === 'portrait'
                            ? 'border-indigo-500 bg-indigo-500/15 text-indigo-200 font-bold shadow-md'
                            : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="font-bold">Vertical (Portrait)</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Para documentos verticales</div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      3. Tamaño de Hoja y Tema
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={pageSize}
                        onChange={(e) => setPageSize(e.target.value as any)}
                        className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
                      >
                        <option value="a4">Formato Estándar A4 (210 × 297 mm)</option>
                        <option value="letter">Formato Carta / Letter (8.5 × 11 in)</option>
                      </select>

                      <select
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value as any)}
                        className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-bold"
                      >
                        <option value="dark">Tema Oscuro (Elegante)</option>
                        <option value="white">Tema Claro (Para Impresión)</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* 4. Ubicación y Disposición de Nodos */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Disposición de Nodos y Posiciones
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setLayoutMode('custom')}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                      layoutMode === 'custom'
                        ? 'border-indigo-500 bg-indigo-500/15 text-white ring-1 ring-indigo-500 shadow-md'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg mt-0.5 ${
                        layoutMode === 'custom' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Move className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold flex items-center gap-1.5">
                        <span>Posiciones del Lienzo</span>
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded font-bold">
                          Tus Modificaciones
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                        Conserva con total precisión los lugares, distancias y movimientos que ajustaste en pantalla.
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLayoutMode('auto')}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                      layoutMode === 'auto'
                        ? 'border-indigo-500 bg-indigo-500/15 text-white ring-1 ring-indigo-500 shadow-md'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg mt-0.5 ${
                        layoutMode === 'auto' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold">Reorganizar con Dagre</div>
                      <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                        Calcula una cuadrícula jerárquica algorítmica preestablecida de arriba hacia abajo.
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 5. Espaciado y Separación entre Nodos para Impresión */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Espaciado entre Nodos para Impresión
                  </label>
                  <span className="text-[11px] font-bold text-indigo-400">
                    {spacingMultiplier === 1.0 ? 'Posición Exacta (1.0x)' : `${spacingMultiplier}x de Amplitud`}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { val: 1.0, label: '1.0x Exacto', desc: 'Sin cambios' },
                    { val: 1.25, label: '1.25x Amplio', desc: '+25% espacio' },
                    { val: 1.5, label: '1.5x Extra', desc: '+50% espacio' },
                    { val: 2.0, label: '2.0x Máximo', desc: '+100% aire' },
                  ].map((sp) => (
                    <button
                      key={sp.val}
                      type="button"
                      onClick={() => setSpacingMultiplier(sp.val)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        spacingMultiplier === sp.val
                          ? 'border-indigo-500 bg-indigo-500/20 text-white font-bold ring-1 ring-indigo-500 shadow-sm'
                          : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-xs font-bold">{sp.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{sp.desc}</div>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed italic">
                  💡 Si deseas más espacio entre nodos (ej. 1.25x o 1.5x), el mapa expandirá proporcionalmente la distancia entre cada concepto para que ningún nodo se sienta apretado y los textos sean 100% legibles al imprimir.
                </p>
              </div>

              {/* Progress Indicator when exporting */}
              {isExporting && (
                <div className="p-4 rounded-xl bg-indigo-950/50 border border-indigo-500/40 text-indigo-200 flex items-center gap-3 animate-pulse">
                  <Loader2 className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />
                  <div className="text-xs font-medium">
                    <div className="font-bold text-indigo-100">Generando exportación...</div>
                    <div className="text-[11px] text-indigo-300">{exportStep}</div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isExporting}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isExporting}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Procesando archivo...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Generar y Descargar {format.toUpperCase()}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
