
import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { X, Loader2, CheckCircle2, Printer, Download } from 'lucide-react';
import { Logo } from './Logo';

interface CertificateModalProps {
  user: User;
  courseDuration: string;
  onClose: () => void;
}

// Declaração para o TS reconhecer a lib importada no HTML
declare const html2pdf: any;

const CertificateModal: React.FC<CertificateModalProps> = ({ user, courseDuration, onClose }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const completionDate = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  // Calcula a escala para caber na tela sem perder a proporção A4
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const parentWidth = window.innerWidth - 32; // 32px de padding
        const baseWidth = 1123; // Largura A4 em pixels (96dpi)
        // Se a tela for menor que o certificado, reduz a escala. Se for maior, limita a 0.8 para não ficar gigante
        const newScale = Math.min(parentWidth / baseWidth, 0.9);
        setScale(newScale);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Executa ao abrir

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    const element = document.getElementById('certificate-content');
    
    // Configurações exatas para A4
    const opt = {
      margin: 0,
      filename: `Certificado_${user.name.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
          scale: 2, 
          useCORS: true, 
          logging: false,
          width: 1123, 
          height: 794,
          windowWidth: 1123,
          windowHeight: 794,
          scrollX: 0,
          scrollY: 0
      },
      jsPDF: { unit: 'px', format: [1123, 794], orientation: 'landscape', hotfixes: ["px_scaling"] }
    };

    try {
        if (typeof html2pdf !== 'undefined') {
            await html2pdf().set(opt).from(element).save();
        } else {
            throw new Error("Biblioteca PDF não carregada");
        }
    } catch (err) {
        console.error("Erro PDF:", err);
        alert("O download automático falhou no seu dispositivo. Abriremos a opção de impressão, onde você pode escolher 'Salvar como PDF'.");
        window.print();
    } finally {
        setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center overflow-hidden">
      
      {/* Header Fixo */}
      <div className="w-full bg-zinc-900 border-b border-zinc-800 p-4 flex justify-between items-center shrink-0 z-50 print:hidden">
         <h2 className="text-white font-bold flex items-center gap-2">
             <CheckCircle2 className="text-emerald-500" /> Certificado Disponível
         </h2>
         <button onClick={onClose} className="bg-zinc-800 hover:bg-zinc-700 text-white p-2 rounded-full transition-colors">
            <X size={20} />
         </button>
      </div>

      {/* Área de Visualização com Scroll se necessário */}
      <div className="flex-1 w-full overflow-auto flex items-center justify-center p-4 bg-zinc-950/50 print:p-0 print:bg-white print:block">
        
        {/* Container de Escala (CSS Transform) */}
        <div 
            ref={containerRef}
            style={{ 
                transform: `scale(${scale})`, 
                transformOrigin: 'center center',
                width: '1123px', 
                height: '794px'
            }}
            className="shadow-2xl print:shadow-none print:transform-none print:w-full print:h-full print:m-0"
        >
            {/* O CERTIFICADO REAL (Tamanho Fixo A4: 1123x794px) */}
            <div id="certificate-content" className="w-[1123px] h-[794px] bg-white text-black relative overflow-hidden print:w-full print:h-full">
                
                {/* 1. Borda Dupla Elegante */}
                <div className="absolute inset-4 border-2 border-zinc-300"></div>
                <div className="absolute inset-6 border-[4px] border-[#1a1a1a]"></div>
                
                {/* 2. Marca d'água de fundo */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                     <Logo size={500} showText={false} />
                </div>

                {/* 3. Conteúdo Central */}
                <div className="absolute inset-0 flex flex-col items-center justify-between py-16 px-20">
                    
                    {/* TOPO */}
                    <div className="text-center w-full">
                        <div className="flex justify-center mb-6 opacity-90">
                            {/* Logo Customizada Escura para o Papel */}
                            <div className="flex items-center gap-2">
                                <span className="text-4xl font-bold tracking-tighter text-zinc-900">PLATAFORMA</span>
                                <span className="text-4xl font-light text-zinc-600">DE ENSINO</span>
                            </div>
                        </div>
                        
                        <h1 className="text-5xl font-cinzel font-bold text-zinc-900 tracking-[0.2em] uppercase mb-2">
                            Certificado
                        </h1>
                        <p className="text-base font-cinzel text-[#C5A059] tracking-[0.4em] uppercase font-bold">
                            DE CONCLUSÃO
                        </p>
                    </div>

                    {/* CORPO */}
                    <div className="text-center w-full max-w-4xl space-y-6">
                        <p className="font-playfair text-xl text-zinc-600">
                            Certificamos que
                        </p>
                        
                        <h2 className="text-[5.5rem] leading-none font-signature text-[#1a1a1a] py-2 px-4 capitalize drop-shadow-sm">
                            {user.name}
                        </h2>

                        <p className="font-playfair text-xl text-zinc-700 leading-relaxed max-w-3xl mx-auto">
                            Concluiu com êxito o treinamento profissionalizante na Plataforma de Ensino Online,
                            cumprindo todos os requisitos acadêmicos necessários.
                        </p>

                        {/* Dados Técnicos */}
                        <div className="flex justify-center items-center gap-12 mt-4 pt-6 border-t border-zinc-200 w-2/3 mx-auto">
                            <div>
                                <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Carga Horária</span>
                                <span className="block text-xl font-cinzel font-bold text-zinc-800">{courseDuration}</span>
                            </div>
                             <div>
                                <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Conclusão</span>
                                <span className="block text-xl font-cinzel font-bold text-zinc-800">{completionDate}</span>
                            </div>
                        </div>
                    </div>

                    {/* RODAPÉ */}
                    <div className="w-full flex justify-between items-end mt-8">
                        
                        {/* Assinatura Esquerda */}
                        <div className="text-center">
                            <div className="w-64 border-b border-zinc-400 mb-2">
                                {/* Assinatura simulada */}
                                <span className="font-signature text-3xl text-zinc-800 block -rotate-2 pb-1">Coordenação</span>
                            </div>
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Coordenação Pedagógica</p>
                        </div>

                        {/* QR Code Central */}
                        <div className="flex flex-col items-center gap-1">
                             <div className="bg-white p-1 border border-zinc-200 shadow-sm">
                                <img 
                                    src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=Certificado-Valido-Plataforma-Ensino-Verificado" 
                                    alt="QR" 
                                    crossOrigin="anonymous"
                                    className="w-20 h-20"
                                />
                             </div>
                             <span className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold">Autenticidade</span>
                        </div>

                        {/* Assinatura Direita */}
                        <div className="text-center">
                            <div className="w-64 border-b border-zinc-400 mb-2">
                                <span className="font-signature text-3xl text-zinc-800 block -rotate-1 pb-1">Diretoria</span>
                            </div>
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Diretor Executivo</p>
                        </div>

                    </div>
                </div>

                {/* Faixa decorativa lateral (opcional, dá um toque moderno) */}
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#C5A059]"></div>
            </div>
        </div>

      </div>

      {/* Footer de Ações - Simplificado */}
      <div className="w-full bg-zinc-900 border-t border-zinc-800 p-6 shrink-0 print:hidden">
          <div className="max-w-2xl mx-auto flex gap-4 justify-center">
               <button 
                  onClick={() => window.print()} 
                  className="flex-1 py-4 px-6 bg-zinc-800 text-white rounded-xl font-bold hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
               >
                   <Printer size={20} /> IMPRIMIR
               </button>
               <button 
                  onClick={handleDownloadPDF} 
                  disabled={isDownloading}
                  className="flex-1 py-4 px-6 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/20 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
               >
                   {isDownloading ? <Loader2 className="animate-spin" /> : <Download size={20} />}
                   {isDownloading ? 'GERANDO...' : 'BAIXAR PDF'}
               </button>
          </div>
      </div>

      <style>{`
        @media print {
            @page { size: landscape; margin: 0; }
            body { background: white; }
            body * { visibility: hidden; }
            #certificate-content, #certificate-content * { 
                visibility: visible; 
            }
            #certificate-content {
                position: fixed;
                left: 0;
                top: 0;
                margin: 0;
                padding: 0;
                width: 100% !important;
                height: 100% !important;
                z-index: 9999;
                transform: none !important;
                box-shadow: none !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
      `}</style>

    </div>
  );
};

export default CertificateModal;
