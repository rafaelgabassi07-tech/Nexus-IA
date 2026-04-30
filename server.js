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

// Nexus AI Model Mapping & Config
const MODEL_CONFIGS: Record<string, any> = {
  'gemini-3-flash-preview': {
    actualModel: 'gemini-1.5-flash',
    temperature: 0.2, // Precision focus
    topP: 0.8,
    topK: 20
  },
  'gemini-3.1-flash-lite-preview': {
    actualModel: 'gemini-1.5-flash',
    temperature: 0.1, // Lite logic focus
    topP: 0.7,
    topK: 16
  }
};

const getDefaultConfig = (model: string) => {
  if (model.includes('flash')) return { actualModel: 'gemini-1.5-flash', temperature: 0.4 };
  return { actualModel: 'gemini-1.5-pro', temperature: 0.7 };
};

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
    const config = MODEL_CONFIGS[model] || getDefaultConfig(model);
    const recentMessages = messages.slice(-30);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const apiKeyToUse = apiKey || process.env.GEMINI_API_KEY;
    if (!apiKeyToUse) {
      return res.status(500).json({ error: "Nexus Core Offline: Chave de API não configurada." });
    }
    
    const ai = new GoogleGenAI(apiKeyToUse);
    const contents = recentMessages.map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.content.trim() || ' ' }]
    }));

    // Add images to last message
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role === 'user' && lastMsg.images?.length) {
      const parts = lastMsg.images.map(img => ({
        inlineData: { mimeType: img.mimeType, data: img.data }
      }));
      contents[contents.length - 1].parts = [...parts, { text: lastMsg.content }];
    }

    const genModel = ai.getGenerativeModel({ 
      model: config.actualModel,
      systemInstruction: systemPrompt || undefined,
    });

    const streamingResult = await genModel.generateContentStream({
      contents: contents,
      generationConfig: {
        temperature: temperature ?? config.temperature,
        topP: config.topP || 0.95,
        topK: config.topK || 40,
        maxOutputTokens: 8192,
      },
      tools: searchGrounding ? [{ googleSearch: {} }] : []
    });

    for await (const chunk of streamingResult.stream) {
      try {
        const text = chunk.text();
        if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
      } catch (e) {}
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
