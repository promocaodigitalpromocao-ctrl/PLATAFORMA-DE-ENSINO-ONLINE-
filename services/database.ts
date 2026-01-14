
import { Module, Lesson, User, Comment, QuestionBank, ExamResult, LiveEvent, CourseRating } from '../types';

const GOOGLE_SCRIPT_URL: string = 'https://script.google.com/macros/s/AKfycbz2xiDrIk9z37UMTZ7Q4xkHbv0yP-l-_u3jpyFHIb9YXXZGlMRmkXyIPiRBeRDt0AAuBw/exec';

const KEYS = {
  USERS: 'focusClass_users',
  MODULES: 'focusClass_modules_v23', // CLEAN RESET VERSION
  CURRENT_USER: 'focusClass_currentUser',
  VIDEO_PROGRESS_PREFIX: 'focusClass_progress_timestamp_', 
  COMMENTS: 'focusClass_comments',
  QUESTION_BANK: 'focusClass_question_bank', 
  EXAM_RESULTS_PREFIX: 'focusClass_exam_result_',
  ADMIN_LIST: 'focusClass_admin_emails_cache',
  LIVE_EVENT: 'focusClass_live_event',
  RATINGS: 'focusClass_course_ratings',
  SCHOOL_NAME: 'focusClass_school_name_v1',
  SIDEBAR_LINK: 'focusClass_sidebar_custom_link',
  SUPPORT_INFO: 'focusClass_support_contact_info'
};

const safeJSONParse = (key: string, fallback: any) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch (e) {
        console.warn(`Error parsing ${key}, resetting to fallback.`);
        return fallback;
    }
};

const seedData = () => {
  if (!localStorage.getItem(KEYS.MODULES)) {
    const emptyModules: Module[] = [];
    localStorage.setItem(KEYS.MODULES, JSON.stringify(emptyModules));
  }
  
  if (!localStorage.getItem(KEYS.USERS)) {
    const adminUser: User = {
      id: 'admin-1',
      name: 'Administrador',
      email: 'admin@escola.com',
      role: 'admin',
      password: 'admin',
      sector: 'TI',
      jobTitle: 'Gestor'
    };
    localStorage.setItem(KEYS.USERS, JSON.stringify([adminUser]));
  }

  // --- SEED CORRIGIDO ---
  // Apenas define o suporte padrão se NENHUMA configuração existir.
  // Se o admin salvou campos vazios, respeitamos isso e não sobrescrevemos.
  if (!localStorage.getItem(KEYS.SUPPORT_INFO)) {
      const defaultSupport = { email: 'suporte@admin.com', phone: '(00) 00000-0000' };
      localStorage.setItem(KEYS.SUPPORT_INFO, JSON.stringify(defaultSupport));
  }
};

const sendDataToGoogleSheet = async (payload: any) => {
  if (!GOOGLE_SCRIPT_URL) return false;
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', 
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    return true;
  } catch (error) {
    console.error("Erro ao enviar dados:", error);
    return false;
  }
};

// Helper para salvar configurações individuais na nuvem (Formato: [KEY, VALUE, TIMESTAMP])
const saveSingleConfig = (keyName: string, value: string) => {
    sendDataToGoogleSheet({
        type: 'save_data',
        sheetName: 'ConfigApp',
        payload: [keyName, value, new Date().toISOString()]
    });
};

