
import React, { useState, useEffect } from 'react';
import { Lesson, Module, User } from './types';
import VideoPlayer from './components/VideoPlayer';
import LessonSidebar from './components/LessonSidebar';
import AuthScreen from './components/AuthScreen';
import AdminAddLesson from './components/AdminAddLesson';
import CommentsSection from './components/CommentsSection';
import FinalExam from './components/FinalExam';
import CourseRating from './components/CourseRating'; 
import CertificateModal from './components/CertificateModal'; 
import AccessibilityWidget from './components/AccessibilityWidget'; 
import { db } from './services/database';
import { Menu, Loader2, LogOut, PlusCircle, Trophy, Award } from 'lucide-react';
import { Logo } from './components/Logo';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const [theme] = useState<'dark' | 'light' | 'gray'>(() => {
    return (localStorage.getItem('theme') as any) || 'dark';
  });

  const [modules, setModules] = useState<Module[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [initialVideoTime, setInitialVideoTime] = useState(0); 
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [viewState, setViewState] = useState<'VIDEO' | 'FINAL_EXAM' | 'COURSE_RESULT'>('VIDEO');
  
  const [showCertificateModal, setShowCertificateModal] = useState(false); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true); 
  
  const [courseApproved, setCourseApproved] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminLessonInitialData, setAdminLessonInitialData] = useState<any>(null);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'gray-theme');
    if (theme === 'dark') root.classList.add('dark');
    else if (theme === 'gray') root.classList.add('gray-theme'); 
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const initApp = async () => {
      setIsSyncing(true);
      db.init();
      await db.syncWithGoogleSheets();
      
      const currentUser = db.getCurrentUser();
      setUser(currentUser);
      const loadedModules = db.getModules();
      setModules(loadedModules);

      if (currentUser) {
        const savedProgress = localStorage.getItem(`focusClass_progress_${currentUser.id}`);
        if (savedProgress) setCompletedLessons(new Set(JSON.parse(savedProgress)));
        
        const examResult = db.getExamResult(currentUser.id);
        if (examResult) {
            setCourseApproved(examResult.passed);
        }

        if (loadedModules.length > 0) {
            const firstMod = loadedModules.find((m: any) => m.isVisible !== false && m.lessons.length > 0);
            if (firstMod) {
                const lesson = firstMod.lessons[0];
                setCurrentLesson(lesson);
                setInitialVideoTime(db.getVideoProgress(currentUser.id, lesson.id));
            }
        }
      }
      setIsSyncing(false);
      setIsLoadingAuth(false);
    };
    initApp();
  }, []);

  const handleLessonSelect = (lesson: Lesson) => {
    if (user) setInitialVideoTime(db.getVideoProgress(user.id, lesson.id));
    setCurrentLesson(lesson);
    setViewState('VIDEO');
    setIsSidebarOpen(false);
  };

  const handleVideoComplete = () => {
    if (!currentLesson || !user) return;
    
    const newSet = new Set(completedLessons);
    newSet.add(currentLesson.id);
    setCompletedLessons(newSet);
    localStorage.setItem(`focusClass_progress_${user.id}`, JSON.stringify(Array.from(newSet)));

    let nextLesson: Lesson | null = null;
    let foundCurrent = false;
    for (const mod of modules) {
        if (user.role === 'student' && mod.isVisible === false) continue;
        for (const lesson of mod.lessons) {
            if (foundCurrent) { nextLesson = lesson; break; }
            if (lesson.id === currentLesson.id) foundCurrent = true;
        }
        if (nextLesson) break;
    }

    if (nextLesson) {
        setCurrentLesson(nextLesson);
        setInitialVideoTime(0);
    }
  };

  const handleLogout = () => {
    db.logout();
    window.location.reload();
  };

  const totalLessons = modules.reduce((acc: number, mod: Module) => acc + (mod.isVisible !== false ? mod.lessons.length : 0), 0);
  const progressPercentage = totalLessons > 0 ? (completedLessons.size / totalLessons) * 100 : 0;

  if (isLoadingAuth || isSyncing) return <div className="h-screen flex items-center justify-center dark:bg-zinc-950"><Loader2 className="animate-spin text-indigo-500" size={48} /></div>;
  if (!user) return <AuthScreen onLogin={(u: User) => setUser(u)} />;

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden transition-colors duration-500">
      <LessonSidebar 
        modules={modules}
        currentLessonId={currentLesson?.id || ''}
        completedLessons={completedLessons}
        onSelectLesson={handleLessonSelect}
        isSidebarOpen={isSidebarOpen}
        isDesktopOpen={isDesktopSidebarOpen}
        onToggleDesktop={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
        isAdmin={user.role === 'admin'}
        onEditLesson={(mid: any, l: any) => { setAdminLessonInitialData({...l, moduleId: mid, lessonId: l.id}); setShowAdminModal(true); }}
      />

      <main className="flex-1 overflow-y-auto relative bg-white dark:bg-zinc-950/50">
        <div className="max-w-5xl mx-auto p-4 md:p-10 pb-24">
          
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-4">
               <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 bg-zinc-100 dark:bg-zinc-900 rounded-xl text-zinc-600"><Menu /></button>
               <div>
                  <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{currentLesson?.title || "Selecione uma Aula"}</h1>
                  <p className="text-sm text-zinc-500 font-medium">Progresso: {Math.round(progressPercentage)}% concluído</p>
               </div>
            </div>
            
            <div className="flex items-center gap-3">
                {user.role === 'admin' && (
                    <button onClick={() => setShowAdminModal(true)} className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/20"><PlusCircle size={20} /></button>
                )}
                <button onClick={handleLogout} className="p-2.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 rounded-xl hover:text-red-500 transition-colors"><LogOut size={20} /></button>
            </div>
          </div>

          {currentLesson ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <VideoPlayer 
                key={currentLesson.id}
                videoUrl={currentLesson.videoUrl}
                initialTime={initialVideoTime}
                onComplete={handleVideoComplete}
                onProgress={(t: any) => db.saveVideoProgress(user.id, currentLesson.id, t)}
                allowSkip={user.role === 'admin'}
                thumbnailUrl={currentLesson.thumbnail}
              />
              
              <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-3">Conteúdo da Aula</h3>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">{currentLesson.description}</p>
              </div>

              <div className={`p-8 rounded-2xl border transition-all ${progressPercentage >= 100 ? 'bg-indigo-600 text-white border-indigo-500 shadow-2xl shadow-indigo-500/20' : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 grayscale opacity-60'}`}>
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-4 rounded-full"><Trophy size={32} /></div>
                    <div>
                        <h4 className="text-xl font-bold">Certificação Final</h4>
                        <p className="opacity-80">Conclua 100% das aulas para liberar sua prova.</p>
                    </div>
                  </div>
                  {progressPercentage >= 100 && !courseApproved && (
                      <button onClick={() => setViewState('FINAL_EXAM')} className="bg-white text-indigo-600 px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform">INICIAR PROVA</button>
                  )}
                  {courseApproved && (
                      <button onClick={() => setShowCertificateModal(true)} className="bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2"><Award /> VER CERTIFICADO</button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <CommentsSection lessonId={currentLesson.id} currentUser={user} />
                  <CourseRating isUnlocked={courseApproved || user.role === 'admin'} currentUser={user} />
              </div>
            </div>
          ) : (
            <div className="text-center py-32 opacity-30 flex flex-col items-center">
                <Logo size={80} showText={false} />
                <p className="mt-4 font-bold text-xl uppercase tracking-widest">Nenhuma aula selecionada</p>
            </div>
          )}
        </div>
      </main>

      {viewState === 'FINAL_EXAM' && <FinalExam user={user} onCancel={() => setViewState('VIDEO')} onComplete={(p: any, _s: any, _t: any) => { setCourseApproved(p); setViewState('VIDEO'); if(p) setShowCertificateModal(true); }} />}
      {showAdminModal && <AdminAddLesson modules={modules} onClose={() => setShowAdminModal(false)} onSuccess={(m: any) => { setModules(m); setShowAdminModal(false); }} initialData={adminLessonInitialData} />}
      {showCertificateModal && <CertificateModal user={user} courseDuration="40 Horas" onClose={() => setShowCertificateModal(false)} />}
      <AccessibilityWidget />
    </div>
  );
};

export default App;
