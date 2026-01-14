
import React, { useState, useEffect } from 'react';
import { db } from '../services/database';
import { Question, User } from '../types';
import { CheckCircle2, XCircle, AlertTriangle, ArrowRight, Award, ShieldAlert } from 'lucide-react';

interface FinalExamProps {
  onComplete: (passed: boolean, score: number, total: number) => void;
  onCancel: () => void;
  user: User; // Adicionado para verificar permissão
}

const FinalExam: React.FC<FinalExamProps> = ({ onComplete, onCancel, user }) => {
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]); 
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    // 1. Carregar Banco
    const bank = db.getQuestionBank();
    const totalBankQuestions = bank?.questions?.length || 0;
    
    // Regra: Alunos precisam de 20 questões. Admin precisa de pelo menos 1.
    const minQuestions = user.role === 'admin' ? 1 : 20;

    if (!bank || !bank.questions || totalBankQuestions < minQuestions) {
        alert(user.role === 'admin' 
            ? "Você precisa criar pelo menos 1 questão no Banco de Questões para testar a prova." 
            : "O banco de questões ainda não tem o mínimo de 20 perguntas para gerar a prova. Contate o administrador."
        );
        onCancel();
        return;
    }

    // 2. Sorteio Aleatório (Shuffle)
    const shuffled = [...bank.questions].sort(() => 0.5 - Math.random());
    
    // 3. Seleção de Questões
    // Se for admin e tiver menos de 20, pega todas. Se tiver mais, pega 20.
    // Se for aluno, a validação acima já garantiu que tem pelo menos 20.
    const questionsToTake = Math.min(totalBankQuestions, 20);
    
    const selectedQuestions = shuffled.slice(0, questionsToTake);
    
    setExamQuestions(selectedQuestions);
    setAnswers(new Array(selectedQuestions.length).fill(-1));
  }, []);

  const handleSelectOption = (optionIndex: number) => {
      const newAnswers = [...answers];
      newAnswers[currentQuestionIndex] = optionIndex;
      setAnswers(newAnswers);
  };

  const handleNext = () => {
      if (currentQuestionIndex < examQuestions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
      } else {
          finishExam();
      }
  };

  const finishExam = () => {
      let correctCount = 0;
      examQuestions.forEach((q, index) => {
          if (answers[index] === q.correctAnswer) {
              correctCount++;
          }
      });
      setScore(correctCount);
      setShowResult(true);
      
      const totalQuestions = examQuestions.length;
      // Aprovação: 70% de acerto (Arredondado para cima)
      const neededToPass = Math.ceil(totalQuestions * 0.7);
      const passed = correctCount >= neededToPass;

      // Salva no banco apenas se passar ou para registro
      onComplete(passed, correctCount, totalQuestions);
  };

  if (examQuestions.length === 0) return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
          Carregando prova...
      </div>
  );

  const currentQ = examQuestions[currentQuestionIndex];
  const isLast = currentQuestionIndex === examQuestions.length - 1;
  const progress = ((currentQuestionIndex + 1) / examQuestions.length) * 100;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 final-exam-container transition-colors duration-500">
       {user.role === 'admin' && (
           <div className="fixed top-4 bg-amber-500/10 text-amber-500 px-4 py-2 rounded-full border border-amber-500/20 text-xs font-bold flex items-center gap-2 z-10">
               <ShieldAlert size={14} /> MODO DE TESTE (ADMINISTRADOR)
           </div>
       )}

       <div className="w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 final-exam-card">
           {/* Header */}
           <div className="p-6 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center final-exam-header">
               <h2 className="text-xl font-bold text-white flex items-center gap-2">
                   <Award className="text-yellow-500" /> Prova Final
               </h2>
               <div className="text-sm font-mono text-zinc-400 final-exam-counter">
                   Questão {currentQuestionIndex + 1} / {examQuestions.length}
               </div>
           </div>

           {/* Progress Bar */}
           <div className="h-1 w-full bg-zinc-800 final-exam-progress-bg">
               <div className="h-full bg-indigo-600 transition-all duration-300 final-exam-progress-fill" style={{ width: `${progress}%` }} />
           </div>

           {/* Question Content */}
           <div className="p-8 flex-1">
               <h3 className="text-lg font-medium text-white mb-6 leading-relaxed final-exam-text">
                   {currentQ.text}
               </h3>

               <div className="space-y-3">
                   {currentQ.options.map((opt, idx) => (
                       <button
                        key={idx}
                        onClick={() => handleSelectOption(idx)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all flex justify-between items-center group final-exam-option
                            ${answers[currentQuestionIndex] === idx 
                                ? 'border-indigo-500 bg-indigo-500/10 text-white selected' 
                                : 'border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:border-zinc-700'
                            }
                        `}
                       >
                           <span>{opt}</span>
                           {answers[currentQuestionIndex] === idx && <CheckCircle2 size={20} className="text-indigo-500 final-exam-check" />}
                       </button>
                   ))}
               </div>
           </div>

           {/* Footer */}
           <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 flex justify-between final-exam-footer">
               <button 
                onClick={onCancel}
                className="px-4 py-2 text-zinc-500 hover:text-white transition-colors"
               >
                   Cancelar Prova
               </button>

               <button
                onClick={handleNext}
                disabled={answers[currentQuestionIndex] === -1} // Obriga a responder
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed final-exam-next-btn"
               >
                   {isLast ? 'Finalizar Prova' : 'Próxima Questão'} <ArrowRight size={18} />
               </button>
           </div>
       </div>
    </div>
  );
};

export default FinalExam;
