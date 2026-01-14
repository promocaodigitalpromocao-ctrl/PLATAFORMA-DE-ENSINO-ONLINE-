
import React, { useState, useEffect } from 'react';
import { Lesson, Module, User, LiveEvent } from './types';
import VideoPlayer from './components/VideoPlayer';
import LessonSidebar from './components/LessonSidebar';
import AuthScreen from './components/AuthScreen';
import AdminAddLesson from './components/AdminAddLesson';
import CommentsSection from './components/CommentsSection';
import CircularProgress from './components/CircularProgress';
import VideoLibraryModal from './components/VideoLibraryModal';
import AdminQuestionBank from './components/AdminQuestionBank';
import FinalExam from './components/FinalExam';
import CourseRating from './components/CourseRating'; 
import CertificateModal from './components/CertificateModal'; 
import AccessibilityWidget from './components/AccessibilityWidget'; 
import ProfileModal from './components/ProfileModal';
import { db } from './services/database';
import { Menu, Loader2, LogOut, PlusCircle, ChevronsRight, RefreshCw, Trophy, XCircle, Award, ShieldAlert, Pencil, Save, LayoutList, GraduationCap, Video, Headset, Phone, Mail, Edit3, Monitor, Sun, Moon, ArrowRight } from 'lucide-react';
import { Logo } from './components/Logo';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Tema
  const [theme, setTheme] = useState<'dark' | 'light' | 'gray'>(() => {
    if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('theme');
        return (saved === 'dark' || saved === 'light' || saved === 'gray') ? saved : 'dark';
    }
    return 'dark';
  });

  const [modules, setModules] = useState<Module[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [initialVideoTime, setInitialVideoTime] = useState(0); 
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  
  const [viewState, setViewState] = useState<'VIDEO' | 'FINAL_EXAM' | 'COURSE_RESULT' | 'LIVE_WATCH'>('VIDEO');
  const [showCertificateModal, setShowCertificateModal] = useState(false); 
  const [showProfileModal, setShowProfileModal] = useState(false); 
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true); 
  
  const [finalScore, setFinalScore] = useState({ correct: 0, total: 0 });
  const [courseApproved, setCourseApproved] = useState(false);
  const [liveEvent, setLiveEvent] = useState<LiveEvent | null>(null);

  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState('');

  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showVideoLibrary, setShowVideoLibrary] = useState(false);
  const [showQuestionBank, setShowQuestionBank] = useState(false);
  
  const [adminLessonInitialData, setAdminLessonInitialData] = useState<any>(null);

  // School Name
  const [schoolName, setSchoolName] = useState(db.getSchoolName());

  // Aplica o tema
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'gray-theme');
    if (theme === 'dark') root.classList.add('dark');
    else if (theme === 'gray') root.classList.add('gray-theme'); 
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
      if (theme === 'light') setTheme('gray');
      else if (theme === 'gray') setTheme('dark');
      else setTheme('light');
  };
  
  const getThemeIcon = () => {
      switch(theme) {
          case 'light': return <Sun size={20} />;
          case 'dark': return <Moon size={20} />;
          case 'gray': return <Monitor size={20} />;
      }
  };
  
  useEffect(() => {
    const initApp = async () => {
      const safetyTimeout = setTimeout(() => {
          console.warn("Sincronização demorou muito, forçando carregamento...");
          setIsSyncing(false);
          setIsLoadingAuth(false);
      }, 3000);

      try {
        setIsSyncing(true);
        db.init();
        try { await db.syncWithGoogleSheets(); } catch (e) { console.error(e); }
        
        const currentUser = db.getCurrentUser();
        setUser(currentUser);
        setModules(db.getModules());
        setLiveEvent(db.getLiveEvent());
        setSchoolName(db.getSchoolName());

        if (currentUser) {
            const savedProgress = localStorage.getItem(`focusClass_progress_${currentUser.id}`);
            if (savedProgress) {
                try { setCompletedLessons(new Set<string>(JSON.parse(savedProgress))); } catch (e) {}
            }
            const savedExam = db.getExamResult(currentUser.id);
            if (savedExam) {
                setCourseApproved(savedExam.passed);
                setFinalScore({ correct: savedExam.score, total: savedExam.total });
            }
            // Resume Logic
            const storedModules = db.getModules();
            let foundLesson: Lesson | null = null;
            for (const mod of storedModules) {
                if (currentUser.role === 'student' && mod.isVisible === false) continue;
                if (mod.lessons.length > 0) { foundLesson = mod.lessons[0]; break; }
            }
            if (foundLesson) {
                setInitialVideoTime(db.getVideoProgress(currentUser.id, foundLesson.id));
                setCurrentLesson(foundLesson);
            }
        }
      } catch (error) {
        console.error("Erro fatal:", error);
      } finally {
        clearTimeout(safetyTimeout);
        setIsSyncing(false);
        setIsLoadingAuth(false);
      }
    };
    initApp();
  }, []);

  // Listeners para sincronia de dados em tempo real
  useEffect(() => {
     const refresh = () => {
         setSchoolName(db.getSchoolName());
     };

     window.addEventListener('schoolNameChanged', refresh);
     window.addEventListener('storage', refresh);
     
     return () => {
         window.removeEventListener('schoolNameChanged', refresh);
         window.removeEventListener('storage', refresh);
     };
  }, []);

  const handleManualSync = async () => {
      setIsSyncing(true);
      try {
        if (user?.role === 'admin') {
            await db.saveModulesToCloud(modules);
            if (liveEvent) db.saveLiveEvent(liveEvent);
        }
        await db.syncWithGoogleSheets();
        setModules(db.getModules());
        
        const freshUser = db.getCurrentUser();
        if (freshUser) setUser(freshUser);
      } catch (e) { alert("Erro ao sincronizar."); } 
      finally { setIsSyncing(false); }
  };

  const saveProgress = (newSet: Set<string>) => {
    if (!user) return;
    setCompletedLessons(newSet);
    localStorage.setItem(`focusClass_progress_${user.id}`, JSON.stringify(Array.from(newSet)));
  };

  const handleLogout = () => {
    db.logout();
    setUser(null);
    setCompletedLessons(new Set());
    setCurrentLesson(null);
  };

  const handleLessonSelect = (lesson: Lesson) => {
    if (user) setInitialVideoTime(db.getVideoProgress(user.id, lesson.id));
    setCurrentLesson(lesson);
    setViewState('VIDEO');
    setIsSidebarOpen(false);
  };

  const handleSelectLive = () => {
      setViewState('LIVE_WATCH');
      setIsSidebarOpen(false);
  };

  const handleVideoProgress = (time: number) => {
      if (user && currentLesson) db.saveVideoProgress(user.id, currentLesson.id, time);
  };

  const handleEditLesson = (moduleId: string, lesson: Lesson) => {
      setAdminLessonInitialData({
          videoUrl: lesson.videoUrl,
          title: lesson.title,
          description: lesson.description,
          duration: lesson.duration,
          moduleId: moduleId,
          lessonId: lesson.id
      });
      setShowAdminModal(true);
  };

  const handleVideoComplete = async () => {
    if (!currentLesson) return;
    const newSet = new Set<string>(completedLessons);
    newSet.add(currentLesson.id);
    saveProgress(newSet);

    // Auto-advance
    let nextLesson: Lesson | null = null;
    let isFound = false;
    for (const mod of modules) {
        if (user?.role === 'student' && mod.isVisible === false) continue;
        for (const lesson of mod.lessons) {
            if (isFound) { nextLesson = lesson; break; }
            if (lesson.id === currentLesson.id) isFound = true;
        }
        if (nextLesson) break;
    }
    if (nextLesson) {
        if (user) setInitialVideoTime(db.getVideoProgress(user.id, nextLesson.id));
        setCurrentLesson(nextLesson);
    }
  };

  const startFinalExam = () => setViewState('FINAL_EXAM');

  const handleExamComplete = (passed: boolean, score: number, total: number) => {
      if (user) db.saveExamResult(user.name, user.email, score, total, passed);
      setFinalScore({ correct: score, total });
      setCourseApproved(passed);
      setViewState('COURSE_RESULT');
  };

  const handleAdminAddSuccess = (updatedModules: Module[]) => {
    setModules(updatedModules);
    setShowAdminModal(false);
    if (!currentLesson && updatedModules.length > 0) {
        for(const m of updatedModules) if(m.lessons.length > 0) { setCurrentLesson(m.lessons[0]); break; }
    }
    setAdminLessonInitialData(null);
  };

  const handleCreateLessonFromLibrary = (url: string, title: string) => {
    setShowVideoLibrary(false);
    setAdminLessonInitialData({ videoUrl: url, title: title });
    setShowAdminModal(true);
  };

  const handleProfileUpdate = (updatedUser: User) => setUser(updatedUser);
  
  const calculateTotalHours = (): string => "40 Horas";
  
  const totalLessons = modules.reduce((acc, mod) => acc + mod.lessons.length, 0);
  const progressPercentage = totalLessons > 0 ? (completedLessons.size / totalLessons) * 100 : 0;
  const isCourseComplete = progressPercentage === 100;

  if (isSyncing || isLoadingAuth) {
    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
             <Logo size={64} />
             <div className="mt-4 flex items-center gap-2">
                 <Loader2 className="animate-spin text-indigo-500" /> Carregando...
             </div>
        </div>
    );
  }

  if (!user) return <AuthScreen onLogin={setUser} />;

  if (viewState === 'FINAL_EXAM') {
      return <FinalExam onComplete={handleExamComplete} onCancel={() => setViewState('VIDEO')} user={user} />;
  }

  if (viewState === 'COURSE_RESULT') {
      return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8 text-center animate-in zoom-in-95">
            <div className={`p-6 rounded-full mb-6 ${courseApproved ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                {courseApproved ? <Trophy size={80} className="text-green-500" /> : <XCircle size={80} className="text-red-500" />}
            </div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">{courseApproved ? 'Aprovado!' : 'Reprovado'}</h2>
            <div className="text-xl mb-8 text-zinc-700 dark:text-zinc-300">Nota: <span className="font-bold text-zinc-900 dark:text-white">{finalScore.correct}</span> / {finalScore.total}</div>
            {courseApproved && (
                <button onClick={() => setShowCertificateModal(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg mb-4">
                    <Award size={20} /> Emitir Certificado
                </button>
            )}
            <button onClick={() => setViewState('VIDEO')} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white underline">Voltar</button>
            {showCertificateModal && user && <CertificateModal user={user} courseDuration={calculateTotalHours()} onClose={() => setShowCertificateModal(false)} />}
            <AccessibilityWidget />
          </div>
      );
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden text-zinc-900 dark:text-zinc-100 transition-colors duration-500">
      <div className="lg:hidden fixed top-0 w-full z-20 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between">
         <Logo size={32} showText={true} editable={user.role === 'admin'} />
         <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800">{getThemeIcon()}</button>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-zinc-400"><Menu /></button>
         </div>
      </div>

      <LessonSidebar 
        modules={modules}
        currentLessonId={currentLesson?.id || ''}
        completedLessons={completedLessons}
        onSelectLesson={handleLessonSelect}
        isSidebarOpen={isSidebarOpen}
        isDesktopOpen={isDesktopSidebarOpen}
        onToggleDesktop={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
        isAdmin={user.role === 'admin'}
        onEditLesson={handleEditLesson}
        liveEvent={liveEvent}
        onSelectLive={handleSelectLive}
      />

      <main className="flex-1 overflow-y-auto relative w-full pt-16 lg:pt-0">
        <div className="max-w-5xl mx-auto p-4 md:p-8 pb-20">
          
          <div className="flex flex-col-reverse md:flex-row md:justify-between md:items-start mb-8 gap-4">
            <div className="flex items-start gap-4">
               {!isDesktopSidebarOpen && (
                 <button onClick={() => setIsDesktopSidebarOpen(true)} className="hidden lg:flex p-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-700"><ChevronsRight size={24} /></button>
               )}
              <div>
                <h2 className="text-sm font-medium text-indigo-500 dark:text-indigo-400 mb-1">
                   {viewState === 'LIVE_WATCH' ? 'Sala Ao Vivo' : 'Módulo Atual'}
                </h2>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white leading-tight">
                    {viewState === 'LIVE_WATCH' ? (liveEvent?.title || "Aula Ao Vivo") : (currentLesson?.title || 'Selecione uma aula')}
                </h1>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2 self-end md:self-auto">
               {user.role === 'admin' && (
                   <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-full border border-amber-200 dark:border-amber-500/20 text-[10px] font-bold tracking-wider uppercase mb-1">
                       <ShieldAlert size={12} /> Modo Administrador
                   </div>
               )}

               <div className="flex items-center gap-4">
                <button onClick={toggleTheme} className="hidden md:flex p-2.5 rounded-xl text-zinc-600 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors">
                    {getThemeIcon()}
                </button>

                {user.role === 'admin' && (
                    <div className="flex items-center gap-2 mr-2">
                        <button onClick={handleManualSync} className="p-2 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 rounded-lg" title="Sincronizar"><RefreshCw size={20} /></button>
                        <button onClick={() => setShowQuestionBank(true)} className="p-2 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg border border-zinc-200 dark:border-zinc-700" title="Banco de Questões"><LayoutList size={20} /></button>
                        <button onClick={() => { setAdminLessonInitialData(null); setShowAdminModal(true); }} className="p-2 bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg" title="Adicionar Aula"><PlusCircle size={20} /></button>
                    </div>
                )}
                
                <div className="flex items-center gap-4 pl-4 border-l border-zinc-300 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 p-2 rounded-xl">
                    <div className="flex flex-col items-center"><CircularProgress percentage={progressPercentage} size={42} strokeWidth={4} /></div>
                    <div className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{user.name}</p>
                            {user.role === 'admin' && <button onClick={() => setShowProfileModal(true)} className="p-1 text-zinc-400 hover:text-indigo-500"><Edit3 size={14} /></button>}
                        </div>
                        <p className="text-xs text-zinc-500 capitalize">{user.role === 'admin' ? 'Administrador' : 'Estudante'}</p>
                    </div>
                    <button onClick={handleLogout} className="text-zinc-400 hover:text-red-500 ml-2"><LogOut size={20} /></button>
                </div>
               </div>
            </div>
          </div>

          {viewState === 'LIVE_WATCH' && liveEvent ? (
              <div className="space-y-6"></div>
          ) : currentLesson ? (
              <div className="space-y-6">
                <VideoPlayer 
                  key={`${currentLesson.id}-${initialVideoTime}`}
                  videoUrl={currentLesson.videoUrl}
                  initialTime={initialVideoTime}
                  onProgress={handleVideoProgress}
                  onComplete={handleVideoComplete}
                  autoPlay={false}
                  allowSkip={user.role === 'admin'}
                  thumbnailUrl={currentLesson.thumbnail}
                />
                
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Sobre esta aula</h3>
                      {user.role === 'admin' && !isEditingDescription && (
                          <button onClick={() => { setTempDescription(currentLesson.description); setIsEditingDescription(true); }} className="p-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-indigo-500 rounded-lg"><Pencil size={16} /></button>
                      )}
                  </div>
                  {isEditingDescription ? (
                      <div className="space-y-3">
                          <textarea value={tempDescription} onChange={(e) => setTempDescription(e.target.value)} className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-300 rounded-xl p-4 outline-none resize-y min-h-[120px]" />
                          <div className="flex justify-end gap-2">
                              <button onClick={() => setIsEditingDescription(false)} className="px-4 py-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">Cancelar</button>
                              <button onClick={() => { const updated = db.updateLessonDescription(currentLesson.id, tempDescription); setModules(updated); setCurrentLesson({...currentLesson, description: tempDescription}); setIsEditingDescription(false); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2"><Save size={16} /> Salvar</button>
                          </div>
                      </div>
                  ) : <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">{currentLesson.description}</p>}
                </div>
                
                <div className="mt-4">
                    <div className={`relative p-6 rounded-2xl border transition-all overflow-hidden flex items-center justify-between gap-4 flex-wrap ${courseApproved ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200' : (isCourseComplete || user.role === 'admin' ? 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-200' : 'bg-white dark:bg-zinc-900 border-zinc-200 opacity-60 grayscale')}`}>
                        <div className="flex items-center gap-4">
                             <div className={`p-3 rounded-full ${courseApproved ? 'bg-emerald-100' : 'bg-zinc-100'}`}>
                                 {courseApproved ? <Award size={32} className="text-emerald-500" /> : <GraduationCap size={32} className="text-indigo-500" />}
                             </div>
                             <div>
                                 <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{courseApproved ? "Certificado Disponível" : "Prova Final do Curso"}</h3>
                                 <p className="text-sm text-zinc-500">{courseApproved ? `Aprovado com ${finalScore.correct} acertos.` : "Complete todas as aulas para desbloquear."}</p>
                             </div>
                        </div>
                        {(isCourseComplete || user.role === 'admin') && !courseApproved && <button onClick={startFinalExam} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2">INICIAR PROVA <ArrowRight size={20} /></button>}
                        {courseApproved && <button onClick={() => setShowCertificateModal(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-2"><Award size={18} /> VER CERTIFICADO</button>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                     <CommentsSection lessonId={currentLesson.id} currentUser={user} />
                     <CourseRating isUnlocked={courseApproved || user.role === 'admin'} currentUser={user} />
                </div>

              </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[60vh] text-zinc-500">
               <div className="w-24 h-24 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center mb-6 shadow-md"><Logo size={48} showText={false} /></div>
               <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Bem-vindo, {user.name}</h2>
               <p className="max-w-md text-center mb-8">Selecione um módulo e uma aula no menu lateral para começar.</p>
               {user.role === 'admin' && <button onClick={() => setShowAdminModal(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold"><PlusCircle size={20} /> Adicionar Aula</button>}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {showAdminModal && <AdminAddLesson modules={modules} onClose={() => { setShowAdminModal(false); setAdminLessonInitialData(null); }} onSuccess={handleAdminAddSuccess} initialData={adminLessonInitialData} />}
      {showVideoLibrary && <VideoLibraryModal onClose={() => setShowVideoLibrary(false)} onCreateLesson={handleCreateLessonFromLibrary} />}
      {showQuestionBank && <AdminQuestionBank onClose={() => setShowQuestionBank(false)} />}
      {showCertificateModal && user && <CertificateModal user={user} courseDuration={calculateTotalHours()} onClose={() => setShowCertificateModal(false)} />}
      {showProfileModal && user && <ProfileModal user={user} onClose={() => setShowProfileModal(false)} onUpdate={handleProfileUpdate} />}
      <AccessibilityWidget />
    </div>
  );
};

export default App;
