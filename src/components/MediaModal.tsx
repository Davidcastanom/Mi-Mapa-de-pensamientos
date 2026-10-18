import React from 'react';
import { X, ExternalLink, Play, Image as ImageIcon } from 'lucide-react';
import { NodeMedia } from '../types/conceptMap';
import { getYouTubeEmbedUrl } from '../utils/youtube';

interface MediaModalProps {
  media: NodeMedia | null;
  nodeTitle?: string;
  onClose: () => void;
}

export const MediaModal: React.FC<MediaModalProps> = ({ media, nodeTitle, onClose }) => {
  if (!media || media.type === 'none') return null;

  const isYouTube = media.type === 'youtube_video';
  const embedUrl = isYouTube ? getYouTubeEmbedUrl(media.url) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isYouTube ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
              {isYouTube ? <Play className="w-5 h-5 fill-current" /> : <ImageIcon className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                {isYouTube ? 'Reproductor Multimedia de YouTube' : 'Visualizador de Imagen Cloudinary'}
              </h3>
              {nodeTitle && (
                <p className="text-xs text-slate-400">
                  Concepto: <span className="text-indigo-400 font-medium">{nodeTitle}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={media.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Abrir enlace original"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Cerrar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[360px] md:min-h-[460px]">
          {isYouTube && embedUrl ? (
            <iframe
              src={embedUrl}
              title={nodeTitle || 'YouTube Video Player'}
              className="w-full h-full min-h-[380px] md:min-h-[480px] border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <img
                src={media.url}
                alt={media.caption || nodeTitle || 'Multimedia Concepto'}
                className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://placehold.co/600x400/1e293b/94a3b8?text=Imagen+no+disponible';
                }}
              />
            </div>
          )}
        </div>

        {/* Caption / Footer */}
        {media.caption && (
          <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 text-sm text-slate-300 italic flex items-center gap-2">
            <span className="text-indigo-400 font-medium not-italic text-xs uppercase tracking-wide">
              Pie de recurso:
            </span>
            <span>{media.caption}</span>
          </div>
        )}
      </div>
    </div>
  );
};
