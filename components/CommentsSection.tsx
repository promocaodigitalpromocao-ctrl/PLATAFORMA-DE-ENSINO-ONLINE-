
import React, { useState } from 'react';
import { db } from '../services/database';
import { User } from '../types';
import { Send, MessageSquare, ShieldCheck } from 'lucide-react';

interface CommentsSectionProps {
  lessonId: string;
  currentUser: User;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ lessonId, currentUser }) => {
  const [newComment, setNewComment] = useState('');
  const [justSent, setJustSent] = useState(false);
  
  const LIMIT = 1000;

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value.toUpperCase();
    if (text.length <= LIMIT) {
      setNewComment(text);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    // Envia o comentário (que será salvo na planilha pela função do database)
    db.addComment(lessonId, currentUser.id, currentUser.name, newComment);
    
    setNewComment('');
    setJustSent(true);
    setTimeout(() => setJustSent(false), 3000);
  };

  return (
    <div className="mt-8 bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="text-indigo-500" size={24} />
        <h3 className="text-xl font-bold text-white">Dúvidas & Comentários</h3>
      </div>

      <div className="mb-4 text-sm text-zinc-400">
          Envie sua dúvida abaixo. Ela será encaminhada diretamente para a planilha da administração.
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <textarea
            value={newComment}
            onChange={handleInputChange}
            placeholder="DIGITE SUA MENSAGEM PARA A ADMINISTRAÇÃO..."
            className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl p-4 min-h-[100px] focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-y placeholder-zinc-600 font-medium"
          />
          <div className="absolute bottom-3 right-3 text-xs text-zinc-500">
            {newComment.length} / {LIMIT}
          </div>
        </div>
        <div className="flex justify-between items-center mt-3">
            <div className="text-xs text-zinc-500 flex items-center gap-1">
               <ShieldCheck size={14} className="text-emerald-500" />
               Mensagem privada para o Admin.
            </div>
            <button
                type="submit"
                disabled={!newComment.trim()}
                className={`
                px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-all duration-300
                ${justSent 
                    ? 'bg-emerald-600 text-white cursor-default' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed'}
                `}
            >
                {justSent ? (
                    <>Enviado com Sucesso <ShieldCheck size={18} /></>
                ) : (
                    <>Enviar Mensagem <Send size={18} /></>
                )}
            </button>
        </div>
      </form>
    </div>
  );
};

export default CommentsSection;
