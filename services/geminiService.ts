import { Question } from '../types';

const getApiKey = () => {
  try {
    // Safety check: process might not be defined in browser environments
    if (typeof process !== 'undefined' && process.env) {
      return process.env.API_KEY;
    }
  } catch (e) {
    console.warn("Environment variable access failed");
  }
  return null;
};

export const generateQuestionsFromContent = async (contentContext: string): Promise<Question[] | null> => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    console.warn("API Key not found or process.env not supported");
    return null;
  }

  try {
    // Dynamic import to prevent crash on initial load if library fails
    // This fixes the "White Screen" issue if @google/genai is not reachable immediately
    // @ts-ignore
    const { GoogleGenAI, Type } = await import("@google/genai");
    
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: {
            type: Type.STRING,
            description: 'O enunciado da pergunta.',
          },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Uma lista de exatamente 4 opções de resposta.',
          },
          correctAnswer: {
             type: Type.INTEGER,
             description: 'O índice da resposta correta (0, 1, 2 ou 3).'
          }
        },
        required: ["text", "options", "correctAnswer"],
      },
    };

    const prompt = `
      Você é um especialista em educação. Com base no seguinte conteúdo de aulas (Títulos e Descrições), 
      gere um Banco de Questões completo com EXATAMENTE 60 perguntas de múltipla escolha.
      
      As perguntas devem ser variadas, cobrindo todos os tópicos mencionados.
      Cada pergunta deve ter 4 opções e indicar a correta.
      
      Conteúdo das Aulas:
      ${contentContext}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        maxOutputTokens: 8192 
      }
    });

    const jsonText = response.text;
    if (!jsonText) return null;

    const parsedQuestions = JSON.parse(jsonText);
    
    return parsedQuestions.map((q: any) => ({
        id: `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: q.text,
        options: q.options,
        correctAnswer: q.correctAnswer
    }));

  } catch (error) {
    console.error("Erro ao gerar perguntas com IA:", error);
    return null;
  }
};