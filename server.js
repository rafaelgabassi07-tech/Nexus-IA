import 'dotenv/config';
import express from 'express';
import { GoogleGenAI } from '@google/generative-ai';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Global Error Handlers for Unhandled Rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

const app = express();
app.set('trust proxy', 1);

app.use(express.json({ limit: '10mb' }));

const corsOptions = {
  origin: process.env.ALLOWED_ORIGIN || '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
app.use(cors(corsOptions));

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 30, 
  message: { error: "Muitas requisições. Aguarde um momento." },
  standardHeaders: true,
  legacyHeaders: false,
});

const VALID_MODELS = [
  'gemini-2.5-flash',
  'gemini-3-flash-preview',
  'gemini-2.5-flash-lite',
  'gemini-3.1-flash-lite-preview',
];

const ChatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string().max(1000000),
    images: z.array(z.object({
      mimeType: z.string(),
      data: z.string()
    })).optional()
  })).max(100),
  apiKey: z.string().optional(),
  model: z.string().max(100),
  systemPrompt: z.string().max(50000).optional(),
  temperature: z.number().min(0).max(2),
  searchGrounding: z.boolean().optional()
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.get('/api/models', (req, res) => {
  res.json({ models: VALID_MODELS });
});

app.post('/api/chat', limiter, async (req, res) => {
  const result = ChatRequestSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Payload inválido', details: result.error.format() });
  }

  const { messages, apiKey, model, systemPrompt, temperature, searchGrounding } = result.data;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 180000);

  try {
    let targetModel = model;

    const recentMessages = messages.slice(-30);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const apiKeyToUse = apiKey || process.env.GEMINI_API_KEY;
    if (!apiKeyToUse) {
      console.error("CRITICAL: GEMINI_API_KEY is not defined in the environment.");
      return res.status(500).json({ error: "Nexus Core Offline: Chave de API não configurada no servidor." });
    }
    
    let ai;
    try {
      ai = new GoogleGenAI({ apiKey: apiKeyToUse });
    } catch (e) {
      return res.status(500).json({ error: "Falha ao inicializar Nexus Intelligence Core." });
    }

    const contents = recentMessages.map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.content ? msg.content.trim() || ' ' : ' ' }]
    }));

    if (contents.length === 0) {
      contents.push({ role: 'user', parts: [{ text: ' ' }] });
    }

    // Add images to the last user message if present
    if (contents.length > 0 && contents[contents.length-1].role === 'user' && messages[messages.length-1].images) {
      const lastMsgImages = messages[messages.length-1].images || [];
      contents[contents.length-1].parts = [
        ...lastMsgImages.map(img => ({
          inlineData: { mimeType: img.mimeType, data: img.data }
        })),
        { text: messages[messages.length-1].content }
      ];
    }

    const tools = searchGrounding ? [{ googleSearch: {} }] : [];
    let modelConfig: any = {
      temperature: temperature,
      systemInstruction: systemPrompt || undefined,
      tools: tools,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192
    };

    if (targetModel.includes('gemini-3-flash')) {
      modelConfig.temperature = 0.2; // Optimized for high-precision coding
      modelConfig.topP = 0.8;
      modelConfig.topK = 20;
      modelConfig.maxOutputTokens = 8192;
    } else if (targetModel.includes('gemini-2.5-flash') && !targetModel.includes('lite')) {
      modelConfig.temperature = 0.4;
      modelConfig.topP = 0.9;
      modelConfig.topK = 32;
      modelConfig.maxOutputTokens = 8192;
    } else if (targetModel.includes('lite')) {
      modelConfig.temperature = 0.1; // Lite models need very low temperature for logic
      modelConfig.topP = 0.7;
      modelConfig.topK = 16;
      modelConfig.maxOutputTokens = 4096;
    }
    
    // Map Nexus models to real Gemini models
    let actualModel = targetModel;
    if (targetModel.includes('lite') || targetModel.includes('flash')) {
      actualModel = 'gemini-1.5-flash';
    } else {
      actualModel = 'gemini-1.5-pro';
    }

    const genModel = ai.getGenerativeModel({ 
      model: actualModel,
      systemInstruction: systemPrompt || undefined,
    });

    const streamingResult = await genModel.generateContentStream({
      contents: contents,
      generationConfig: {
        temperature: modelConfig.temperature,
        topP: modelConfig.topP,
        topK: modelConfig.topK,
        maxOutputTokens: modelConfig.maxOutputTokens,
      },
      tools: tools
    });

    for await (const chunk of streamingResult.stream) {
      try {
        const text = chunk.text();
        if (text) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      } catch (e) {
        console.warn('Empty or blocked chunk detected:', e);
      }
    }
    
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    if (error.name === 'AbortError') {
      if (!res.headersSent) res.status(504).json({ error: "Request timed out" });
      return;
    }

    console.error('Error generating content:', error);
    let errorMessage = (error instanceof Error ? error.message : String(error)) || "Failed to generate content";
    
    // Try to parse JSON from error message to extract deep details
    try {
      const match = errorMessage.match(/\{[\s\S]*\}/);
      if (match) {
        let parsed = JSON.parse(match[0]);
        if (parsed.error && parsed.error.message) {
          // It might be a double JSON string inside message
          try {
            const innerParsed = JSON.parse(parsed.error.message);
            if (innerParsed.error && innerParsed.error.message) {
               errorMessage = innerParsed.error.message;
            } else {
               errorMessage = parsed.error.message;
            }
          } catch(e) {
             errorMessage = parsed.error.message;
          }
        }
      }
    } catch(e) {
      // Ignored
    }
    
    if (errorMessage.includes("API key not valid") || errorMessage.includes("API_KEY_INVALID") || errorMessage.includes("Incorrect API key")) {
      errorMessage = "Chave da API inválida.";
    } else if (errorMessage.toLowerCase().includes("quota") || errorMessage.toLowerCase().includes("rate limit") || errorMessage.includes("429")) {
      errorMessage = "Cota ou Rate Limit excedida para este modelo.";
    } else if (errorMessage.includes("503") || errorMessage.toLowerCase().includes("high demand") || errorMessage.toLowerCase().includes("overloaded")) {
      errorMessage = "O modelo está sobrecarregado no momento. Tentando novamente mais tarde.";
    }

    if (!res.headersSent) {
      res.status(500).json({ error: errorMessage });
    } else {
      res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
      res.end();
    }
  } finally {
    clearTimeout(timeoutId);
  }
});

const startServer = async () => {
  try {
    if (process.env.NODE_ENV === 'production') {
      app.use(express.static(path.resolve(__dirname, 'dist')));
      app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
      });
    } else {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa'
      });
      app.use(vite.middlewares);
    }

    const port = process.env.PORT || 3000;
    app.listen(port, '0.0.0.0', () => {
      console.log(`Server listening on port ${port}`);
    });
  } catch (err) {
    console.error('Critical server failure during startup:', err);
    process.exit(1);
  }
};

startServer().catch(err => {
  console.error('Unexpected crash:', err);
});

export default app;
