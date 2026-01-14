
import React, { useEffect, useState } from 'react';
import { db } from '../services/database';
import { Comment, Module } from '../types';
import { X, MessageSquare, Calendar, User, Video, CheckCircle, Check, Trash2, CheckSquare, Square, EyeOff } from 'lucide-react';

interface AdminCommentsModalProps {
  modules: Module[];
  onClose: () => void;
}

const AdminCommentsModal: React.FC<AdminCommentsModalProps> = ({ modules, onClose }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadComments();
  }, []);

  const loadComments = () => {
    // FILTRA APENAS MENSAGENS NÃO LIDAS
    // c.isRead !== true garante compatibilidade com mensagens antigas sem esse campo
    const all = db.getAllComments();
    const unread = all.filter(c => c.isRead !== true);
    setComments(unread);
  };

  const handleMarkAsRead = (commentId: string) => {
    // Agora apenas "Esconde" da lista (marca como lida)
    if(window.confirm("Marcar mensagem como LIDA? Ela será ocultada desta lista.")) {
        db.markCommentsAsRead([commentId]);
        
        // Remove da visualização local
        setComments(prev => prev.filter(c => c.id !== commentId));
        
        const newSelected = new Set(selectedIds);
        newSelected.delete(commentId);
        setSelectedIds(newSelected);
    }
  };

  // --- LÓGICA DE SELEÇÃO MÚLTIPLA ---
  const toggleSelect = (id: string) => {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) {
          newSet.delete(id);
      } else {
          newSet.add(id);
      }
      setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
      if (selectedIds.size === comments.length) {
          setSelectedIds(new Set()); 
      } else {
          setSelectedIds(new Set(comments.map(c => c.id))); 
      }
  };

  const handleBulkRead = () => {
      if (selectedIds.size === 0) return;

      if (window.confirm(`Marcar ${selectedIds.size} mensagens como lidas?`)) {
          const idsToMark = Array.from(selectedIds) as string[];
          
          // Chama a função de marcar como lida em lote
          db.markCommentsAsRead(idsToMark);
          
          setComments(prev => prev.filter(c => !selectedIds.has(c.id)));
          setSelectedIds(new Set());
      }
  };
  // ------------------------------------

  const getLessonTitle = (lessonId: string) => {
    for (const mod of modules) {
      const lesson = mod.lessons.find(l => l.id === lessonId);
      if (lesson) return lesson.title;
    }
    return 'Aula desconhecida';
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex justify-between items-center p-6 border-b border-zinc-200 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-900 z-10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/10 p-2 rounded-lg">
               <MessageSquare className="text-indigo-500" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Caixa de Entrada</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {comments.length} {comments.length === 1 ? 'mensagem não lida' : 'mensagens não lidas'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
              {/* BOTÃO DE AÇÃO EM MASSA */}
              {selectedIds.size > 0 && (
                  <button 
                    onClick={handleBulkRead}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-all animate-in slide-in-from-right-5"
                  >
                      <EyeOff size={18} /> Marcar Lidas ({selectedIds.size})
                  </button>
              )}

              <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg ml-2">
                <X size={24} />
              </button>
          </div>
        </div>

        {/* BARRA DE FERRAMENTAS */}
        {comments.length > 0 && (
            <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-6">
                <button 
                    onClick={toggleSelectAll}
                    className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-white font-medium select-none"
                >
                    {selectedIds.size === comments.length && comments.length > 0 ? (
                        <CheckSquare size={20} className="text-indigo-500" />
                    ) : (
                        <Square size={20} />
                    )}
                    Selecionar Todas
                </button>
            </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-zinc-50 dark:bg-transparent">
          {comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 dark:text-zinc-500">
              <CheckCircle size={48} className="mb-4 text-emerald-500/50" />
              <p className="text-lg font-medium text-zinc-900 dark:text-zinc-300">Tudo limpo!</p>
              <p className="text-sm">Você leu todas as mensagens.</p>
            </div>
          ) : (
            comments.map((comment) => {
              const isSelected = selectedIds.has(comment.id);
              
              return (
                <div 
                    key={comment.id} 
                    className={`
                        relative border rounded-xl p-5 transition-all group flex gap-4
                        ${isSelected 
                            ? 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-500/50' 
                            : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'}
                    `}
                >
                  {/* Checkbox Individual */}
                  <div className="flex items-start pt-1">
                      <button onClick={() => toggleSelect(comment.id)} className="text-zinc-400 hover:text-indigo-500 dark:text-zinc-500 dark:hover:text-indigo-400">
                          {isSelected ? (
                              <CheckSquare size={24} className="text-indigo-500" />
                          ) : (
                              <Square size={24} />
                          )}
                      </button>
                  </div>

                  <div className="flex justify-between items-start gap-4 flex-1">
                    <div className="space-y-3 flex-1 cursor-pointer" onClick={() => toggleSelect(comment.id)}>
                      
                      {/* Header: User Info & Date */}
                      <div className="flex items-center gap-4 text-sm flex-wrap">
                        <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-200 font-medium bg-zinc-100 dark:bg-zinc-900 px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-800">
                          <User size={14} className="text-indigo-500 dark:text-indigo-400" />
                          {comment.userName}
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-500">
                          <Calendar size={14} />
                          {formatDate(comment.createdAt)}
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 max-w-[200px] truncate">
                          <Video size={14} className="text-indigo-500 dark:text-indigo-400" />
                          <span className="truncate">{getLessonTitle(comment.lessonId)}</span>
                        </div>
                      </div>

                      {/* Comment Content */}
                      <p className="text-zinc-800 dark:text-zinc-300 font-medium whitespace-pre-wrap leading-relaxed pl-1">
                        {comment.text}
                      </p>
                    </div>
                    
                    {/* BOTÃO "MARCAR COMO LIDA" */}
                    <div className="flex flex-col items-center justify-center pl-4 border-l border-zinc-200 dark:border-zinc-800/50">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMarkAsRead(comment.id); }}
                          className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-emerald-500 hover:text-white hover:border-emerald-600 transition-all w-[80px]"
                          title="Marcar como lida (ocultar)"
                        >
                            <Check size={24} />
                            <span className="text-[10px] font-bold uppercase">Lida</span>
                        </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCommentsModal;
