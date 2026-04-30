import 'dotenv/config';
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Global Error Handlers
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
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite-preview',
  'gemini-3.1-pro-preview',
];

// Nexus AI Model Mapping - Standardized to @google/genai
const getActualModel = (model) => {
  if (model.includes('3.1-flash-lite')) return 'gemini-3.1-flash-lite-preview';
  if (model.includes('3-flash')) return 'gemini-3-flash-preview';
  if (model.includes('pro')) return 'gemini-3.1-pro-preview';
  return 'gemini-3-flash-preview'; // Default
};

const ChatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string().max(2000000),
    images: z.array(z.object({
      mimeType: z.string(),
      data: z.string()
    })).optional()
  })).max(200),
  apiKey: z.string().optional(),
  model: z.string().max(100),
  systemPrompt: z.string().max(100000).optional(),
  temperature: z.number().min(0).max(2).optional(),
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
  
  try {
    const actualModel = getActualModel(model);
    console.log(`[Nexus API] Prompt Received - Model: ${actualModel}`);
    
    // Ensure history doesn't exceed context window
    const recentMessages = messages.slice(-50);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const apiKeyToUse = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKeyToUse) {
      return res.status(500).json({ error: "Nexus Core Offline: Chave de API não configurada." });
    }
    
    const ai = new GoogleGenAI({ apiKey: apiKeyToUse });

    // Format contents for @google/genai
    const contents = recentMessages.map((msg, idx) => {
      const parts = [];
      
      // If it's the last user message and has images, add them
      if (idx === recentMessages.length - 1 && msg.role === 'user' && msg.images?.length) {
        msg.images.forEach(img => {
          parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
        });
      }
      
      parts.push({ text: msg.content.trim() || ' ' });
      
      return {
        role: msg.role === 'model' ? 'model' : 'user',
        parts
      };
    });

    const responseStream = await ai.models.generateContentStream({
      model: actualModel,
      contents,
      config: {
        systemInstruction: systemPrompt || undefined,
        temperature: temperature ?? 0.7,
        topP: 0.95,
        topK: 40,
        tools: searchGrounding ? [{ googleSearch: {} }] : []
      }
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }
    
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error('[Nexus API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido no processamento da IA";
    
    if (!res.headersSent) {
      res.status(500).json({ error: errorMessage });
    } else {
      res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
      res.end();
    }
  }
});

// Global Express Error Handler
app.use((err, req, res, next) => {
  console.error('[Nexus Critical] Unhandled Route Error:', err);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Erro interno no Nexus Core' });
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

startServer();
