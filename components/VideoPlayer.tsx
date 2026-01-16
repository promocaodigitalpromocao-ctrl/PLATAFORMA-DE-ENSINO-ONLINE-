
import React, { useState, useEffect, useRef } from 'react';
import { Lock, ShieldAlert, Play, AlertCircle } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string;
  onComplete: () => void;
  autoPlay?: boolean;
  initialTime?: number;
  onProgress?: (time: number) => void;
  allowSkip?: boolean;
  thumbnailUrl?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  videoUrl, 
  onComplete, 
  autoPlay = false, 
  initialTime = 0,
  onProgress,
  allowSkip = false,
  thumbnailUrl
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [maxWatched, setMaxWatched] = useState(initialTime);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    setMaxWatched(initialTime);
    if (videoRef.current) videoRef.current.currentTime = initialTime;
  }, [videoUrl, initialTime]);

  const handleTimeUpdate = () => {
    const vid = videoRef.current;
    if (!vid) return;

    if (onProgress) onProgress(vid.currentTime);

    // Se o aluno tentar pular além do que já viu (mais que 2 segundos à frente do recorde)
    if (!allowSkip) {
      if (vid.currentTime > maxWatched + 2) {
        vid.currentTime = maxWatched; // Força volta para onde parou
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 3000);
      } else {
        // Se estiver assistindo normal, atualiza o tempo máximo assistido
        if (vid.currentTime > maxWatched) {
          setMaxWatched(vid.currentTime);
        }
      }
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    videoRef.current?.play();
  };

  return (
    <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 group">
      
      {/* Aviso de Bloqueio */}
      {showWarning && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none animate-in fade-in zoom-in duration-300">
          <div className="bg-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl border border-red-400 flex flex-col items-center gap-2">
            <Lock size={32} />
            <p className="font-bold text-lg">Avanço Bloqueado</p>
            <p className="text-sm opacity-90">Você deve assistir ao conteúdo para liberar este trecho.</p>
          </div>
        </div>
      )}

      {!isPlaying && (
        <div 
          className="absolute inset-0 z-40 bg-zinc-900/90 flex items-center justify-center cursor-pointer group"
          onClick={handlePlay}
        >
          {thumbnailUrl && <img src={thumbnailUrl} className="absolute inset-0 w-full h-full object-cover opacity-30" alt="Capa" />}
          <div className="bg-indigo-600 p-8 rounded-full shadow-2xl transform group-hover:scale-110 transition-transform">
            <Play size={48} className="text-white fill-white ml-2" />
          </div>
        </div>
      )}

      <video 
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full"
        onTimeUpdate={handleTimeUpdate}
        onEnded={onComplete}
        controls={isPlaying}
        controlsList="nodownload" // Remove botão de download
        onContextMenu={(e) => e.preventDefault()} // Desabilita botão direito
      />

      {!allowSkip && isPlaying && (
        <div className="absolute top-6 left-6 z-10">
          <div className="bg-emerald-600/20 backdrop-blur-md border border-emerald-500/30 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2">
            <ShieldAlert size={14} /> MODO DE APRENDIZAGEM ATIVO
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
