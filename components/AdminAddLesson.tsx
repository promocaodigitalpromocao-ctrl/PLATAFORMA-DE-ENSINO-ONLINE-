
import React, { useState, useEffect } from 'react';
import { Module } from '../types';
import { X, Plus, Video, CheckCircle, Play, ShieldCheck, Link as LinkIcon, Check, Pencil, Eye, EyeOff, Clock, Save, HardDrive, Info } from 'lucide-react';
import { db } from '../services/database';
import VideoPlayer from './VideoPlayer';

interface AdminAddLessonProps {
  modules: Module[];
  onClose: () => void;
  onSuccess: (updatedModules: Module[]) => void;
  initialData?: {
    videoUrl: string;
    title: string;
    description?: string;
    duration?: string;
    moduleId?: string;
    lessonId?: string; 
  } | null;
}

const AdminAddLesson: React.FC<AdminAddLessonProps> = ({ modules, onClose, onSuccess, initialData }) => {
  const [localModules, setLocalModules] = useState<Module[]>(modules);
  const [moduleId, setModuleId] = useState(modules[0]?.id || '');
  
  const [isCreatingModule, setIsCreatingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');

  const [isEditingModule, setIsEditingModule] = useState(false);
  const [editingModuleTitle, setEditingModuleTitle] = useState('');
  const [editingModuleVisible, setEditingModuleVisible] = useState(true);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [duration, setDuration] = useState(''); 
  const [thumbnail, setThumbnail] = useState('https://picsum.photos/400/225');
  
  const [isApproved, setIsApproved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [isEditingLesson, setIsEditingLesson] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

  useEffect(() => {
    setLocalModules(modules);
    if (!initialData?.moduleId) {
        if (modules.length > 0 && !moduleId) {
            setModuleId(modules[0].id);
        } else if (modules.length === 0) {
            setModuleId('');
            setIsCreatingModule(true);
        }
    }
  }, [modules]);

  useEffect(() => {
    if (initialData) {
      setVideoUrl(initialData.videoUrl);
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      setDuration(initialData.duration || '00:00:30'); 

      if (initialData.moduleId) {
          setModuleId(initialData.moduleId);
      }
      
      if (initialData.lessonId) {
          setIsEditingLesson(true);
          setEditingLessonId(initialData.lessonId);
          setIsApproved(true);
      } else {
          setIsApproved(true); 
          setShowPreview(true);
      }
    } else {
        setDuration('00:00:30');
    }
  }, [initialData]);

  // Monitora mudanças na URL
  useEffect(() => {
    if (!videoUrl) return;
    if (videoUrl !== initialData?.videoUrl) {
         setIsApproved(false);
    }
  }, [videoUrl]);

  const handleUrlBlur = () => {
     let clean = videoUrl.trim();
     
     // Auto-fix Dropbox links para modo streaming (dl=1)
     if (clean.includes('dropbox.com')) {
         if (clean.includes('dl=0')) {
             clean = clean.replace('dl=0', 'dl=1');
         } else if (!clean.includes('dl=1')) {
             if (clean.includes('?')) {
                 if (!clean.includes('dl=')) clean += '&dl=1';
             } else {
                 clean += '?dl=1';
             }
         }
     }
     
     // Force HTTPS
     if (clean.startsWith('http://')) {
         clean = clean.replace('http://', 'https://');
     }
     
     if (clean !== videoUrl) {
         setVideoUrl(clean);
     }
  };

  const handleConfirmCreateModule = () => {
    if (!newModuleTitle.trim()) {
        alert("Digite o nome do módulo para confirmar.");
        return;
    }
    const updatedModules = db.addModule(newModuleTitle.trim());
    const newModule = updatedModules[updatedModules.length - 1];
    setLocalModules(updatedModules);
    setModuleId(newModule.id);
    setIsCreatingModule(false);
    setNewModuleTitle('');
    onSuccess(updatedModules);
  };

  const handleConfirmEditModule = () => {
    if (!editingModuleTitle.trim() || !moduleId) {
        alert("Digite o nome do módulo para salvar.");
        return;
    }
    const updatedModules = db.updateModuleTitle(moduleId, editingModuleTitle.trim(), editingModuleVisible);
    setLocalModules(updatedModules);
    setIsEditingModule(false);
    setEditingModuleTitle('');
    onSuccess(updatedModules);
  };

  const startEditingModule = () => {
    const currentModule = localModules.find(m => m.id === moduleId);
    if (currentModule) {
        setEditingModuleTitle(currentModule.title);
        setEditingModuleVisible(currentModule.isVisible !== false);
        setIsEditingModule(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let targetModuleId = moduleId;

    if (!title || !videoUrl) {
        alert("Preencha título e vídeo.");
        return;
    }

    if (isCreatingModule) {
        if (!newModuleTitle.trim()) {
            alert("Digite o nome do novo módulo para continuar.");
            return;
        }
        const updatedModules = db.addModule(newModuleTitle.trim());
        const newModule = updatedModules[updatedModules.length - 1];
        targetModuleId = newModule.id;
    } else {
        if (!targetModuleId) {
             alert("Selecione ou crie um módulo.");
             return;
        }
    }

    if (!isApproved && !window.confirm("O vídeo não foi aprovado (pode estar com erro). Deseja salvar mesmo assim?")) {
        return;
    }

    const payload = {
        title,
        description,
        videoUrl: videoUrl.trim(),
        duration: duration || '',
        thumbnail
    };

    let newModules;
    if (isEditingLesson && editingLessonId) {
        newModules = db.updateLesson(targetModuleId, editingLessonId, payload);
    } else {
        newModules = db.addLesson(targetModuleId, payload);
    }
    
    onSuccess(newModules);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-zinc-800 shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Video className="text-indigo-500" />
            {isEditingLesson ? 'Editar Aula' : 'Nova Aula'}
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          
          {/* INSTRUÇÕES SIMPLIFICADAS DROPBOX */}
          <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-4 mb-4">
            <h3 className="text-xs font-bold text-blue-400 mb-2 flex items-center gap-2 uppercase tracking-wide">
                <HardDrive size={14} /> Instruções de Vídeo
            </h3>
            <div className="text-xs text-zinc-400 space-y-1">
                <p>1. Use links diretos de arquivos MP4 ou links do <strong>Dropbox</strong>.</p>
                <p>2. No Dropbox: Clique em <strong>Compartilhar</strong> → <strong>Copiar Link</strong>.</p>
                <p className="text-zinc-500 mt-1 italic">
                   * O sistema converte automaticamente o link do Dropbox para modo streaming (dl=1).
                </p>
            </div>
          </div>

          {/* MODULE SELECTION */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Módulo (Pasta de Aulas)</label>
            <div className="flex gap-2">
                {isCreatingModule ? (
                    <>
                        <input
                            type="text"
                            value={newModuleTitle}
                            onChange={e => setNewModuleTitle(e.target.value)}
                            className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Nome do novo módulo..."
                            autoFocus
                        />
                        <button
                            type="button"
                            onClick={handleConfirmCreateModule}
                            className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                            <Check size={20} />
                        </button>
                    </>
                ) : isEditingModule ? (
                    <>
                         <input
                            type="text"
                            value={editingModuleTitle}
                            onChange={e => setEditingModuleTitle(e.target.value)}
                            className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Editar nome do módulo..."
                            autoFocus
                        />
                        <button
                            type="button"
                            onClick={() => setEditingModuleVisible(!editingModuleVisible)}
                            className={`px-3 py-2 rounded-lg border ${editingModuleVisible ? 'bg-zinc-800 text-zinc-400' : 'bg-red-500/10 text-red-500'}`}
                        >
                            {editingModuleVisible ? <Eye size={20} /> : <EyeOff size={20} />}
                        </button>

                        <button
                            type="button"
                            onClick={handleConfirmEditModule}
                            className="px-3 py-2 bg-emerald-600 text-white rounded-lg"
                        >
                            <Check size={20} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsEditingModule(false)}
                            className="px-3 py-2 bg-zinc-800 text-zinc-400 rounded-lg border border-zinc-700"
                        >
                            <X size={20} />
                        </button>
                    </>
                ) : (
                    <>
                        <select
                            value={moduleId}
                            onChange={e => setModuleId(e.target.value)}
                            className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg outline-none"
                            disabled={localModules.length === 0}
                        >
                            {localModules.length === 0 && <option value="">Nenhum módulo existente</option>}
                            {localModules.map(m => (
                                <option key={m.id} value={m.id}>
                                    {m.title} {m.isVisible === false ? '(Oculto)' : ''}
                                </option>
                            ))}
                        </select>
                        {localModules.length > 0 && (
                            <button
                                type="button"
                                onClick={startEditingModule}
                                className="px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-indigo-400 rounded-lg"
                            >
                                <Pencil size={18} />
                            </button>
                        )}
                    </>
                )}

                <button
                    type="button"
                    onClick={() => { setIsCreatingModule(!isCreatingModule); setIsEditingModule(false); }}
                    className={`px-3 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 border ${isCreatingModule ? 'bg-zinc-800 border-zinc-700' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'}`}
                >
                    {isCreatingModule ? <X size={18} /> : <><Plus size={16} /> Novo</>}
                </button>
            </div>
          </div>

          <div className="p-5 bg-zinc-950/80 rounded-xl border border-zinc-800 relative overflow-hidden">
            <div className="flex justify-between items-end mb-3">
               <label className="block text-sm font-bold text-white flex items-center gap-2">
                 <LinkIcon size={16} className="text-indigo-500" />
                 Link do Arquivo (Dropbox / MP4)
               </label>
            </div>
            
            <div className="space-y-4">
                <div className="relative">
                    <input
                        type="text"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        onBlur={handleUrlBlur}
                        className="w-full pl-4 pr-28 py-3 bg-zinc-900 border border-zinc-700 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none placeholder-zinc-600 text-sm font-mono shadow-inner"
                        placeholder="Ex: https://www.dropbox.com/s/....?dl=0"
                    />
                    <button
                        type="button"
                        onClick={() => {
                            if (!videoUrl) return;
                            setShowPreview(true);
                        }}
                        className="absolute right-1.5 top-1.5 bottom-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 rounded-md text-xs font-bold transition-colors flex items-center gap-2 shadow-lg"
                    >
                        <Play size={12} /> TESTAR
                    </button>
                </div>
                
                {showPreview && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 pt-2">
                        <div className="w-full bg-black rounded border border-zinc-800 overflow-hidden">
                             <VideoPlayer 
                                key={videoUrl} 
                                videoUrl={videoUrl} 
                                onComplete={() => {}} 
                                autoPlay={true}
                             />
                        </div>
                        
                        <div className="flex items-center justify-between gap-2">
                             {!isApproved ? (
                                <div className="flex-1 flex items-center justify-between bg-zinc-800 p-3 rounded-lg border border-zinc-700">
                                    <div className="flex items-center gap-2 text-zinc-300 text-sm">
                                        <span>O vídeo rodou corretamente?</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsApproved(true)}
                                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-md shadow-lg transition-colors flex items-center gap-2"
                                    >
                                        <CheckCircle size={16} /> APROVAR
                                    </button>
                                </div>
                            ) : (
                                <div className="flex-1 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2 justify-center font-bold">
                                    <ShieldCheck size={16} /> VÍDEO APROVADO
                                </div>
                            )}
                            
                            <button 
                                type="button"
                                onClick={() => {
                                   const current = videoUrl;
                                   setVideoUrl('');
                                   setTimeout(() => setVideoUrl(current), 10);
                                }}
                                className="p-3 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 text-zinc-400"
                                title="Recarregar Player"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
             <div className="col-span-2">
                <label className="block text-sm font-medium text-zinc-300 mb-1">Título da Aula</label>
                <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg outline-none"
                placeholder="Ex: Aula 1 - Introdução"
                />
             </div>
             <div className="col-span-1">
                <label className="block text-sm font-medium text-zinc-300 mb-1 flex items-center gap-1">
                   <Clock size={14} className="text-zinc-500" /> Duração
                </label>
                <input
                type="text"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg outline-none placeholder-zinc-600"
                placeholder="Ex: 00:15:00"
                />
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Descrição</label>
            <textarea
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg outline-none"
              rows={2}
              placeholder="Resumo do conteúdo..."
            />
          </div>
        </form>

        <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-zinc-300 font-medium hover:bg-zinc-800 rounded-lg transition-colors">
            Cancelar
          </button>
          <button 
            onClick={handleSubmit} 
            className={`
                px-6 py-2 text-white font-medium rounded-lg flex items-center gap-2 transition-colors 
                ${isApproved 
                    ? 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20' 
                    : 'bg-zinc-700 opacity-80'}
            `}
          >
            {isEditingLesson ? <Save size={18} /> : <Plus size={18} />} 
            {isEditingLesson ? 'Salvar' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminAddLesson;
