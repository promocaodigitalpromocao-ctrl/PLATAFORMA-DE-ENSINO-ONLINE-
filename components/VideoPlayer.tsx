
import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Lock, ShieldAlert, Play, RotateCcw } from 'lucide-react';
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
  
  // maxWatched rastreia o ponto mais distante assistido nesta sessão
  const [maxWatched, setMaxWatched] = useState(initialTime);
  const [showLockedMessage, setShowLockedMessage] = useState(false);
  const lockedMessageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const youtubeId = (url: string) => {
      if (!url) return null;
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
  }(videoUrl);

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
        videoRef.current.currentTime = initialTime;
    }
  }, [videoUrl, initialTime]);

  const handlePlayClick = () => {
      setIsPlaying(true);
      if (!youtubeId && videoRef.current) {
          setIsLoading(true);
          videoRef.current.play().catch(err => console.error("Erro ao iniciar play:", err));
      }
  };

  // Esta é a função CRÍTICA que impede o pulo
  const handleSeekCheck = () => {
    const vid = videoRef.current;
    if (!vid || allowSkip || isEnded) return;

    // Se o tempo atual for maior que o máximo assistido (com margem de 1s), volta
    if (vid.currentTime > maxWatched + 1.2) {
        vid.currentTime = maxWatched;
        setShowLockedMessage(true);
        if (lockedMessageTimeoutRef.current) clearTimeout(lockedMessageTimeoutRef.current);
        lockedMessageTimeoutRef.current = setTimeout(() => setShowLockedMessage(false), 3000);
    }
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const vid = e.currentTarget;
    const time = vid.currentTime;
    
    if (onProgress) onProgress(time);
    
    // Se o aluno está assistindo normalmente, atualizamos o maxWatched
    if (!allowSkip && !isEnded) {
        if (time > maxWatched && time <= maxWatched + 2) {
            setMaxWatched(time);
        } else if (time > maxWatched + 2) {
            // Tentativa de pulo detectada via barra de progresso
            handleSeekCheck();
        }
    }
  };

  const handleRateChange = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const vid = e.currentTarget;
    if (!allowSkip && vid.playbackRate > 1.5) {
        vid.playbackRate = 1;
        alert("Para garantir o aprendizado, a velocidade máxima permitida é 1.5x.");
    }
  };

  if (error) {
     return (
         <div className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center border border-red-500/20 rounded-xl p-6 text-center">
            <AlertTriangle className="text-red-500 mb-3" size={40} />
            <h3 className="text-white font-bold mb-2">Vídeo Indisponível</h3>
            <p className="text-zinc-400 text-sm max-w-md">{error.msg}</p>
        </div>
     );
  }
  
  const hasCustomThumbnail = thumbnailUrl && !thumbnailUrl.includes('picsum');

  return (
    <div 
        className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl group border border-zinc-800 select-none"
        onContextMenu={(e) => !allowSkip && e.preventDefault()}
    >
        {!isPlaying && !error && (
            <div 
                className="absolute inset-0 z-40 bg-zinc-900 flex items-center justify-center cursor-pointer overflow-hidden"
                onClick={handlePlayClick}
            >
                {hasCustomThumbnail ? (
                    <img src={thumbnailUrl} alt="Capa" className="w-full h-full object-cover opacity-60" />
                ) : (
                    <div className="opacity-20"><Logo size={120} showText={false} /></div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                    <div className="bg-indigo-600 p-6 rounded-full shadow-2xl transform group-hover:scale-110 transition-transform flex items-center justify-center">
                        <Play size={36} className="text-white fill-white ml-1" />
                    </div>
                </div>
            </div>
        )}

        {showLockedMessage && (
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-50 flex items-center justify-center pointer-events-none animate-in fade-in zoom-in-95 duration-200 px-4">
                <div className="bg-black/90 backdrop-blur-md text-white px-6 py-4 rounded-2xl border border-red-500/30 flex flex-col items-center gap-3 shadow-2xl text-center max-w-xs">
                    <div className="bg-red-500/20 p-3 rounded-full">
                        <Lock size={28} className="text-red-500" />
                    </div>
                    <div>
                        <p className="font-bold text-lg leading-tight">Trecho Bloqueado</p>
                        <p className="text-sm text-zinc-400 mt-1">Você precisa assistir ao conteúdo anterior para liberar este ponto.</p>
                    </div>
                </div>
            </div>
        )}

        {youtubeId && isPlaying ? (
             <iframe 
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&controls=${allowSkip ? 1 : 0}&disablekb=1`}
                title="Player"
                allow="autoplay; encrypted-media"
                allowFullScreen
             ></iframe>
        ) : (
             <video 
                ref={videoRef}
                src={videoUrl}
                className={`w-full h-full object-contain ${youtubeId ? 'hidden' : 'block'}`}
                controls={allowSkip || isPlaying}
                playsInline
                controlsList="nodownload noremoteplayback" 
                onTimeUpdate={handleTimeUpdate}
                onSeeking={handleSeekCheck}
                onRateChange={handleRateChange}
                onEnded={() => {
                    setIsEnded(true);
                    onComplete();
                }}
                onError={() => isPlaying && setError({ code: 5, msg: "Erro no arquivo de vídeo. Verifique o link." })}
                onLoadStart={() => setIsLoading(true)}
                onCanPlay={() => setIsLoading(false)}
            />
        )}
        
        {!allowSkip && isPlaying && !isEnded && (
             <div className="absolute top-4 left-4 z-20 pointer-events-none">
                <div className="bg-black/60 backdrop-blur-md text-emerald-400 text-[10px] font-bold px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-2">
                    <ShieldAlert size={12} /> 
                    <span>MODO APRENDIZAGEM ATIVO</span>
                </div>
             </div>
        )}
    </div>
  );
};

export default VideoPlayer;
