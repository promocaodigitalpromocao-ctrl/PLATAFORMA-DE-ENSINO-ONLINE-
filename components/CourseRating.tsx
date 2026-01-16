
import React, { useState, useEffect } from 'react';
import { CourseRating as CourseRatingData, User } from '../types';
import { db } from '../services/database';
import { Star, Lock, MessageSquareQuote, Send, UserCircle2 } from 'lucide-react';

interface CourseRatingProps {
  isUnlocked: boolean;
  currentUser: User;
}

const CourseRating: React.FC<CourseRatingProps> = ({ isUnlocked, currentUser }) => {
  const [ratings, setRatings] = useState<CourseRatingData[]>([]);
  const [userRating, setUserRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hasRated, setHasRated] = useState(false);
  const [average, setAverage] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);

  useEffect(() => {
    loadRatings();
  }, []);

  const loadRatings = () => {
    const data = db.getRatings();
    setRatings(data);
    
    // Verifica se usuário já avaliou
    const myRating = data.find(r => r.userId === currentUser.id);
    if (myRating) {
        setHasRated(true);
        setUserRating(myRating.rating);
        setComment(myRating.comment);
    }

    // Calcula média
    if (data.length > 0) {
        const sum = data.reduce((acc, r) => acc + r.rating, 0);
        setAverage(parseFloat((sum / data.length).toFixed(1)));
    } else {
        setAverage(0);
    }
  };

  const handleSubmit = () => {
      if (userRating === 0) return;
      db.addRating(currentUser.id, currentUser.name, userRating, comment);
      setHasRated(true);
      loadRatings(); // Recarrega para atualizar média e lista
  };

  // Se estiver bloqueado e não for admin
  if (!isUnlocked) {
      return (
          <div className="mt-8 bg-zinc-900 rounded-2xl border border-zinc-800 p-6 flex flex-col items-center justify-center text-center opacity-70 grayscale transition-all hover:grayscale-0 hover:opacity-100">
              <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                  <Lock className="text-zinc-500" size={32} />
              </div>
              <h3 className="text-xl font-bold text-zinc-300 mb-2">Avaliação Bloqueada</h3>
              <p className="text-zinc-500 max-w-md">
                  Para avaliar este curso e ver o que os outros alunos estão dizendo, você precisa **concluir o curso e ser aprovado na prova final**.
              </p>
          </div>
      );
  }

  return (
    <div className="mt-8 bg-zinc-900 rounded-2xl border border-zinc-800 p-6 shadow-inner">
        <div className="flex flex-col md:flex-row gap-8">
            
            {/* LEFT: SUMMARY & INPUT */}
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-4">
                   <Star className="text-yellow-500 fill-yellow-500" size={24} />
                   <h3 className="text-xl font-bold text-white">Avaliação do Curso</h3>
                </div>

                <div className="flex items-end gap-3 mb-6">
                    <span className="text-5xl font-bold text-white">{average}</span>
                    <div className="mb-2">
                        <div className="flex text-yellow-500 text-sm">
                            {[1, 2, 3, 4, 5].map(star => (
                                <Star key={star} size={16} className={star <= Math.round(average) ? "fill-yellow-500" : "text-zinc-700"} />
                            ))}
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">{ratings.length} avaliações</p>
                    </div>
                </div>

                {/* RATING FORM */}
                <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800">
                    <h4 className="text-sm font-bold text-zinc-300 mb-3">
                        {hasRated ? "Sua Avaliação (Atualizar)" : "O que você achou?"}
                    </h4>
                    
                    <div className="flex gap-2 mb-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setUserRating(star)}
                                onMouseEnter={() => setHoveredStar(star)}
                                onMouseLeave={() => setHoveredStar(0)}
                                className="transition-transform hover:scale-110 focus:outline-none"
                            >
                                <Star 
                                    size={28} 
                                    className={`${star <= (hoveredStar || userRating) ? "text-yellow-400 fill-yellow-400" : "text-zinc-700"}`} 
                                />
                            </button>
                        ))}
                    </div>

                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Escreva um depoimento sobre o curso..."
                        className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg p-3 text-sm focus:ring-1 focus:ring-yellow-500 outline-none resize-none h-24 mb-3"
                    />

                    <button
                        onClick={handleSubmit}
                        disabled={userRating === 0}
                        className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {hasRated ? "Atualizar Avaliação" : "Enviar Avaliação"} <Send size={16} />
                    </button>
                </div>
            </div>

            {/* RIGHT: REVIEWS LIST */}
            <div className="flex-1 md:border-l border-zinc-800 md:pl-8 max-h-[400px] overflow-y-auto">
                 <h4 className="text-sm font-bold text-zinc-400 mb-4 flex items-center gap-2">
                     <MessageSquareQuote size={16} /> Depoimentos Recentes
                 </h4>
                 
                 <div className="space-y-4">
                     {ratings.length === 0 ? (
                         <p className="text-zinc-600 text-sm italic">Seja o primeiro a avaliar este curso!</p>
                     ) : (
                         ratings.slice().reverse().map(rating => (
                             <div key={rating.id} className="pb-4 border-b border-zinc-800 last:border-0">
                                 <div className="flex justify-between items-start mb-2">
                                     <div className="flex items-center gap-2">
                                         <div className="bg-zinc-800 p-1 rounded-full">
                                            <UserCircle2 size={16} className="text-zinc-400" />
                                         </div>
                                         <span className="text-sm font-semibold text-zinc-300">{rating.userName}</span>
                                     </div>
                                     <div className="flex gap-0.5">
                                         {[1, 2, 3, 4, 5].map(s => (
                                             <Star key={s} size={10} className={s <= rating.rating ? "text-yellow-500 fill-yellow-500" : "text-zinc-800"} />
                                         ))}
                                     </div>
                                 </div>
                                 {rating.comment && (
                                     <p className="text-zinc-400 text-sm italic">"{rating.comment}"</p>
                                 )}
                             </div>
                         ))
                     )}
                 </div>
            </div>
        </div>
    </div>
  );
};

export default CourseRating;
