
import React, { useState, useEffect } from 'react';
import { Module, Lesson, LessonSidebarProps } from '../types';
import { PlayCircle, Lock, CheckCircle, Clock, ChevronsLeft, EyeOff, Pencil, ExternalLink, Calendar, Link as LinkIcon, Save, X, Headset, Phone, Mail, Smartphone, Copy, Globe, Check } from 'lucide-react'; 
import { Logo } from './Logo';
import { db } from '../services/database';

const LessonSidebar: React.FC<LessonSidebarProps> = ({ 
  modules, 
  currentLessonId, 
  completedLessons, 
  onSelectLesson,
  isSidebarOpen,
  isDesktopOpen = true,
  onToggleDesktop,
  isAdmin = false,
  onEditLesson,
  liveEvent,
  onSelectLive
}) => {
  
  // --- ESTADOS ---
  const [customLink, setCustomLink] = useState(db.getSidebarLink());
  const [schoolName, setSchoolName] = useState(db.getSchoolName());

  // Estados de Edição
  const [isEditingLink, setIsEditingLink] = useState(false);
  const [tempLink, setTempLink] = useState({ label: '', url: '' });

  const [isEditingCopyright, setIsEditingCopyright] = useState(false);
  const [tempSchoolName, setTempSchoolName] = useState('');

  const [showShareModal, setShowShareModal] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  // --- SYNC LISTENERS ---
  useEffect(() => {
      // Função simples para recarregar tudo
      const refresh = () => {
          setCustomLink(db.getSidebarLink());
          setSchoolName(db.getSchoolName());
      };

      // Carrega inicial
      refresh();
      
      if (typeof window !== 'undefined') {
          setCurrentUrl(window.location.href);
      }

      // Escuta eventos de atualização (disparados pelo App.tsx ou sync)
      window.addEventListener('schoolNameChanged', refresh);
      window.addEventListener('sidebarLinkChanged', refresh);
      window.addEventListener('storage', refresh); // Escuta mudanças de outras abas/sync
      
      return () => {
          window.removeEventListener('schoolNameChanged', refresh);
          window.removeEventListener('sidebarLinkChanged', refresh);
          window.removeEventListener('storage', refresh);
      };
  }, []);

  // --- HANDLERS ---
  const handleSaveLink = () => {
      db.setSidebarLink(tempLink.label, tempLink.url);
      setCustomLink(tempLink);
      setIsEditingLink(false);
  };

  const handleSaveSchoolName = () => {
      if (tempSchoolName.trim()) {
          db.setSchoolName(tempSchoolName);
      }
      setIsEditingCopyright(false);
  };

  const copyCustomLinkToClipboard = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (customLink.url) {
          navigator.clipboard.writeText(customLink.url);
          alert("Link copiado!");
      }
  };

  const copyAppUrlToClipboard = () => {
      navigator.clipboard.writeText(currentUrl);
      alert("Link do App copiado!");
  };

  // --- RENDER HELPERS ---
  const isLessonLocked = (targetLessonId: string): boolean => {
      if (isAdmin) return false;
      let allLessons: Lesson[] = [];
      modules.forEach(m => {
          if (m.isVisible !== false) allLessons = [...allLessons, ...m.lessons];
      });
      const index = allLessons.findIndex(l => l.id === targetLessonId);
      if (index <= 0) return false;
      const prevLesson = allLessons[index - 1];
      return !completedLessons.has(prevLesson.id);
  };

  const hasValidLink = customLink.url && customLink.url.trim() !== '';

  return (
    <div className={`
      fixed inset-y-0 left-0 z-30 transform transition-all duration-300 ease-in-out
      bg-zinc-50 border-r border-zinc-200 
      dark:bg-zinc-900 dark:border-zinc-800
      ${isSidebarOpen ? 'translate-x-0 w-80' : '-translate-x-full w-80'}
      lg:relative lg:translate-x-0
      ${isDesktopOpen ? 'lg:w-80' : 'lg:w-0 lg:overflow-hidden lg:border-r-0'}
      flex flex-col
    `}>
      {/* HEADER */}
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between w-full shrink-0">
        <div>
          <Logo size={42} editable={isAdmin} />
          <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-3 pl-1">Área do Aluno</p>
        </div>
        {onToggleDesktop && (
          <button onClick={onToggleDesktop} className="hidden lg:block p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-lg">
            <ChevronsLeft size={24} />
          </button>
        )}
      </div>

      {/* MODULES LIST */}
      <div className="flex-1 p-4 space-y-6 w-full overflow-y-auto">
        {modules.map((module) => {
          const isVisible = module.isVisible !== false;
          if (!isVisible && !isAdmin) return null;

          return (
            <div key={module.id} className={!isVisible ? 'opacity-50 grayscale' : ''}>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-2 flex items-center gap-2">
                {module.title}
                {!isVisible && <span className="text-[10px] text-red-500 border border-red-500 px-1 rounded">OCULTO</span>}
              </h3>
              
              <div className="space-y-1">
                {module.lessons.map((lesson) => {
                  const isCompleted = completedLessons.has(lesson.id);
                  const isSelected = currentLessonId === lesson.id;
                  const isLocked = isLessonLocked(lesson.id);
                  const isCustomThumbnail = lesson.thumbnail && !lesson.thumbnail.includes('picsum');

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => !isLocked && onSelectLesson(lesson)}
                      disabled={isLocked}
                      className={`
                        w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 group relative
                        ${isSelected 
                          ? 'bg-indigo-600 text-white shadow-lg' 
                          : isLocked
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                        }
                      `}
                    >
                      <div className={`relative shrink-0 w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center ${isSelected ? 'bg-indigo-800' : 'bg-zinc-200 dark:bg-zinc-800'}`}>
                         {isCustomThumbnail ? (
                             <img src={lesson.thumbnail} alt="" className="w-full h-full object-cover" />
                         ) : (
                             <div className="scale-50"><Logo size={60} showText={false} /></div>
                         )}
                         {isCompleted && <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center"><CheckCircle size={14} className="text-emerald-500 bg-white rounded-full" /></div>}
                         {isLocked && !isCompleted && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Lock size={16} className="text-white" /></div>}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium leading-tight mb-1 truncate">{lesson.title}</h4>
                        <span className="flex items-center gap-1 text-xs opacity-70"><Clock size={10} /> {lesson.duration}</span>
                      </div>

                      {isAdmin && (
                          <div 
                              onClick={(e) => { e.stopPropagation(); if(onEditLesson) onEditLesson(module.id, lesson); }}
                              className="absolute right-2 p-1.5 bg-white text-zinc-800 rounded hidden group-hover:flex hover:text-indigo-600"
                          >
                              <Pencil size={12} />
                          </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* FOOTER */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 shrink-0 w-full space-y-4">
          
          {/* CUSTOM LINK (LINK PARA O MAM) */}
          {(isAdmin || hasValidLink) && (
              <div className="bg-zinc-100 dark:bg-zinc-900/50 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800 relative group">
                  {isEditingLink ? (
                      <div className="space-y-2">
                          <input 
                              value={tempLink.label} 
                              onChange={e => setTempLink({...tempLink, label: e.target.value})}
                              className="w-full text-xs p-2 rounded bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700"
                              placeholder="Título (Ex: Link para o MAM)"
                          />
                          <input 
                              value={tempLink.url} 
                              onChange={e => setTempLink({...tempLink, url: e.target.value})}
                              className="w-full text-xs p-2 rounded bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700"
                              placeholder="URL (https://...)"
                          />
                          <div className="flex gap-2">
                              <button onClick={handleSaveLink} className="flex-1 bg-emerald-600 text-white text-xs py-1 rounded">Salvar</button>
                              <button onClick={() => setIsEditingLink(false)} className="flex-1 bg-zinc-500 text-white text-xs py-1 rounded">Cancelar</button>
                          </div>
                      </div>
                  ) : (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                            <LinkIcon size={12} className="text-indigo-500" />
                            <span className="text-[10px] font-bold text-zinc-500 uppercase">{customLink.label || "Link para o MAM"}</span>
                        </div>
                        
                        <a 
                            href={customLink.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg p-2.5 transition-colors group/link w-full shadow-sm"
                        >
                            <Globe size={14} className="text-indigo-200" />
                            <span className="text-xs truncate flex-1 font-semibold">
                                Acessar Agora
                            </span>
                            <div onClick={copyCustomLinkToClipboard} className="p-1 hover:bg-indigo-500 rounded cursor-pointer" title="Copiar Link">
                                <ExternalLink size={14} className="text-indigo-100" />
                            </div>
                        </a>

                        {isAdmin && (
                            <button 
                                onClick={() => { setTempLink(customLink); setIsEditingLink(true); }}
                                className="absolute top-2 right-2 text-zinc-400 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Pencil size={12} />
                            </button>
                        )}
                      </>
                  )}
              </div>
          )}

          {/* ADMIN APK LINK */}
          {isAdmin && (
              <button onClick={() => setShowShareModal(true)} className="w-full py-2 bg-zinc-800 text-zinc-400 hover:text-white rounded-lg text-xs font-medium flex items-center justify-center gap-2">
                  <Smartphone size={14} /> Link App/APK
              </button>
          )}

          {/* COPYRIGHT */}
          <div className="text-center pt-2 relative group/copy">
              {isEditingCopyright ? (
                  <div className="flex items-center justify-center gap-1">
                      <input 
                          value={tempSchoolName}
                          onChange={e => setTempSchoolName(e.target.value)}
                          className="w-32 text-[10px] p-1 rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-center"
                          autoFocus
                      />
                      <button onClick={handleSaveSchoolName} className="text-green-500"><Check size={12} /></button>
                      <button onClick={() => setIsEditingCopyright(false)} className="text-red-500"><X size={12} /></button>
                  </div>
              ) : (
                  <>
                    <p className="text-[10px] text-zinc-400">© {new Date().getFullYear()} {schoolName}</p>
                    {isAdmin && (
                        <button 
                            onClick={() => { setTempSchoolName(schoolName); setIsEditingCopyright(true); }}
                            className="absolute right-0 top-2 text-zinc-500 hover:text-indigo-500 opacity-0 group-hover/copy:opacity-100"
                        >
                            <Pencil size={10} />
                        </button>
                    )}
                  </>
              )}
          </div>
      </div>

      {/* SHARE MODAL */}
      {showShareModal && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
              <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-sm">
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Smartphone /> Link do App</h3>
                  <div className="bg-black/50 p-2 rounded flex gap-2 mb-4 border border-zinc-800">
                      <input readOnly value={currentUrl} className="bg-transparent text-zinc-300 text-xs w-full outline-none" />
                      <button onClick={copyAppUrlToClipboard} className="text-indigo-500"><Copy size={14} /></button>
                  </div>
                  <button onClick={() => setShowShareModal(false)} className="block w-full text-center py-2 text-zinc-400 hover:text-white text-sm">Fechar</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default LessonSidebar;
