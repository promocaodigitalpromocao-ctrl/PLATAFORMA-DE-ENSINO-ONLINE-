
import React, { useState } from 'react';
import { db } from '../services/database';
import { User } from '../types';
import { UserPlus, LogIn, Eye, EyeOff, Loader2, Briefcase, Building2, WifiOff, AlertCircle, RefreshCw, KeyRound, Check, X } from 'lucide-react';
import { Logo } from './Logo';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [sector, setSector] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  
  // Estado para controlar a visibilidade do campo admin
  const [showAdminField, setShowAdminField] = useState(false);
  const [adminToken, setAdminToken] = useState(''); 

  const [error, setError] = useState('');
  const [debugError, setDebugError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  // Validações em tempo real
  const hasUpperCase = /[A-Z]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const hasMinLength = password.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setDebugError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        if (!email || !password) {
          setError('Por favor, preencha email e senha.');
          setIsLoading(false);
          return;
        }

        try {
            const user = await db.login(email, password);
            if (user) {
                onLogin(user);
            } else {
                setError('Email ou senha inválidos. Tente admin@escola.com / admin se perdeu o acesso.');
            }
        } catch (loginErr: any) {
            console.error(loginErr);
            setError('Erro de conexão com a planilha.');
            setDebugError(loginErr.toString());
        }

      } else {
        // --- LÓGICA DE REGISTRO COM VALIDAÇÃO DE SENHA ---
        
        if (!name || !email || !password || !sector || !jobTitle) {
          setError('Todos os campos são obrigatórios.');
          setIsLoading(false);
          return;
        }

        // Validação de Senha Forte
        if (!hasMinLength) {
            setError('A senha deve ter no mínimo 6 caracteres.');
            setIsLoading(false);
            return;
        }
        if (!hasUpperCase) {
            setError('A senha deve conter pelo menos uma letra MAIÚSCULA.');
            setIsLoading(false);
            return;
        }
        if (!hasSpecialChar) {
            setError('A senha deve conter pelo menos um caractere ESPECIAL (ex: @, !, #).');
            setIsLoading(false);
            return;
        }

        try {
            // Se o campo admin não estiver visível, envia token vazio
            const tokenToSend = showAdminField ? adminToken : '';
            const user = await db.register(name, email, password, sector, jobTitle, tokenToSend);
            if (user) {
              onLogin(user);
            } else {
              setError('Este email já está cadastrado.');
            }
        } catch (regErr: any) {
             setError('Erro ao cadastrar. Verifique a conexão.');
             setDebugError(regErr.toString());
        }
      }
    } catch (err) {
      setError('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    setError('');
    try {
        const success = await db.syncWithGoogleSheets();
        if (success) {
            alert("Dados atualizados com sucesso! Tente fazer login agora.");
        } else {
            setError("Não foi possível conectar à planilha. Verifique sua internet.");
        }
    } catch (e) {
        setError("Erro ao atualizar.");
    } finally {
        setIsManualSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4 transition-colors duration-500">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl shadow-indigo-500/5 dark:shadow-black/30 w-full max-w-md overflow-hidden flex flex-col md:flex-row border border-zinc-200 dark:border-zinc-800">
        
        <div className="w-full p-8">
          <div className="mb-8 flex justify-center md:justify-start">
             {/* EDITABLE SET TO TRUE */}
             <Logo size={48} editable={true} />
          </div>

          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
            {isLogin ? 'Seja bem-vindo' : 'Crie sua conta'}
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8">
            {isLogin ? 'Acesse suas aulas e continue aprendendo.' : 'Preencha todos os dados para iniciar.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nome Completo <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-zinc-400 dark:placeholder-zinc-500"
                    placeholder="Seu nome"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                      <Building2 size={14} /> Setor <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={sector}
                      onChange={(e) => setSector(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-zinc-400 dark:placeholder-zinc-500"
                      placeholder="Ex: Vendas"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                       <Briefcase size={14} /> Função <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-zinc-400 dark:placeholder-zinc-500"
                      placeholder="Ex: Analista"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </>
            )}
            
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email <span className="text-red-500">*</span></label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-zinc-400 dark:placeholder-zinc-500"
                placeholder="seu@email.com"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Senha <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all pr-12 placeholder-zinc-400 dark:placeholder-zinc-500"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                  tabIndex={-1}
                  disabled={isLoading}
                >
                  {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
              
              {/* Requisitos de Senha - Apenas no Cadastro */}
              {!isLogin && (
                  <div className="mt-2 text-xs space-y-1 bg-zinc-100 dark:bg-zinc-950 p-2 rounded border border-zinc-200 dark:border-zinc-800">
                      <p className="text-zinc-500 font-semibold mb-1">A senha deve conter:</p>
                      <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-500' : 'text-zinc-500'}`}>
                          {hasMinLength ? <Check size={12} /> : <div className="w-3 h-3 rounded-full border border-zinc-400 dark:border-zinc-600" />}
                          Mínimo 6 caracteres
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasUpperCase ? 'text-emerald-500' : 'text-zinc-500'}`}>
                          {hasUpperCase ? <Check size={12} /> : <div className="w-3 h-3 rounded-full border border-zinc-400 dark:border-zinc-600" />}
                          Pelo menos 1 letra Maiúscula
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasSpecialChar ? 'text-emerald-500' : 'text-zinc-500'}`}>
                          {hasSpecialChar ? <Check size={12} /> : <div className="w-3 h-3 rounded-full border border-zinc-400 dark:border-zinc-600" />}
                          Pelo menos 1 caractere especial (!@#$)
                      </div>
                  </div>
              )}
            </div>

            {/* ÁREA DE ADMINISTRAÇÃO (Oculta por padrão) */}
            {!isLogin && (
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 mt-2">
                    {!showAdminField ? (
                        <button
                            type="button"
                            onClick={() => setShowAdminField(true)}
                            className="text-xs text-zinc-500 hover:text-indigo-500 flex items-center gap-1 transition-colors w-full justify-center mt-2 opacity-60 hover:opacity-100"
                        >
                            <KeyRound size={12} /> Possui código de administrador?
                        </button>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-xs font-medium text-zinc-500 flex items-center gap-1">
                                    <KeyRound size={12} /> Código de Administrador
                                </label>
                                <button
                                    type="button"
                                    onClick={() => { setShowAdminField(false); setAdminToken(''); }}
                                    className="text-[10px] text-zinc-600 hover:text-red-500"
                                >
                                    Cancelar
                                </button>
                            </div>
                            <input
                                type="password"
                                value={adminToken}
                                onChange={(e) => setAdminToken(e.target.value)}
                                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all text-sm placeholder-zinc-400 dark:placeholder-zinc-700"
                                placeholder="Digite o código secreto..."
                                disabled={isLoading}
                            />
                        </div>
                    )}
                </div>
            )}

            {error && (
              <div className="flex flex-col gap-2">
                <div className="text-red-600 dark:text-red-400 text-sm bg-red-100 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-900/50 flex items-start gap-2">
                   {error.includes('conexão') ? <WifiOff size={16} className="mt-0.5" /> : <div className="mt-0.5 min-w-[4px] h-4 bg-red-500 rounded-full"></div>}
                   {error}
                </div>
                {debugError && (
                    <div className="text-[10px] text-zinc-500 bg-zinc-100 dark:bg-black p-2 rounded border border-zinc-200 dark:border-zinc-800 font-mono break-all">
                        <strong>Detalhes Técnicos (Para Suporte):</strong><br/>
                        {debugError}
                    </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" /> Verificando...
                </>
              ) : isLogin ? (
                <>
                  <LogIn size={20} /> Entrar
                </>
              ) : (
                <>
                  <UserPlus size={20} /> Cadastrar
                </>
              )}
            </button>
          </form>

          {isLogin && (
             <div className="mt-4 flex justify-center">
                 <button 
                    type="button"
                    onClick={handleManualSync}
                    disabled={isManualSyncing || isLoading}
                    className="text-xs text-zinc-500 hover:text-indigo-500 flex items-center gap-1 transition-colors disabled:opacity-50"
                 >
                     <RefreshCw size={12} className={isManualSyncing ? 'animate-spin' : ''} />
                     {isManualSyncing ? 'Atualizando...' : 'Atualizar Dados da Planilha'}
                 </button>
             </div>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); setDebugError(''); setShowAdminField(false); setAdminToken(''); }}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 text-sm font-medium"
              disabled={isLoading}
            >
              {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
