import 'dotenv/config';
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '50mb' }));

// Configuração do CORS
const corsOptions = {
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
  methods: ['POST'],
  allowedHeaders: ['Content-Type'],
};
app.use(cors(corsOptions));

// Configuração do Rate Limit
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 20, // limite de 20 requisições
  message: { error: "Muitas requisições. Aguarde um momento." },
  standardHeaders: true,
  legacyHeaders: false,
});

// API Route for interacting with the Gemini-powered Agents
app.post('/api/chat', limiter, async (req, res) => {
  // Adiciona timeout de 60 segundos
  req.setTimeout(60000);
  res.setTimeout(60000);

  const { messages, apiKey, model, systemPrompt, temperature } = req.body || {};

  // Validar temperature
  const temp = parseFloat(temperature);
  if (isNaN(temp) || temp < 0 || temp > 2) {
    return res.status(400).json({ error: 'Temperature inválida. Deve ser entre 0 e 2.' });
  }

  // Whitelist de modelos permitidos - Por favor, NÃO remova modelos válidos para evitar quebras
  const ALLOWED_MODELS = [
    'gemini-3.1-pro-preview',
    'gemini-3.1-flash-lite-preview',
    'gemini-3-flash-preview',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-flash-latest'
  ];
  if (model && !ALLOWED_MODELS.includes(model)) {
    return res.status(400).json({ error: `Modelo '${model}' não permitido.` });
  }

  // Validar messages
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Campo messages inválido.' });
  }

  const targetModel = model || 'gemini-3-flash-preview';

  let clientClosed = false;
  req.on('close', () => {
    clientClosed = true;
  });

  try {
    // Use Google Gen AI (Gemini) API
    const apiKeyToUse = apiKey || process.env.GEMINI_API_KEY;
    if (!apiKeyToUse) {
      throw new Error("GEMINI_API_KEY not configured");
    }
    const ai = new GoogleGenAI({ apiKey: apiKeyToUse });
    
    // Truncar histórico para as últimas 20 mensagens
    const recentMessages = (messages || []).slice(-20);

    const contents = recentMessages.map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [
        ...(msg.images || []).map(img => ({
          inlineData: {
            mimeType: img.mimeType,
            data: img.data
          }
        })),
        { text: msg.content }
      ]
    }));

    let success = false;
    let lastError;
    
    // Lista de modelos para tentar (começa pelo requisitado e usa opções mais seguras de fallback)
    const baseFallback = ['gemini-3-flash-preview', 'gemini-2.0-flash', 'gemini-flash-latest'];
    const modelsToTry = [...new Set([targetModel, ...baseFallback])];

    for (let mIndex = 0; mIndex < modelsToTry.length; mIndex++) {
      if (success || clientClosed) break;
      const currentModel = modelsToTry[mIndex];
      
      let retries = mIndex === 0 ? 2 : 1; // Tenta o modelo principal 2 vezes (total 3), fallbacks 1 vez
      let delay = 2000;

      while (retries >= 0) {
        try {
          const responseStream = await ai.models.generateContentStream({
            model: currentModel,
            contents: contents,
            config: {
              systemInstruction: systemPrompt,
              temperature: temperature !== undefined ? parseFloat(temperature) : 0.7,
            }
          });

          // Setup Server-Sent Events after stream is successfully initialized
          if (!res.headersSent) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
          }

          for await (const chunk of responseStream) {
             if (clientClosed) break;
             res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
          }
          
          if (!clientClosed) {
            res.write('data: [DONE]\n\n');
            res.end();
          }
          
          success = true;
          break; // Sucesso, sai do loop do while
        } catch (err) {
          lastError = err;
          const msg = String(err.message || "").toLowerCase();
          // Check if the error is a temporary infrastructure constraint
          const isTemporary = msg.includes("503") || 
                              msg.includes("unavailable") || 
                              msg.includes("high demand") || 
                              msg.includes("tempararily_unavailable") || 
                              msg.includes("overloaded") ||
                              msg.includes("429");
                              
          if (res.headersSent) {
            throw err; // Se já enviou headers, não dá para fazer fallback silencioso
          }
          
          if (!isTemporary) {
            break; // Se não for um erro temporário (ex: erro de auth), avança para lançar o erro
          }
          
          if (retries === 0) {
            console.warn(`[Warning] Model ${currentModel} falhou com erro temporário. Tentando próximo modelo se houver.`);
            break; // Fim das retentativas desse modelo
          }
          
          console.warn(`[Warning] Model ${currentModel} overloaded or hit rate limit. Retrying in ${delay}ms... (${retries} retries left)`);
          await new Promise(r => setTimeout(r, delay));
          delay *= 1.5;
          retries--;
        }
      }
    }
    
    if (!success && lastError) {
      throw lastError;
    }

  } catch (error) {
    if (clientClosed) return;
    console.error('Error generating content:', error);
    let errorMessage = error.message || "Failed to generate content";
    try {
      if (errorMessage.includes('{')) {
        const jsonStr = errorMessage.substring(errorMessage.indexOf('{'));
        const parsed = JSON.parse(jsonStr);
        if (parsed.error && parsed.error.message) {
          errorMessage = parsed.error.message;
        }
      }
    } catch(e) {}
    
    // Custom logic to handle quota and invalid API key errors for UX
    if (errorMessage.includes("API key not valid") || errorMessage.includes("API_KEY_INVALID") || errorMessage.includes("GEMINI_API_KEY not configured")) {
      errorMessage = "Chave da API não configurada ou inválida. Por favor, certifique-se de que a variável GEMINI_API_KEY foi definida nas configurações do ambiente.";
    } else if (errorMessage.includes("limit: 0")) {
      errorMessage = `A Chave de API utilizada não tem permissão para usar o modelo '${targetModel}' (limite 0). Tente usar o modelo Gemini 3 Flash.`;
    } else if (errorMessage.toLowerCase().includes("quota") || errorMessage.toLowerCase().includes("exceeded")) {
      errorMessage = "Limite de cota ou tokens excedido. O prompt é muito grande e consome muitos tokens de contexto, ultrapassando o limite da cota gratuita da sua Chave de API imediatamente. Para resolver: adicione um cartão de crédito no Google AI Studio (faturamento ativado) para remover a restrição de tokens por minuto.";
    } else if (errorMessage.includes("UNAVAILABLE") || errorMessage.includes("503") || errorMessage.includes("high demand")) {
      errorMessage = "O modelo está com alta demanda no momento (Erro 503). Isso geralmente é temporário. Por favor, aguarde alguns instantes e tente enviar sua mensagem novamente.";
    }

    if (!res.headersSent) {
      res.status(500).json({ error: errorMessage });
    } else {
      res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
      res.end();
    }
  }
});

// Serve frontend based on environment
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
} else {
  // In development, we load Vite as a middleware. This enables us to serve
  // both the Express API and the Vite frontend on the same port (3000).
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });
  app.use(vite.middlewares);
}

// Our platform exposes port 3000 to the internet
const port = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Development Server listening on port ${port}`);
  });
}

export default app;
