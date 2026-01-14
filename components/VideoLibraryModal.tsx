
import React, { useEffect, useState, useRef } from 'react';
import { videoStore, VideoMetadata } from '../services/videoStore';
import { X, UploadCloud, Copy, Check, FileVideo, Loader2, Play, ShieldCheck, AlertCircle, ArrowRightCircle, PlusSquare, HardDrive, Smartphone } from 'lucide-react';
import VideoPlayer from './VideoPlayer';

interface VideoLibraryModalProps {
  onClose: () => void;
  onSelect?: (url: string, title: string) => void;
  onCreateLesson?: (url: string, title: string) => void;
}

const VideoLibraryModal: React.FC<VideoLibraryModalProps> = ({ onClose, onSelect, onCreateLesson }) => {
  const [videos, setVideos] = useState<VideoMetadata[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [previewVideoId, setPreviewVideoId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    const data = await videoStore.getAllMetadata();
    setVideos(data);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate type
      if (!file.type.includes('mp4') && !file.type.includes('webm')) {
          alert("Por favor, envie apenas arquivos MP4 ou WebM para garantir a reprodução em todos os navegadores.");
          return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      const interval = setInterval(() => {
        setUploadProgress(prev => (prev >= 90 ? 90 : prev + 10));
      }, 100);

      try {
        await videoStore.saveVideo(file);
        clearInterval(interval);
        setUploadProgress(100);
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
          loadVideos();
        }, 500);
      } catch (error) {
        clearInterval(interval);
        console.error(error);
        alert("Erro ao salvar vídeo.");
        setIsUploading(false);
      }
    }
  };

  const handleApprove = async (id: string) => {
    await videoStore.approveVideo(id);
    loadVideos();
  };

  const handleCopyLink = (id: string) => {
    const link = `local-video:${id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSelectVideo = (video: VideoMetadata) => {
    if (!video.approved) {
        alert("Você precisa APROVAR o vídeo antes de usá-lo em uma aula.");
        return; 
    }
    if (onSelect) {
        onSelect(`local-video:${video.id}`, video.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleCreateLesson = (video: VideoMetadata) => {
    if (!video.approved) {
        alert("Você precisa APROVAR o vídeo antes de criar uma aula com ele.");
        return;
    }
    if (onCreateLesson) {
        onCreateLesson(`local-video:${video.id}`, video.name.replace(/\.[^/.]+$/, ""));
    }
  }

  const openPreview = (id: string) => {
    setPreviewVideoId(id);
    setPreviewVideoUrl(`local-video:${id}`);
  };

  const closePreview = () => {
    setPreviewVideoUrl(null);
    setPreviewVideoId(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200 relative">
        
        <div className="flex justify-between items-center p-6 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/10 p-2 rounded-lg">
               <HardDrive className="text-indigo-500" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Testes Locais (Apenas PC)</h2>
              <p className="text-sm text-zinc-400">
                  Vídeos salvos apenas neste navegador
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-zinc-800 rounded-lg">
            <X size={24} />
          </button>
        </div>
        
        {/* WARNING BANNER */}
        <div className="bg-red-500/10 border-b border-red-500/20 p-4 flex items-start gap-3">
            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={24} />
            <div className="text-sm text-zinc-300">
                <p className="font-bold text-red-400 mb-1">NÃO USE ESTA OPÇÃO PARA CELULAR</p>
                Os vídeos que você enviar por aqui funcionam <strong>APENAS NO SEU COMPUTADOR</strong>.
                Eles não vão aparecer no celular dos alunos, nem em outros computadores.
                <br/><br/>
                <strong>Para funcionar em qualquer lugar:</strong> Coloque o vídeo no seu site ou use o Google Drive.
            </div>
        </div>

        <div className="p-6 border-b border-zinc-800 bg-zinc-900/50">
           <button 
             onClick={() => fileInputRef.current?.click()}
             disabled={isUploading}
             className="w-full border-2 border-dashed border-zinc-700 hover:border-indigo-500 hover:bg-zinc-800/50 transition-all rounded-xl p-6 flex flex-col items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed"
           >
             <input 
               type="file" 
               ref={fileInputRef} 
               className="hidden" 
               accept="video/mp4,video/webm"
               onChange={handleFileSelect}
             />
             
             {isUploading ? (
               <div className="flex flex-col items-center">
                 <Loader2 size={32} className="text-indigo-500 animate-spin mb-2" />
                 <span className="text-zinc-300 font-medium">Salvando localmente... {uploadProgress}%</span>
               </div>
             ) : (
               <>
                 <div className="bg-zinc-800 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                   <UploadCloud size={32} className="text-zinc-400 group-hover:text-indigo-400" />
                 </div>
                 <h3 className="text-lg font-medium text-white mb-1">Upload para Teste Local</h3>
                 <p className="text-zinc-500 text-sm font-medium">Use apenas se quiser ver como fica antes de publicar</p>
               </>
             )}
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {videos.length === 0 ? (
            <div className="text-center py-10 text-zinc-500">
              Nenhum vídeo de teste salvo.
            </div>
          ) : (
            videos.map((video) => (
              <div key={video.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex items-center justify-between hover:border-zinc-700 transition-colors">
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="bg-zinc-900 p-3 rounded-lg shrink-0 relative">
                    <FileVideo size={24} className={video.approved ? "text-emerald-500" : "text-amber-500"} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-white font-medium truncate flex items-center gap-2">
                        {video.name}
                        <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">Local</span>
                    </h4>
                    <p className="text-xs text-zinc-500">
                      {formatSize(video.size)} • {video.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-4">
                  {/* SELECT BUTTON (If Select Mode) */}
                  {onSelect && (
                      <button
                        onClick={() => handleSelectVideo(video)}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-colors mr-2 ${
                            video.approved 
                            ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' 
                            : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300'
                        }`}
                        title="Usar vídeo (Apenas Local)"
                      >
                         USAR LOCAL <ArrowRightCircle size={16} />
                      </button>
                  )}
                  
                  {!onSelect && onCreateLesson && (
                       <button
                        onClick={() => handleCreateLesson(video)}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-colors mr-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                        title="Criar aula de teste"
                      >
                         CRIAR AULA (TESTE) <PlusSquare size={16} />
                      </button>
                  )}

                  {!video.approved && (
                      <button
                        onClick={() => handleApprove(video.id)}
                        className="p-2 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                        title="Aprovar Vídeo"
                      >
                          <ShieldCheck size={18} />
                      </button>
                  )}

                  <button 
                    onClick={() => openPreview(video.id)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 text-zinc-300 hover:bg-indigo-600 hover:text-white rounded-lg text-sm font-medium transition-colors"
                    title="Assistir"
                  >
                    <Play size={14} /> Visualizar
                  </button>

                  {/* DELETE BUTTON REMOVED */}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Preview Overlay */}
        {previewVideoUrl && (
          <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-5xl bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-700 shadow-2xl flex flex-col">
              <div className="flex justify-between items-center p-4 border-b border-zinc-800">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Play size={20} className="text-indigo-500"/> Pré-visualização
                </h3>
                <button 
                  onClick={closePreview}
                  className="text-zinc-400 hover:text-white hover:bg-zinc-800 p-2 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-4 bg-black flex justify-center">
                 <div className="w-full max-w-4xl aspect-video">
                    <VideoPlayer 
                      videoUrl={previewVideoUrl}
                      onComplete={() => {}}
                      autoPlay={true}
                    />
                 </div>
              </div>

              {/* Approve Bar in Preview */}
              {previewVideoId && videos.find(v => v.id === previewVideoId && !v.approved) && (
                  <div className="p-4 bg-amber-500/10 border-t border-amber-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-amber-500">
                          <AlertCircle size={20} />
                          <span className="font-medium">Este vídeo ainda não foi aprovado.</span>
                      </div>
                      <button 
                        onClick={async () => {
                            if (previewVideoId) {
                                await handleApprove(previewVideoId);
                                closePreview();
                            }
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-lg shadow-emerald-900/20"
                      >
                          <ShieldCheck size={20} />
                          Aprovar Vídeo
                      </button>
                  </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoLibraryModal;
