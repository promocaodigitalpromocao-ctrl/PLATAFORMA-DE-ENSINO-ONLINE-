
import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Loader2, Lock, ShieldAlert, FastForward } from 'lucide-react';
import { Logo } from './Logo';

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
  const [error, setError] = useState<{code: number, msg: string} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  
  // Rastreia o ponto máximo assistido
  const [maxWatched, setMaxWatched] = useState(initialTime);
  const [showLockedMessage, setShowLockedMessage] = useState(false);
  const lockedMessageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper para detectar YouTube
  const getYouTubeId = (url: string) => {
      if (!url) return null;
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
  };

  const youtubeId = getYouTubeId(videoUrl);

  // Reinicia estados quando a URL muda
  useEffect(() => {
    setIsLoading(autoPlay);
    setError(null);
    setIsEnded(false);
    setIsPlaying(autoPlay);
    setMaxWatched(initialTime); 
    setShowLockedMessage(false);

    if (!videoUrl) {
        setIsLoading(false);
        setError({ code: 0, msg: "URL não fornecida" });
        return;
    }

    if (!youtubeId && videoRef.current) {
        if (!autoPlay) {
            videoRef.current.pause();
            videoRef.current.currentTime = initialTime;
        } else {
            // Pequeno delay para garantir que o DOM atualizou
            setTimeout(() => {
                if (videoRef.current && initialTime > 0) {
                    videoRef.current.currentTime = initialTime;
                }
            }, 100);
        }
    }
  }, [videoUrl, initialTime, autoPlay, youtubeId]);

  const handlePlayClick = () => {
      setIsPlaying(true);
      if (!youtubeId) {
          setIsLoading(true);
          if (videoRef.current) {
              videoRef.current.play().catch(err => console.error("Erro ao iniciar play:", err));
          }
      }
  };

  // --- LÓGICA ANTI-SKIP (Apenas para vídeo nativo HTML5) ---
  const handleSeekCheck = () => {
    const vid = videoRef.current;
    if (!vid || allowSkip || isEnded) return;

    const currentTime = vid.currentTime;
    // Tolerância de 1 segundo para evitar falsos positivos em lags de rede
    if (currentTime > maxWatched + 1.0) {
        vid.currentTime = maxWatched; // Força voltar para onde estava
        setShowLockedMessage(true);
        
        if (lockedMessageTimeoutRef.current) clearTimeout(lockedMessageTimeoutRef.current);
        lockedMessageTimeoutRef.current = setTimeout(() => setShowLockedMessage(false), 3000);
    }
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const vid = e.currentTarget;
    const time = vid.currentTime;
    
    if (onProgress) onProgress(time);
    
    // Verificação dupla no TimeUpdate
    if (!allowSkip && !isEnded && time > maxWatched + 1.0) {
        handleSeekCheck();
    } else {
        if (time > maxWatched) {
            setMaxWatched(time);
        }
    }
  };

  if (error) {
     return (
         <div className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center border border-red-500/20 rounded-xl p-6 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none"></div>
            <AlertTriangle className="text-red-500 mb-3 relative z-10" size={40} />
            <h3 className="text-white font-bold mb-2 relative z-10">Vídeo Indisponível</h3>
            <p className="text-zinc-400 text-sm max-w-md relative z-10">{error.msg}</p>
        </div>
     );
  }
  
  const hasCustomThumbnail = thumbnailUrl && !thumbnailUrl.includes('picsum');

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg group border border-zinc-800 select-none">
        
        {/* THUMBNAIL OVERLAY (CAPA) */}
        {!isPlaying && !error && (
            <div 
                className="absolute inset-0 z-40 bg-zinc-900 flex items-center justify-center cursor-pointer group/overlay overflow-hidden"
                onClick={handlePlayClick}
                title="Clique para assistir"
            >
                {hasCustomThumbnail ? (
                    <img 
                        src={thumbnailUrl} 
                        alt="Capa da Aula" 
                        className="w-full h-full object-cover opacity-80 group-hover/overlay:opacity-100 transition-opacity duration-300"
                    />
                ) : (
                     <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-zinc-950 opacity-80"></div>
                        <div className="opacity-30 group-hover/overlay:opacity-60 transform transition-all duration-500 grayscale group-hover/overlay:grayscale-0 scale-100 group-hover/overlay:scale-110">
                            <Logo size={120} showText={false} />
                        </div>
                     </div>
                )}
            </div>
        )}

        {/* LOADER (Apenas para vídeo nativo) */}
        {!youtubeId && isLoading && isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-10">
                <Loader2 className="text-indigo-500 animate-spin" size={40} />
            </div>
        )}

        {/* Mensagem de Bloqueio (Anti-Skip) */}
        {showLockedMessage && (
            <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-black/90 backdrop-blur-md text-white px-6 py-4 rounded-xl border border-red-500/30 flex flex-col items-center gap-2 shadow-2xl transform scale-100">
                    <div className="bg-red-500/20 p-3 rounded-full">
                        <Lock size={24} className="text-red-500" />
                    </div>
                    <p className="font-bold text-lg text-red-100">Vídeo Bloqueado</p>
                    <p className="text-sm text-zinc-400 text-center max-w-[200px]">Você deve assistir todo o conteúdo sem pular.</p>
                </div>
            </div>
        )}

        {/* PLAYER YOUTUBE */}
        {youtubeId && isPlaying ? (
             <iframe 
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
             ></iframe>
        ) : (
             /* PLAYER NATIVO (MP4, WebM, etc) */
             <video 
                ref={videoRef}
                src={videoUrl}
                className={`w-full h-full object-contain ${youtubeId ? 'hidden' : 'block'}`}
                controls
                playsInline
                controlsList="nodownload" 
                onTimeUpdate={handleTimeUpdate}
                onSeeking={handleSeekCheck} // PROTEÇÃO ATIVADA: Bloqueia arrastar a barra
                onEnded={() => {
                    setIsEnded(true);
                    setMaxWatched(Number.MAX_SAFE_INTEGER);
                    onComplete();
                }}
                onError={() => {
                    if (isPlaying && !youtubeId) {
                        setError({ code: 5, msg: "Erro ao carregar vídeo. Verifique se o link é um arquivo direto (MP4) ou YouTube." });
                        setIsLoading(false);
                    }
                }}
                onLoadStart={() => { if (isPlaying) setIsLoading(true); }}
                onCanPlay={() => {
                    setIsLoading(false);
                    if (videoRef.current && initialTime > 0 && Math.abs(videoRef.current.currentTime - initialTime) > 2) {
                        videoRef.current.currentTime = initialTime;
                    }
                }}
            />
        )}
        
        {/* Anti-Skip Badge & Admin Indicator (Só aparece se não for YouTube e estiver tocando) */}
        {!youtubeId && !isEnded && !isLoading && !error && isPlaying && (
             <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-1 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity">
                 {allowSkip ? (
                     <div className="bg-amber-500/90 backdrop-blur-md text-black text-[10px] font-bold px-3 py-1.5 rounded-full border border-amber-500/50 flex items-center gap-1.5 shadow-sm">
                          <FastForward size={12} /> 
                          <span>ADMIN: PULO LIBERADO</span>
                     </div>
                 ) : (
                     <div className="bg-black/60 backdrop-blur-md text-zinc-300 text-[10px] font-bold px-3 py-1.5 rounded-full border border-zinc-700/50 flex items-center gap-1.5 shadow-sm">
                          <ShieldAlert size={12} className="text-indigo-400" /> 
                          <span>ANTI-SKIP RIGOROSO</span>
                     </div>
                 )}
             </div>
        )}
    </div>
  );
};

export default VideoPlayer;
