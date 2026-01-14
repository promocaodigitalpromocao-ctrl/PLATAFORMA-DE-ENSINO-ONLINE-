
import React, { useState } from 'react';
import { User } from '../types';
import { db } from '../services/database';
import { X, Save, UserCircle, Briefcase, Building2 } from 'lucide-react';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
  onUpdate: (user: User) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onUpdate }) => {
  const [name, setName] = useState(user.name);
  const [sector, setSector] = useState(user.sector || '');
  const [jobTitle, setJobTitle] = useState(user.jobTitle || '');

  const handleSave = () => {
    if (!name.trim()) {
        alert("O nome é obrigatório.");
        return;
    }

    const updatedUser: User = {
      ...user,
      name,
      sector,
      jobTitle
    };
    db.updateUser(updatedUser);
    onUpdate(updatedUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <UserCircle className="text-indigo-500" /> Editar Perfil
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
             <label className="block text-sm font-medium text-zinc-400 mb-1.5 ml-1">Nome de Exibição</label>
             <div className="relative">
                 <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-700 text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="Seu nome"
                 />
                 <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="block text-sm font-medium text-zinc-400 mb-1.5 ml-1">Setor</label>
                 <div className="relative">
                     <input
                        type="text"
                        value={sector}
                        onChange={(e) => setSector(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-700 text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        placeholder="Ex: TI"
                     />
                     <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                 </div>
              </div>
              <div>
                 <label className="block text-sm font-medium text-zinc-400 mb-1.5 ml-1">Cargo</label>
                 <div className="relative">
                     <input
                        type="text"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-700 text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        placeholder="Ex: Analista"
                     />
                     <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                 </div>
              </div>
          </div>

          <button 
            onClick={handleSave}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 mt-2"
          >
            <Save size={18} />
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
