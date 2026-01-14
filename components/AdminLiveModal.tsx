
import React, { useState, useEffect } from 'react';
import { db } from '../services/database';
import { LiveEvent } from '../types';
import { X, Video, Calendar, Clock, Save, Trash2, Radio, Info } from 'lucide-react';

interface AdminLiveModalProps {
  onClose: () => void;
  currentEvent: LiveEvent | null;
  onUpdate: (event: LiveEvent | null) => void;
}

const AdminLiveModal: React.FC<AdminLiveModalProps> = ({ onClose, currentEvent, onUpdate }) => {
  const [title, setTitle] = useState('');
  const [meetUrl, setMeetUrl] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (currentEvent) {
      setTitle(currentEvent.title);
      setMeetUrl(currentEvent.meetUrl);
      setIsActive(currentEvent.active);
      
      const eventDate = new Date(currentEvent.date);
      if (!isNaN(eventDate.getTime())) {
          setDate(eventDate.toISOString().split('T')[0]);
          setTime(eventDate.toTimeString().slice(0, 5));
      }
    }
  }, [currentEvent]);

  const handleSave = () => {
    if (!title || !meetUrl || !date || !time) {
        alert("Preencha todos os campos.");
        return;
    }

    const fullDate = new Date(`${date}T${time}`);
    
    const newEvent: LiveEvent = {
        id: currentEvent?.id || Date.now().toString(),
        title,
        meetUrl,
        date: fullDate.toISOString(),
        active: isActive
    };

    db.saveLiveEvent(newEvent);
    onUpdate(newEvent);
    onClose();
  };

  const handleClear = () => {
      if (confirm("Tem certeza que deseja remover a Live agendada?")) {
          db.saveLiveEvent(null);
          onUpdate(null);
          onClose();
      }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Radio className="text-red-500" /> Configurar Live (Ao Vivo)
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
            
            {/* DICA DE PLATAFORMA */}
            <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-lg flex gap-3 items-start mb-2">
                <Info size={18} className="text-indigo-400 mt-0.5 shrink-0" />
                <div className="text-xs text-zinc-300">
                    <strong>Dica:</strong> Se usar um link do <strong>YouTube</strong>, o vídeo tocará dentro do app. Links do <strong>Google Meet</strong> ou <strong>Zoom</strong> abrirão em uma nova aba.
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Título da Aula Ao Vivo</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                    placeholder="Ex: Tira Dúvidas - Módulo 2"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1 flex items-center gap-1">
                    <Video size={14} /> Link da Transmissão (YouTube, Meet, Zoom...)
                </label>
                <input
                    type="text"
                    value={meetUrl}
                    onChange={(e) => setMeetUrl(e.target.value)}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:ring-2 focus:ring-red-500 outline-none placeholder-zinc-600"
                    placeholder="Ex: https://youtu.be/... ou https://meet.google.com/..."
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1 flex items-center gap-1">
                        <Calendar size={14} /> Data
                    </label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1 flex items-center gap-1">
                        <Clock size={14} /> Horário
                    </label>
                    <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-zinc-950 rounded-xl border border-zinc-800 mt-4">
                <div className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${isActive ? 'bg-red-600' : 'bg-zinc-700'}`} onClick={() => setIsActive(!isActive)}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${isActive ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
                <div>
                    <span className="text-white font-bold block">Estamos Ao Vivo AGORA?</span>
                    <span className="text-xs text-zinc-500">Ative isso para destacar a live para todos os alunos instantaneamente.</span>
                </div>
            </div>

        </div>

        <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 flex justify-between gap-3">
          {currentEvent && (
              <button 
                onClick={handleClear}
                className="px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2"
              >
                  <Trash2 size={18} /> Remover
              </button>
          )}
          <div className="flex gap-3 ml-auto">
             <button onClick={onClose} className="px-4 py-2 text-zinc-300 font-medium hover:bg-zinc-800 rounded-lg transition-colors">
                Cancelar
             </button>
             <button 
                onClick={handleSave} 
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-red-900/20"
             >
                <Save size={18} /> Salvar Live
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLiveModal;
