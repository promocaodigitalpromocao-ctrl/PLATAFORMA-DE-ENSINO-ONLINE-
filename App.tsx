
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
import { Loader2, LogOut, PlusCircle, Trophy, Award } from 'lucide-react';
import { Logo } from './components/Logo';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [initialVideoTime, setInitialVideoTime] = useState(0); 
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [viewState, setViewState] = useState<'VIDEO' | 'FINAL_EXAM'>('VIDEO');
  const [showCertificateModal, setShowCertificateModal] = useState(false); 
  const [courseApproved, setCourseApproved] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

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
        if (examResult) setCourseApproved(examResult.passed);

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

  if (isLoadingAuth || isSyncing) return <div className="h-screen flex items-center justify-center bg-zinc-950"><Loader2 className="animate-spin text-indigo-500" size={48} /></div>;
  if (!user) return <AuthScreen onLogin={(u: User) => setUser(u)} />;

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      {/* Sidebar sempre visível (Desktop) */}
      <LessonSidebar 
        modules={modules}
        currentLessonId={currentLesson?.id || ''}
        completedLessons={completedLessons}
        onSelectLesson={handleLessonSelect}
        isSidebarOpen={true}
        isDesktopOpen={true}
        isAdmin={user.role === 'admin'}
      />

      <main className="flex-1 overflow-y-auto bg-zinc-900/30">
        <div className="max-w-6xl mx-auto p-10 pb-20">
          <div className="flex justify-between items-center mb-8">
            <div>
               <h1 className="text-3xl font-bold text-white">{currentLesson?.title || "Selecione uma Aula"}</h1>
               <p className="text-zinc-500 mt-1">Seu progresso: {Math.round(progressPercentage)}% concluído</p>
            </div>
            <div className="flex items-center gap-4">
                {user.role === 'admin' && (
                    <button onClick={() => setShowAdminModal(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-lg shadow-indigo-500/20">
                      <PlusCircle size={20} /> Adicionar Aula
                    </button>
                )}
                <button onClick={handleLogout} className="p-2 text-zinc-500 hover:text-red-500 transition-colors" title="Sair"><LogOut size={24} /></button>
            </div>
          </div>

          {currentLesson ? (
            <div className="space-y-10">
              <VideoPlayer 
                key={currentLesson.id}
                videoUrl={currentLesson.videoUrl}
                initialTime={initialVideoTime}
                onComplete={handleVideoComplete}
                onProgress={(t: any) => db.saveVideoProgress(user.id, currentLesson.id, t)}
                allowSkip={user.role === 'admin'} // Admin pode pular para testar
                thumbnailUrl={currentLesson.thumbnail}
              />
              
              <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-xl">
                <h3 className="text-xl font-bold text-white mb-4">Sobre esta aula</h3>
                <p className="text-zinc-400 leading-relaxed whitespace-pre-wrap">{currentLesson.description}</p>
              </div>

              {/* Card de Certificação */}
              <div className={`p-8 rounded-2xl border-2 transition-all flex items-center justify-between ${progressPercentage >= 100 ? 'bg-indigo-600/10 border-indigo-500/50 shadow-2xl' : 'bg-zinc-900 border-zinc-800 opacity-50'}`}>
                <div className="flex items-center gap-6">
                  <div className={`p-4 rounded-full ${progressPercentage >= 100 ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-600'}`}><Trophy size={32} /></div>
                  <div>
                      <h4 className="text-xl font-bold text-white">Certificado de Conclusão</h4>
                      <p className="text-zinc-400">Assista todas as aulas para liberar o exame final.</p>
                  </div>
                </div>
                {progressPercentage >= 100 && !courseApproved && (
                    <button onClick={() => setViewState('FINAL_EXAM')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-900/40">REALIZAR PROVA</button>
                )}
                {courseApproved && (
                    <button onClick={() => setShowCertificateModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/40"><Award /> EMITIR CERTIFICADO</button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-8">
                  <CommentsSection lessonId={currentLesson.id} currentUser={user} />
                  <CourseRating isUnlocked={courseApproved || user.role === 'admin'} currentUser={user} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-40 opacity-20">
                <Logo size={100} showText={false} />
                <h2 className="text-2xl font-bold mt-6">ESCOLHA UMA AULA PARA COMEÇAR</h2>
            </div>
          )}
        </div>
      </main>

      {viewState === 'FINAL_EXAM' && <FinalExam user={user} onCancel={() => setViewState('VIDEO')} onComplete={(p: any) => { setCourseApproved(p); setViewState('VIDEO'); if(p) setShowCertificateModal(true); }} />}
      {showAdminModal && <AdminAddLesson modules={modules} onClose={() => setShowAdminModal(false)} onSuccess={(m: any) => { setModules(m); setShowAdminModal(false); }} />}
      {showCertificateModal && <CertificateModal user={user} courseDuration="40 Horas" onClose={() => setShowCertificateModal(false)} />}
      <AccessibilityWidget />
    </div>
  );
};

export default App;
