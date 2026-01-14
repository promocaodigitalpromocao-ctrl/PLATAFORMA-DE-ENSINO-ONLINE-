
import React, { useState, useEffect } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { db } from '../services/database';

interface LogoProps {
  size?: number;
  showText?: boolean;
  editable?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 32, showText = true, editable = false }) => {
  const [schoolName, setSchoolName] = useState(db.getSchoolName());
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(schoolName);

  useEffect(() => {
    // Carrega nome inicial
    setSchoolName(db.getSchoolName());
    setTempName(db.getSchoolName());

    // Escuta evento global de mudança de nome para sincronizar todos os logos da tela
    const handleUpdate = () => {
        setSchoolName(db.getSchoolName());
    };
    window.addEventListener('schoolNameChanged', handleUpdate);
    return () => window.removeEventListener('schoolNameChanged', handleUpdate);
  }, []);

  const handleSave = () => {
      if (tempName.trim()) {
          db.setSchoolName(tempName);
          setIsEditing(false);
      }
  };

  const handleCancel = () => {
      setTempName(schoolName);
      setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSave();
      if (e.key === 'Escape') handleCancel();
  };

  // Custom SVG Logo Component
  const CustomIcon = () => (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoGradient" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#4F46E5" floodOpacity="0.3"/>
        </filter>
      </defs>
      
      {/* Background Shape (Rounded Square/App Icon Style) */}
      <rect x="32" y="32" width="448" height="448" rx="120" fill="url(#logoGradient)" filter="url(#dropShadow)" />
      
      {/* Mortarboard (Capelo) Top */}
      <path d="M256 120L100 200L256 280L412 200L256 120Z" fill="white" fillOpacity="0.95"/>
      
      {/* Play Button Triangle (Integrated into the base) */}
      <path d="M200 240V380C200 395 218 405 230 395L340 320C350 312 350 298 340 290L256 230" fill="white"/>
      
      {/* Tassel (Franja do Capelo) */}
      <path d="M412 200V260" stroke="white" strokeWidth="12" strokeLinecap="round"/>
      <circle cx="412" cy="275" r="16" fill="#FCD34D" /> 
    </svg>
  );

  if (showText) {
    const parts = schoolName.split(' ');
    // Tentativa de quebra inteligente: "Plataforma" (linha 1) "de Ensino" (linha 2)
    const firstPart = parts.length > 2 ? parts.slice(0, Math.ceil(parts.length/2)).join(' ') : parts[0];
    const secondPart = parts.length > 2 ? parts.slice(Math.ceil(parts.length/2)).join(' ') : parts.slice(1).join(' ');

    return (
      <div className="flex items-center gap-3 select-none group/logo">
        <div className="shrink-0 transition-transform duration-300 hover:scale-105">
           <CustomIcon />
        </div>
        
        <div className="flex flex-col justify-center">
            {isEditing ? (
                <div className="flex items-center gap-2 animate-in fade-in zoom-in-95">
                    <input 
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 font-bold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-lg min-w-[200px]"
                        autoFocus
                        style={{ fontSize: Math.max(14, size * 0.45) }}
                        placeholder="Nome da Plataforma"
                    />
                    <div className="flex gap-1">
                        <button 
                            onClick={handleSave} 
                            className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors shadow-sm"
                            title="Salvar"
                        >
                            <Check size={14} />
                        </button>
                        <button 
                            onClick={handleCancel} 
                            className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors shadow-sm"
                            title="Cancelar"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="relative group/editTrigger">
                    <h1 className="font-bold leading-tight tracking-tight flex flex-col" style={{ fontSize: size * 0.55 }}>
                        <span className="text-zinc-900 dark:text-white drop-shadow-sm whitespace-nowrap">{firstPart}</span> 
                        {secondPart && <span className="text-indigo-600 dark:text-indigo-400 font-medium whitespace-nowrap">{secondPart}</span>}
                    </h1>
                    
                    {editable && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); setTempName(schoolName); setIsEditing(true); }}
                            className="opacity-0 group-hover/logo:opacity-100 transition-all p-1.5 text-zinc-400 hover:text-indigo-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg absolute -right-8 top-1/2 -translate-y-1/2"
                            title="Alterar nome da escola"
                        >
                            <Pencil size={14} />
                        </button>
                    )}
                </div>
            )}
        </div>
      </div>
    );
  }

  // Modo Apenas Ícone
  return (
    <div className="flex items-center justify-center select-none hover:scale-110 transition-transform duration-300">
       <CustomIcon />
    </div>
  );
};
