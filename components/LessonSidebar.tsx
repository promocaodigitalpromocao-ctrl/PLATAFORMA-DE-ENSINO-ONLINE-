
import React, { useState, useEffect } from 'react';
import { Module, Lesson, LessonSidebarProps } from '../types';
import { PlayCircle, Lock, CheckCircle, Clock, ChevronsLeft, Pencil, ExternalLink, Globe, Check, Smartphone, X, Copy } from 'lucide-react'; 
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
  onEditLesson
}) => {
  const [customLink, setCustomLink] = useState(db.getSidebarLink());
  const [schoolName, setSchoolName] = useState(db.getSchoolName());
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
      const refresh = () => {
          setCustomLink(db.getSidebarLink());
          setSchoolName(db.getSchoolName());
      };
      window.addEventListener('schoolNameChanged', refresh);
      window.addEventListener('sidebarLinkChanged', refresh);
      return () => {
          window.removeEventListener('schoolNameChanged', refresh);
          window.removeEventListener('sidebarLinkChanged', refresh);
      };
  }, []);

  // Lógica de Trava Sequencial
  const isLessonLocked = (lessonId: string): boolean => {
    if (isAdmin) return false;
    
    // Flatten all lessons across all modules to find the global sequence
    let allLessons: Lesson[] = [];
    modules.forEach(m => {
        if (m.isVisible !== false) allLessons = [...allLessons, ...m.lessons];
    });

    const index = allLessons.findIndex(l => l.id === lessonId);
    if (index <= 0) return false; // Primeira aula nunca está travada

    const previousLesson = allLessons[index - 1];
    return !completedLessons.has(previousLesson.id);
  };

  return (
    <div className={`
      fixed inset-y-0 left-0 z-30 transform transition-all duration-300 ease-in-out
      bg-zinc-50 border-r border-zinc-200 
      dark:bg-zinc-950 dark:border-zinc-800
      ${isSidebarOpen ? 'translate-x-0 w-80 shadow-2xl' : '-translate-x-full w-80'}
      lg:relative lg:translate-x-0
      ${isDesktopOpen ? 'lg:w-80' : 'lg:w-0 lg:overflow-hidden lg:border-r-0'}
      flex flex-col
    `}>
      {/* HEADER */}
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-900 flex items-center justify-between w-full shrink-0">
        <Logo size={42} editable={isAdmin} />
        {onToggleDesktop && (
          <button onClick={onToggleDesktop} className="hidden lg:block p-2 text-zinc-400 hover:text-indigo-500 rounded-xl bg-zinc-100 dark:bg-zinc-900">
            <ChevronsLeft size={20} />
          </button>
        )}
      </div>

      {/* MODULES LIST */}
      <div className="flex-1 p-4 space-y-6 w-full overflow-y-auto custom-scrollbar">
        {modules.map((module) => {
          const isVisible = module.isVisible !== false;
          if (!isVisible && !isAdmin) return null;

          return (
            <div key={module.id} className="space-y-2">
              <h3 className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-3 px-2 flex items-center justify-between">
                {module.title}
                {!isVisible && <span className="text-[9px] text-red-500 border border-red-500/30 px-1.5 py-0.5 rounded">OCULTO</span>}
              </h3>
              
              <div className="space-y-1.5">
                {module.lessons.map((lesson) => {
                  const isCompleted = completedLessons.has(lesson.id);
                  const isSelected = currentLessonId === lesson.id;
                  const isLocked = isLessonLocked(lesson.id);
                  const isCustomThumbnail = lesson.thumbnail && !lesson.thumbnail.includes('picsum');

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => !isLocked && onSelectLesson(lesson)}
                      className={`
                        w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-300 group relative overflow-hidden
                        ${isSelected 
                          ? 'bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-500/20' 
                          : isLocked
                            ? 'opacity-40 grayscale cursor-not-allowed'
                            : 'hover:bg-zinc-200 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-400'
                        }
                      `}
                    >
                      {/* Thumbnail/Icon */}
                      <div className={`relative shrink-0 w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center border ${isSelected ? 'border-indigo-400' : 'border-zinc-200 dark:border-zinc-800'}`}>
                         {isCustomThumbnail ? (
                             <img src={lesson.thumbnail} alt="" className="w-full h-full object-cover" />
                         ) : (
                             <div className="bg-zinc-100 dark:bg-zinc-800 w-full h-full flex items-center justify-center">
                                 <PlayCircle size={20} className={isSelected ? 'text-white' : 'text-zinc-400'} />
                             </div>
                         )}
                         
                         {isCompleted && (
                             <div className="absolute inset-0 bg-emerald-500/40 backdrop-blur-[1px] flex items-center justify-center">
                                 <CheckCircle size={20} className="text-white drop-shadow-md" />
                             </div>
                         )}
                         
                         {isLocked && (
                             <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                 <Lock size={18} className="text-white/80" />
                             </div>
                         )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-semibold leading-tight mb-1 truncate ${isSelected ? 'text-white' : 'text-zinc-800 dark:text-zinc-200'}`}>
                            {lesson.title}
                        </h4>
                        <span className="flex items-center gap-1.5 text-[10px] font-bold opacity-60">
                            <Clock size={10} /> {lesson.duration || '00:00'}
                        </span>
                      </div>

                      {isAdmin && (
                          <div 
                              onClick={(e) => { e.stopPropagation(); if(onEditLesson) onEditLesson(module.id, lesson); }}
                              className="absolute right-2 p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
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
      <div className="p-5 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950 shrink-0 space-y-4">
          {customLink.url && (
              <a 
                href={customLink.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-zinc-900 hover:bg-black text-white rounded-xl p-3.5 transition-all shadow-xl shadow-black/10 group"
              >
                <div className="bg-indigo-600 p-2 rounded-lg group-hover:scale-110 transition-transform">
                    <Globe size={16} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider leading-none mb-1">{customLink.label || 'Link Externo'}</p>
                    <p className="text-xs font-semibold truncate opacity-80">Acessar Plataforma</p>
                </div>
                <ExternalLink size={14} className="opacity-40" />
              </a>
          )}

          <div className="text-center">
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.3em]">
                © {new Date().getFullYear()} {schoolName}
              </p>
          </div>
      </div>
    </div>
  );
};

export default LessonSidebar;
