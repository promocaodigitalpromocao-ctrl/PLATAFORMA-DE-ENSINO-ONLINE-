
import React, { useState, useEffect } from 'react';
import { QuestionBank, Question } from '../types';
import { db } from '../services/database';
import { generateQuestionsFromContent } from '../services/geminiService';
import { X, Plus, Save, Trash2, LayoutList, AlertTriangle, Sparkles, Loader2 } from 'lucide-react';

interface AdminQuestionBankProps {
  onClose: () => void;
}

const AdminQuestionBank: React.FC<AdminQuestionBankProps> = ({ onClose }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const bank = db.getQuestionBank();
    if (bank && bank.questions) {
        setQuestions(bank.questions);
    }
  }, []);

  const addQuestion = () => {
    const newQuestion: Question = {
        id: Date.now().toString(),
        text: '',
        options: ['', '', '', ''],
        correctAnswer: 0
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (index: number) => {
    if (window.confirm("Tem certeza que deseja excluir esta pergunta?")) {
        const newQs = [...questions];
        newQs.splice(index, 1);
        setQuestions(newQs);
    }
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const newQs = [...questions];
    newQs[index] = { ...newQs[index], [field]: value };
    setQuestions(newQs);
  };

  const updateOption = (qIndex: number, oIndex: number, text: string) => {
    const newQs = [...questions];
    newQs[qIndex].options[oIndex] = text;
    setQuestions(newQs);
  };

  const handleGenerateAI = async () => {
      const modules = db.getModules();
      if (modules.length === 0) {
          alert("Não há aulas cadastradas para basear as perguntas.");
          return;
      }

      if (!window.confirm("Isso irá gerar 60 novas perguntas baseadas nos Títulos e Descrições das suas aulas. Deseja continuar?")) {
          return;
      }

      setIsGenerating(true);
      
      // Monta o contexto para a IA
      let context = "";
      modules.forEach(mod => {
          context += `MÓDULO: ${mod.title}\n`;
          mod.lessons.forEach(lesson => {
              context += `AULA: ${lesson.title}\nDESCRIÇÃO: ${lesson.description}\n---\n`;
          });
      });

      const generated = await generateQuestionsFromContent(context);
      
      setIsGenerating(false);

      if (generated && generated.length > 0) {
          // Adiciona as novas perguntas às existentes ou substitui (opção do usuário seria melhor, mas vamos adicionar)
          setQuestions(prev => [...prev, ...generated]);
          alert(`${generated.length} perguntas geradas com sucesso! Revise e salve.`);
      } else {
          alert("Erro ao gerar perguntas. Verifique se as descrições das aulas estão preenchidas ou tente novamente.");
      }
  };

  const handleSave = () => {
      // Validate
      for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          if (!q.text.trim()) {
              alert(`A pergunta ${i + 1} está sem título.`);
              return;
          }
          if (q.options.some(o => !o.trim())) {
              alert(`A pergunta ${i + 1} tem opções vazias.`);
              return;
          }
      }

      setIsSaving(true);
      db.saveQuestionBank({ questions });
      setTimeout(() => {
          setIsSaving(false);
          alert("Banco de questões salvo com sucesso!");
          onClose();
      }, 500);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center p-6 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-500/10 p-2 rounded-lg">
                <LayoutList className="text-indigo-500" size={24} />
             </div>
             <div>
                <h2 className="text-xl font-bold text-white">Banco de Questões Geral</h2>
                <p className="text-sm text-zinc-400">Cadastre suas perguntas ou use a IA.</p>
             </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center sticky top-0 z-10 flex-wrap gap-2">
           <div className={`text-sm font-bold ${questions.length < 20 ? 'text-amber-500' : 'text-emerald-500'} flex items-center gap-2`}>
               {questions.length < 20 && <AlertTriangle size={16} />}
               Total: {questions.length} Questões (Meta: 60)
           </div>
           
           <div className="flex gap-3">
               <button 
                 onClick={handleGenerateAI}
                 disabled={isGenerating}
                 className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white hover:bg-violet-700 rounded-lg transition-colors font-bold shadow-lg shadow-violet-900/20 disabled:opacity-50"
               >
                   {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                   {isGenerating ? 'IA Gerando...' : 'Gerar 60 com IA'}
               </button>

               <button 
                onClick={addQuestion}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-lg transition-colors font-medium border border-zinc-700"
               >
                   <Plus size={18} /> Manual
               </button>
               <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-colors font-bold shadow-lg shadow-emerald-900/20 disabled:opacity-50"
               >
                   {isSaving ? 'Salvando...' : 'Salvar Banco'} <Save size={18} />
               </button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {questions.length === 0 ? (
                <div className="text-center py-20 text-zinc-500 border-2 border-dashed border-zinc-800 rounded-2xl">
                    <LayoutList size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Nenhuma pergunta cadastrada.</p>
                    <div className="flex justify-center gap-4 mt-4">
                        <button onClick={addQuestion} className="text-indigo-400 font-bold hover:underline">Criar Manualmente</button>
                        <span className="text-zinc-600">ou</span>
                        <button onClick={handleGenerateAI} className="text-violet-400 font-bold hover:underline flex items-center gap-1"><Sparkles size={14}/> Gerar com IA</button>
                    </div>
                </div>
            ) : (
                questions.map((q, qIndex) => (
                    <div key={q.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 relative group hover:border-zinc-700 transition-colors">
                        <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => removeQuestion(qIndex)} className="text-zinc-600 hover:text-red-500 p-2">
                                <Trash2 size={18} />
                            </button>
                        </div>
                        
                        <div className="flex gap-4 items-start mb-4 pr-10">
                            <span className="bg-zinc-800 text-zinc-400 px-3 py-1 rounded text-sm font-bold">#{qIndex + 1}</span>
                            <input
                                type="text"
                                value={q.text}
                                onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                                className="flex-1 bg-transparent border-b border-zinc-800 focus:border-indigo-500 outline-none text-white font-medium py-1 placeholder-zinc-600"
                                placeholder="Digite o enunciado da pergunta aqui..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-12">
                            {q.options.map((opt, oIndex) => (
                                <div key={oIndex} className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        checked={q.correctAnswer === oIndex}
                                        onChange={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                                        className="accent-emerald-500 w-4 h-4 cursor-pointer"
                                        title="Marcar como correta"
                                    />
                                    <input
                                        type="text"
                                        value={opt}
                                        onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                        className={`flex-1 text-sm bg-zinc-900 border rounded px-3 py-2 outline-none ${q.correctAnswer === oIndex ? 'border-emerald-500/30 text-emerald-200' : 'border-zinc-700 text-zinc-300'}`}
                                        placeholder={`Opção ${oIndex + 1}`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};

export default AdminQuestionBank;