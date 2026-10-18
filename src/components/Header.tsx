import React, { useState } from 'react';
import {
  Network,
  Sun,
  Moon,
  FileCode2,
  FileImage,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  Edit2,
  Check,
  Download,
  Palette,
  RotateCcw
} from 'lucide-react';

export type PastelShade = 'mist' | 'linen' | 'sage' | 'lavender';

interface HeaderProps {
  mapTitle: string;
  onUpdateTitle: (newTitle: string) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  themeMode: 'dark' | 'light';
  onToggleTheme: () => void;
  pastelShade: PastelShade;
  onSelectPastelShade: (shade: PastelShade) => void;
  onOpenJsonModal: () => void;
  onOpenExportModal: () => void;
  onQuickExportPng: () => void;
  onQuickExportPdf: () => void;
  onResetToDefault?: () => void;
  nodeCount: number;
  edgeCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  mapTitle,
  onUpdateTitle,
  isSidebarOpen,
  onToggleSidebar,
  themeMode,
  onToggleTheme,
  pastelShade,
  onSelectPastelShade,
  onOpenJsonModal,
  onOpenExportModal,
  onQuickExportPng,
  onQuickExportPdf,
  onResetToDefault,
  nodeCount,
  edgeCount,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(mapTitle);
  const [isPastelPickerOpen, setIsPastelPickerOpen] = useState(false);

  const handleSaveTitle = () => {
    if (tempTitle.trim()) {
      onUpdateTitle(tempTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const isDark = themeMode === 'dark';

  const pastelOptions: { id: PastelShade; label: string; color: string; desc: string }[] = [
    { id: 'linen', label: 'Lino / Arena Cálido', color: '#e6e1d6', desc: 'Tono papel natural, reduce fatiga' },
    { id: 'mist', label: 'Niebla Suave', color: '#dce3eb', desc: 'Gris celeste descansado' },
    { id: 'sage', label: 'Salvia Zen', color: '#dae4dc', desc: 'Verde tenue tranquilizante' },
    { id: 'lavender', label: 'Lavanda Pálido', color: '#ded8e8', desc: 'Púrpura suave anti-reflejo' },
  ];

  return (
    <header className="h-16 px-4 md:px-6 flex items-center justify-between z-30 select-none backdrop-blur-2xl bg-slate-900/95 border-b border-slate-700/80 text-white shadow-xl">
      {/* Left: Sidebar toggle + App Logo & Editable Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title={isSidebarOpen ? 'Ocultar panel lateral' : 'Mostrar panel lateral'}
        >
          {isSidebarOpen ? <PanelLeftClose className="w-5 h-5 text-sky-400" /> : <PanelLeftOpen className="w-5 h-5 text-sky-400" />}
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
            <Network className="w-5 h-5" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              {isEditingTitle ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTitle();
                      if (e.key === 'Escape') setIsEditingTitle(false);
                    }}
                    autoFocus
                    className="bg-slate-950 border border-sky-400 rounded px-2.5 py-0.5 text-sm font-bold text-white focus:outline-none shadow-inner"
                  />
                  <button
                    onClick={handleSaveTitle}
                    className="p-1 text-emerald-400 hover:text-emerald-300"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => {
                    setTempTitle(mapTitle);
                    setIsEditingTitle(true);
                  }}
                  className="group flex items-center gap-1.5 cursor-pointer"
                  title="Clic para renombrar el mapa"
                >
                  <h1 className="text-sm md:text-base font-bold text-white tracking-tight group-hover:text-sky-300 transition-colors">
                    {mapTitle}
                  </h1>
                  <Edit2 className="w-3.5 h-3.5 text-slate-400 opacity-60 group-hover:opacity-100 group-hover:text-sky-300 transition-all" />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="font-bold text-sky-400">ConceptMap Studio</span>
              <span>•</span>
              <span className="text-slate-300">{nodeCount} nodos</span>
              <span>•</span>
              <span className="text-slate-300">{edgeCount} conectores</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Actions, Export Buttons, Pastel selector, Theme */}
      <div className="flex items-center gap-2">
        {/* Reset Template Button */}
        {onResetToDefault && (
          <button
            onClick={onResetToDefault}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border shadow-sm bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-700"
            title="Restaurar mapa completo de estudio (27 nodos)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden xl:inline">Restaurar Ejemplo</span>
            <span className="xl:hidden">Ejemplo</span>
          </button>
        )}

        {/* JSON Import/Export Button */}
        <button
          onClick={onOpenJsonModal}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border shadow-sm bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-700"
          title="Importar o exportar esquema JSON"
        >
          <FileCode2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>JSON</span>
        </button>

        {/* Quick Export PNG */}
        <button
          onClick={onQuickExportPng}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border shadow-sm bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white border-slate-700"
          title="Descargar imagen PNG en alta resolución"
        >
          <FileImage className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden md:inline">Descargar PNG</span>
          <span className="md:hidden">PNG</span>
        </button>

        {/* Quick Export PDF */}
        <button
          onClick={onQuickExportPdf}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border shadow-sm bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white border-slate-700"
          title="Exportar documento PDF formateado"
        >
          <FileText className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden md:inline">Descargar PDF</span>
          <span className="md:hidden">PDF</span>
        </button>

        {/* Full Export Settings Modal */}
        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-indigo-600/30"
          title="Opciones avanzadas de exportación"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Exportar...</span>
        </button>

        <div className="w-px h-5 mx-1 hidden sm:block bg-slate-750" />

        {/* Pastel Tone Selector (Active in Light/Pastel Mode) */}
        {!isDark && (
          <div className="relative">
            <button
              onClick={() => setIsPastelPickerOpen(!isPastelPickerOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-indigo-500/50 rounded-lg text-xs font-bold text-sky-300 shadow-sm transition-colors"
              title="Cambiar tono pastel anti-reflejo"
            >
              <Palette className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden lg:inline capitalize">Tono Pastel</span>
            </button>

            {isPastelPickerOpen && (
              <div className="absolute right-0 top-11 z-50 w-56 p-2 bg-slate-900 border-2 border-slate-700 rounded-xl shadow-2xl space-y-1 animate-fade-in backdrop-blur-2xl">
                <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">
                  Tonos Pastel Anti-Fatiga
                </div>
                {pastelOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      onSelectPastelShade(opt.id);
                      setIsPastelPickerOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-left transition-all ${
                      pastelShade === opt.id
                        ? 'bg-sky-500/20 border border-sky-400 text-sky-200 font-bold'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-white/40 shadow shrink-0"
                      style={{ backgroundColor: opt.color }}
                    />
                    <div>
                      <div className="text-xs font-bold text-white">{opt.label}</div>
                      <div className="text-[10px] text-slate-400">{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-lg transition-colors text-slate-300 hover:text-amber-300 hover:bg-slate-800"
          title={isDark ? 'Cambiar a modo pastel suave (Anti-Reflejo)' : 'Cambiar a modo oscuro'}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-400" />}
        </button>
      </div>
    </header>
  );
};
