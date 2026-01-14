
import React, { useState, useEffect } from 'react';
import { Accessibility, Type, ZoomIn, ZoomOut, Eye, Sun, MousePointer2, X, RotateCcw } from 'lucide-react';

const AccessibilityWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(100);
  const [isGrayscale, setIsGrayscale] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isReadableFont, setIsReadableFont] = useState(false);
  const [isBigCursor, setIsBigCursor] = useState(false);

  // Aplica as mudanças no elemento HTML raiz
  useEffect(() => {
    const root = document.documentElement;

    // 1. Tamanho da Fonte
    root.style.fontSize = `${fontSize}%`;

    // 2. Filtros (Grayscale + Contraste)
    let filters = [];
    if (isGrayscale) filters.push('grayscale(100%)');
    if (isHighContrast) filters.push('contrast(150%)');
    root.style.filter = filters.length > 0 ? filters.join(' ') : 'none';

    // 3. Fonte Legível (Dislexia/Leitura fácil)
    if (isReadableFont) {
      root.classList.add('font-readable');
      // Injeta estilo global se não existir
      if (!document.getElementById('a11y-font-style')) {
        const style = document.createElement('style');
        style.id = 'a11y-font-style';
        style.innerHTML = `
          .font-readable * {
            font-family: 'Verdana', 'Helvetica', 'Arial', sans-serif !important;
            letter-spacing: 0.05em !important;
            line-height: 1.6 !important;
          }
        `;
        document.head.appendChild(style);
      }
    } else {
      root.classList.remove('font-readable');
    }

    // 4. Cursor Grande
    if (isBigCursor) {
        root.classList.add('cursor-big');
        if (!document.getElementById('a11y-cursor-style')) {
            const style = document.createElement('style');
            style.id = 'a11y-cursor-style';
            style.innerHTML = `
              .cursor-big, .cursor-big * {
                cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="black" stroke="white" stroke-width="2"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>'), auto !important;
              }
              .cursor-big button, .cursor-big a {
                 cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="black" stroke="white" stroke-width="2"><path d="M14 9l6 6-6 6"/><path d="M4 4h7a4 4 0 0 1 4 4v12"/></svg>'), pointer !important;
              }
            `;
            document.head.appendChild(style);
        }
    } else {
        root.classList.remove('cursor-big');
    }

  }, [fontSize, isGrayscale, isHighContrast, isReadableFont, isBigCursor]);

  const resetAll = () => {
    setFontSize(100);
    setIsGrayscale(false);
    setIsHighContrast(false);
    setIsReadableFont(false);
    setIsBigCursor(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 print:hidden">
      
      {/* Menu Panel */}
      {isOpen && (
        <div className="absolute bottom-12 right-0 w-64 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-4 animate-in slide-in-from-bottom-5 zoom-in-95 duration-200 mb-2">
          
          <div className="flex justify-between items-center mb-3 border-b border-zinc-200 dark:border-zinc-800 pb-2">
            <h3 className="font-bold text-sm text-zinc-800 dark:text-white flex items-center gap-2">
              <Accessibility size={16} className="text-indigo-600 dark:text-indigo-400" />
              Acessibilidade
            </h3>
            <button 
                onClick={resetAll}
                className="text-[10px] text-zinc-500 hover:text-red-500 flex items-center gap-1 transition-colors uppercase font-bold tracking-wider"
                title="Resetar tudo"
            >
                <RotateCcw size={10} /> Resetar
            </button>
          </div>

          <div className="space-y-3">
            
            {/* Font Size */}
            <div className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-950 p-1.5 rounded-lg">
                <button 
                    onClick={() => setFontSize(prev => Math.max(90, prev - 10))}
                    className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors"
                    title="Diminuir Fonte"
                >
                    <ZoomOut size={16} className="text-zinc-600 dark:text-zinc-400" />
                </button>
                <span className="font-bold text-xs text-zinc-700 dark:text-zinc-300">{fontSize}%</span>
                <button 
                    onClick={() => setFontSize(prev => Math.min(150, prev + 10))}
                    className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors"
                    title="Aumentar Fonte"
                >
                    <ZoomIn size={16} className="text-zinc-600 dark:text-zinc-400" />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
                {/* Grayscale */}
                <button
                    onClick={() => setIsGrayscale(!isGrayscale)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all gap-1.5
                        ${isGrayscale 
                            ? 'bg-zinc-800 text-white border-zinc-700' 
                            : 'bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'}
                    `}
                >
                    <Eye size={16} />
                    <span className="text-[10px] font-medium">Sem Cores</span>
                </button>

                {/* High Contrast */}
                <button
                    onClick={() => setIsHighContrast(!isHighContrast)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all gap-1.5
                        ${isHighContrast 
                            ? 'bg-zinc-800 text-white border-zinc-700' 
                            : 'bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'}
                    `}
                >
                    <Sun size={16} />
                    <span className="text-[10px] font-medium">Contraste</span>
                </button>

                {/* Readable Font */}
                <button
                    onClick={() => setIsReadableFont(!isReadableFont)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all gap-1.5
                        ${isReadableFont 
                            ? 'bg-zinc-800 text-white border-zinc-700' 
                            : 'bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'}
                    `}
                >
                    <Type size={16} />
                    <span className="text-[10px] font-medium">Fonte Legível</span>
                </button>

                {/* Big Cursor */}
                <button
                    onClick={() => setIsBigCursor(!isBigCursor)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all gap-1.5
                        ${isBigCursor 
                            ? 'bg-zinc-800 text-white border-zinc-700' 
                            : 'bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'}
                    `}
                >
                    <MousePointer2 size={16} />
                    <span className="text-[10px] font-medium">Cursor Grande</span>
                </button>
            </div>

          </div>
        </div>
      )}

      {/* Toggle Button - Pequeno e Discreto */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`
            p-2 rounded-full shadow-md transition-all duration-300 transform hover:scale-105 flex items-center justify-center border
            ${isOpen 
                ? 'bg-zinc-800 text-white rotate-90 border-zinc-800' 
                : 'bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-700'}
        `}
        title="Opções de Acessibilidade"
        aria-label="Abrir menu de acessibilidade"
      >
        {isOpen ? <X size={18} /> : <Accessibility size={20} />}
      </button>
    </div>
  );
};

export default AccessibilityWidget;