export const db = {
  init: () => {
      seedData();
      db.cleanupOldData(); 
  },

  cleanupOldData: () => {
    try {
        const allComments: Comment[] = safeJSONParse(KEYS.COMMENTS, []);
        const now = Date.now();
        const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000; 
        
        const recentComments = allComments.filter(c => {
            const commentTime = new Date(c.createdAt).getTime();
            return (now - commentTime) < thirtyDaysInMs;
        });

        if (recentComments.length !== allComments.length) {
            console.log(`Limpeza automática: ${allComments.length - recentComments.length} comentários antigos removidos.`);
            localStorage.setItem(KEYS.COMMENTS, JSON.stringify(recentComments));
        }
    } catch (e) {
        console.error("Erro ao limpar dados antigos:", e);
    }
  },

  // --- FUNÇÕES DE PERSONALIZAÇÃO DA ESCOLA ---
  getSchoolName: (): string => {
      // Padrão genérico atualizado
      return localStorage.getItem(KEYS.SCHOOL_NAME) || 'Plataforma de Ensino Online';
  },

  setSchoolName: (name: string) => {
      if (!name.trim()) return;
      localStorage.setItem(KEYS.SCHOOL_NAME, name.trim());
      window.dispatchEvent(new Event('schoolNameChanged'));
      saveSingleConfig('schoolName', name.trim());
  },

  getSidebarLink: (): { label: string, url: string } => {
      return safeJSONParse(KEYS.SIDEBAR_LINK, { label: '', url: '' });
  },

  setSidebarLink: (label: string, url: string) => {
      const data = { label, url };
      const jsonStr = JSON.stringify(data);
      localStorage.setItem(KEYS.SIDEBAR_LINK, jsonStr);
      window.dispatchEvent(new Event('sidebarLinkChanged'));
      saveSingleConfig('sidebarLink', jsonStr);
  },

  getSupportInfo: (): { email: string, phone: string } => {
      return safeJSONParse(KEYS.SUPPORT_INFO, { email: '', phone: '' });
  },

  setSupportInfo: (email: string, phone: string) => {
      const data = { email, phone };
      const jsonStr = JSON.stringify(data);
      localStorage.setItem(KEYS.SUPPORT_INFO, jsonStr);
      // Dispara evento para atualizar componentes em tempo real
      window.dispatchEvent(new Event('supportInfoChanged'));
      saveSingleConfig('supportInfo', jsonStr);
  },
  // -------------------------------------------

  syncWithGoogleSheets: async () => {
    if (!GOOGLE_SCRIPT_URL) return false;
    try {
      console.log("Iniciando sincronização...");
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=read&t=${Date.now()}`, {
          method: 'GET',
          redirect: 'follow',
          credentials: 'omit', 
          cache: 'no-store'
      });
      if (!response.ok) {
          console.error("Erro na resposta da API:", response.status);
          return false;
      }

      const cloudData = await response.json();
      
      // 1. Configurações Globais (Suporte, Nome, Links)
      const configArr = Array.isArray(cloudData.config) ? cloudData.config : (Array.isArray(cloudData.ConfigApp) ? cloudData.ConfigApp : []);
      
      if (configArr.length > 0) {
          // Processa as configurações. Como a planilha é um log, pegamos sempre o último valor válido.
          // O formato esperado da planilha é: Coluna A = Key, Coluna B = Value
          
          let lastSchoolName = null;
          let lastSupportInfo = null;
          let lastSidebarLink = null;

          configArr.forEach((item: any) => {
              // Verifica se o item é um objeto {key, value} (padrão JSON API)
              // OU se é um array (caso a API retorne linhas puras)
              let key = item.key || (Array.isArray(item) ? item[0] : null);
              let value = item.value || (Array.isArray(item) ? item[1] : null);

              if (!key || !value) return;

              if (key === 'schoolName') lastSchoolName = value;
              if (key === 'supportInfo') lastSupportInfo = value;
              if (key === 'sidebarLink') lastSidebarLink = value;
          });

          if (lastSchoolName) {
              localStorage.setItem(KEYS.SCHOOL_NAME, lastSchoolName);
              window.dispatchEvent(new Event('schoolNameChanged'));
          }
          if (lastSupportInfo) {
              localStorage.setItem(KEYS.SUPPORT_INFO, lastSupportInfo);
              window.dispatchEvent(new Event('supportInfoChanged'));
          }
          if (lastSidebarLink) {
              localStorage.setItem(KEYS.SIDEBAR_LINK, lastSidebarLink);
              window.dispatchEvent(new Event('sidebarLinkChanged'));
          }
          
          window.dispatchEvent(new Event('storage'));
      }

      // 2. Admins
      const adminEmails = new Set<string>();
      const adminListArray: string[] = [];
      adminEmails.add('admin@escola.com');
      adminListArray.push('admin@escola.com');
      
      const extractAdminsFromList = (list: any[]) => {
          if (!Array.isArray(list)) return;
          list.forEach((row: any) => {
              let email = '';
              if (typeof row === 'string') {
                  email = row;
              } else if (typeof row === 'object' && row !== null) {
                  email = row.email || row.Email || row['E-mail'] || row.usuario || row.user || row.login || '';
                  if (!email) {
                      const values = Object.values(row);
                      const found = values.find(v => String(v).includes('@') && String(v).includes('.'));
                      if (found) email = String(found);
                  }
              }

              if (email && String(email).includes('@')) {
                  const normalizedEmail = String(email).toLowerCase().trim();
                  let isAdmin = false;
                  if (typeof row === 'object') {
                      const values = Object.values(row).map(v => String(v).toLowerCase());
                      if (values.some(v => v === 'admin' || v === 'administrador' || v === 'master' || v === 'sim' || v === 'true')) {
                          isAdmin = true;
                      }
                  } else {
                      isAdmin = true;
                  }

                  if (isAdmin) {
                      adminEmails.add(normalizedEmail);
                      if (!adminListArray.includes(normalizedEmail)) {
                          adminListArray.push(normalizedEmail);
                      }
                  }
              }
          });
      };

      if (cloudData.permissao) extractAdminsFromList(cloudData.permissao);
      if (cloudData.permissoes) extractAdminsFromList(cloudData.permissoes);

      localStorage.setItem(KEYS.ADMIN_LIST, JSON.stringify(adminListArray));

      // 3. Usuários
      if (Array.isArray(cloudData.users) && cloudData.users.length > 0) {
        const currentLocal = safeJSONParse(KEYS.USERS, []);
        const cloudEmails = new Set(cloudData.users.map((u: any) => u.email ? u.email.toLowerCase() : ''));
        
        const safeCloudUsers = cloudData.users.map((u: any) => {
            const email = String(u.email || '').toLowerCase().trim();
            let role = 'student';

            const rawRole = String(u.role || u.cargo || '').toLowerCase().trim();
            if (rawRole === 'admin' || rawRole === 'administrador') role = 'admin';
            
            if (adminEmails.has(email)) {
                role = 'admin';
            }

            return {
                ...u, 
                id: String(u.id || ''), 
                password: String(u.password || '').trim(),
                role: role 
            };
        });

        const mergedUsers = [...safeCloudUsers];
        currentLocal.forEach((localUser: User) => {
            if (localUser.email && !cloudEmails.has(localUser.email.toLowerCase())) {
                if (adminEmails.has(localUser.email.toLowerCase())) {
                    localUser.role = 'admin';
                }
                mergedUsers.push(localUser);
            }
        });
        localStorage.setItem(KEYS.USERS, JSON.stringify(mergedUsers));

        const currentUser = safeJSONParse(KEYS.CURRENT_USER, null);
        if (currentUser) {
            const updatedCurrentUser = mergedUsers.find(u => u.id === currentUser.id);
            if (updatedCurrentUser && updatedCurrentUser.role !== currentUser.role) {
                const { password, ...safeUpdated } = updatedCurrentUser;
                localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(safeUpdated));
            }
        }
      }

      // 4. Módulos e Conteúdo
      const cloudModules = Array.isArray(cloudData.modules) ? cloudData.modules : [];
      const localModules = safeJSONParse(KEYS.MODULES, []);
      if (cloudModules.length > 0) {
          localStorage.setItem(KEYS.MODULES, JSON.stringify(cloudModules));
      } else if (localModules.length > 0) {
          await db.saveModulesToCloud(localModules);
      }

      // 5. Outros (Quiz, Live, Ratings)
      if (cloudData.quizzes && cloudData.quizzes.questions) localStorage.setItem(KEYS.QUESTION_BANK, JSON.stringify(cloudData.quizzes));
      
      if (cloudData.liveEvent) {
          localStorage.setItem(KEYS.LIVE_EVENT, JSON.stringify(cloudData.liveEvent));
      }

      if (Array.isArray(cloudData.ratings)) {
          localStorage.setItem(KEYS.RATINGS, JSON.stringify(cloudData.ratings));
      }

      db.cleanupOldData();

      return true;
    } catch (e) {
      console.error("ERRO DE SINCRONIZAÇÃO:", e);
      return false;
    }
  },

  saveModulesToCloud: async (modules: Module[]) => {
      await sendDataToGoogleSheet({
          type: 'save_data',
          sheetName: 'ConteudoApp',
          payload: modules
      });
  },

  login: async (email: string, password: string): Promise<User | null> => {
    const normEmail = email.trim().toLowerCase();
    const normPass = String(password).trim(); 

    try {
        await db.syncWithGoogleSheets();
    } catch(e) {
        console.warn("Login sync failed, using cached data");
    }

    const users: User[] = safeJSONParse(KEYS.USERS, []);
    
    let user = users.find(u => (u.email || '').toLowerCase() === normEmail && String(u.password || '').trim() === normPass);
    
    if (!user && normEmail === 'admin@escola.com' && normPass === 'admin') {
         const fallbackAdmin: User = {
            id: `admin-fallback-${Date.now()}`,
            name: 'Administrador (Master)',
            email: 'admin@escola.com',
            role: 'admin',
            password: 'admin',
            sector: 'TI',
            jobTitle: 'Admin'
         };
         users.push(fallbackAdmin);
         localStorage.setItem(KEYS.USERS, JSON.stringify(users));
         user = fallbackAdmin;
    }

    if (user) {
        const { password, ...safeUser } = user;
        localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(safeUser));
        return safeUser;
    }
    return null;
  },

  logout: () => {
      localStorage.removeItem(KEYS.CURRENT_USER);
  },

  register: async (name: string, email: string, password: string, sector: string, jobTitle: string, adminToken?: string): Promise<User | null> => {
      const users: User[] = safeJSONParse(KEYS.USERS, []);
      if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
          return null;
      }

      let role: 'student' | 'admin' = 'student';
      if (adminToken === 'MAM2024') {
          role = 'admin';
      }

      const newUser: User = {
          id: `user-${Date.now()}`,
          name,
          email,
          password,
          role,
          sector,
          jobTitle
      };

      users.push(newUser);
      localStorage.setItem(KEYS.USERS, JSON.stringify(users));
      
      const { password: _, ...safeUser } = newUser;
      localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(safeUser));
      
      sendDataToGoogleSheet({
          type: 'register_user',
          sheetName: 'UsuariosApp',
          payload: newUser
      });

      return safeUser;
  },

  getCurrentUser: (): User | null => {
      return safeJSONParse(KEYS.CURRENT_USER, null);
  },

  updateUser: (updatedUser: User) => {
      localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(updatedUser));
      const users: User[] = safeJSONParse(KEYS.USERS, []);
      const index = users.findIndex(u => u.id === updatedUser.id);
      if (index !== -1) {
          users[index] = { ...users[index], ...updatedUser };
          localStorage.setItem(KEYS.USERS, JSON.stringify(users));
          
          sendDataToGoogleSheet({
              type: 'update_user',
              sheetName: 'UsuariosApp',
              payload: users[index]
          });
      }
  },

  getModules: (): Module[] => {
      return safeJSONParse(KEYS.MODULES, []);
  },

  addModule: (title: string): Module[] => {
      const modules: Module[] = safeJSONParse(KEYS.MODULES, []);
      const newModule: Module = {
          id: `mod-${Date.now()}`,
          title,
          lessons: [],
          isVisible: true
      };
      modules.push(newModule);
      localStorage.setItem(KEYS.MODULES, JSON.stringify(modules));
      db.saveModulesToCloud(modules);
      return modules;
  },

  updateModuleTitle: (moduleId: string, newTitle: string, isVisible: boolean): Module[] => {
      const modules: Module[] = safeJSONParse(KEYS.MODULES, []);
      const modIndex = modules.findIndex(m => m.id === moduleId);
      if (modIndex !== -1) {
          modules[modIndex].title = newTitle;
          modules[modIndex].isVisible = isVisible;
          localStorage.setItem(KEYS.MODULES, JSON.stringify(modules));
          db.saveModulesToCloud(modules);
      }
      return modules;
  },

  addLesson: (moduleId: string, lessonData: Omit<Lesson, 'id'>): Module[] => {
      const modules: Module[] = safeJSONParse(KEYS.MODULES, []);
      const modIndex = modules.findIndex(m => m.id === moduleId);
      if (modIndex !== -1) {
          const newLesson: Lesson = {
              id: `lesson-${Date.now()}`,
              ...lessonData
          };
          modules[modIndex].lessons.push(newLesson);
          localStorage.setItem(KEYS.MODULES, JSON.stringify(modules));
          db.saveModulesToCloud(modules);
      }
      return modules;
  },

  updateLesson: (moduleId: string, lessonId: string, lessonData: Partial<Lesson>): Module[] => {
      const modules: Module[] = safeJSONParse(KEYS.MODULES, []);
      const modIndex = modules.findIndex(m => m.id === moduleId);
      if (modIndex !== -1) {
          const lessonIndex = modules[modIndex].lessons.findIndex(l => l.id === lessonId);
          if (lessonIndex !== -1) {
              modules[modIndex].lessons[lessonIndex] = {
                  ...modules[modIndex].lessons[lessonIndex],
                  ...lessonData
              };
              localStorage.setItem(KEYS.MODULES, JSON.stringify(modules));
              db.saveModulesToCloud(modules);
          }
      }
      return modules;
  },
  
  updateLessonDescription: (lessonId: string, description: string): Module[] => {
      const modules: Module[] = safeJSONParse(KEYS.MODULES, []);
      for(const mod of modules) {
          const lesson = mod.lessons.find(l => l.id === lessonId);
          if (lesson) {
              lesson.description = description;
              localStorage.setItem(KEYS.MODULES, JSON.stringify(modules));
              db.saveModulesToCloud(modules);
              break;
          }
      }
      return modules;
  },

  getVideoProgress: (userId: string, lessonId: string): number => {
      return safeJSONParse(`${KEYS.VIDEO_PROGRESS_PREFIX}${userId}_${lessonId}`, 0);
  },

  saveVideoProgress: (userId: string, lessonId: string, time: number) => {
      localStorage.setItem(`${KEYS.VIDEO_PROGRESS_PREFIX}${userId}_${lessonId}`, JSON.stringify(time));
  },

  getComments: (lessonId: string): Comment[] => {
      const comments: Comment[] = safeJSONParse(KEYS.COMMENTS, []);
      return comments.filter(c => c.lessonId === lessonId);
  },

  getAllComments: (): Comment[] => {
      return safeJSONParse(KEYS.COMMENTS, []);
  },

  addComment: (lessonId: string, userId: string, userName: string, text: string) => {
      // Salva localmente
      const comments: Comment[] = safeJSONParse(KEYS.COMMENTS, []);
      const newComment: Comment = {
          id: `cmt-${Date.now()}`,
          lessonId,
          userId,
          userName,
          text,
          createdAt: new Date().toISOString(),
          isRead: false
      };
      comments.push(newComment);
      localStorage.setItem(KEYS.COMMENTS, JSON.stringify(comments));
      
      // ALTERAÇÃO: Enviando ARRAY para que a planilha entenda como colunas e não JSON
      sendDataToGoogleSheet({
          type: 'save_data', 
          sheetName: 'ComentariosApp',
          payload: [ new Date().toLocaleString(), userName, lessonId, text ]
      });
  },

  markCommentsAsRead: (commentIds: string[]) => {
      const comments: Comment[] = safeJSONParse(KEYS.COMMENTS, []);
      let changed = false;
      const idsSet = new Set(commentIds);

      comments.forEach(c => {
          if (idsSet.has(c.id)) {
              c.isRead = true;
              changed = true;
          }
      });

      if (changed) {
          localStorage.setItem(KEYS.COMMENTS, JSON.stringify(comments));
      }
  },

  getQuestionBank: (): QuestionBank | null => {
      return safeJSONParse(KEYS.QUESTION_BANK, null);
  },

  saveQuestionBank: (bank: QuestionBank) => {
      localStorage.setItem(KEYS.QUESTION_BANK, JSON.stringify(bank));
      sendDataToGoogleSheet({
          type: 'save_data',
          sheetName: 'BancoQuestoesApp',
          payload: bank
      });
  },

  getExamResult: (userId: string): { score: number, total: number, passed: boolean } | null => {
      return safeJSONParse(`${KEYS.EXAM_RESULTS_PREFIX}${userId}`, null);
  },

  saveExamResult: (userName: string, userEmail: string, score: number, total: number, passed: boolean) => {
      const users: User[] = safeJSONParse(KEYS.USERS, []);
      const user = users.find(u => u.email === userEmail);
      const userId = user ? user.id : userEmail;

      const result = { score, total, passed, date: new Date().toISOString() };
      localStorage.setItem(`${KEYS.EXAM_RESULTS_PREFIX}${userId}`, JSON.stringify(result));
      
      sendDataToGoogleSheet({
          type: 'save_exam_result',
          sheetName: 'ResultadosProva',
          payload: [ userName, userEmail, score, total, passed ? "APROVADO" : "REPROVADO", new Date().toLocaleString() ]
      });
  },

  getLiveEvent: (): LiveEvent | null => {
      return safeJSONParse(KEYS.LIVE_EVENT, null);
  },

  saveLiveEvent: (event: LiveEvent | null) => {
      localStorage.setItem(KEYS.LIVE_EVENT, JSON.stringify(event));
      sendDataToGoogleSheet({
          type: 'save_data',
          sheetName: 'LiveEventApp',
          payload: event
      });
  },

  getRatings: (): CourseRating[] => {
      return safeJSONParse(KEYS.RATINGS, []);
  },

  addRating: (userId: string, userName: string, rating: number, comment: string) => {
      const ratings: CourseRating[] = safeJSONParse(KEYS.RATINGS, []);
      const filtered = ratings.filter(r => r.userId !== userId);
      
      const newRating: CourseRating = {
          id: `rate-${Date.now()}`,
          userId,
          userName,
          rating,
          comment,
          createdAt: new Date().toISOString()
      };
      
      filtered.push(newRating);
      localStorage.setItem(KEYS.RATINGS, JSON.stringify(filtered));

      sendDataToGoogleSheet({
          type: 'save_data',
          sheetName: 'AvaliacoesApp',
          payload: [ new Date().toLocaleString(), userName, rating, comment ]
      });
  }
};
