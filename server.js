import 'dotenv/config';
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '50mb' }));

// API Route for interacting with the Gemini-powered Agents
app.post('/api/chat', async (req, res) => {
  const { messages, apiKey, model, systemPrompt, temperature } = req.body || {};
  const targetModel = model || 'gemini-1.5-flash';

  try {
    // Use Google Gen AI (Gemini) API
    const ai = new GoogleGenAI({ apiKey: apiKey || process.env.GEMINI_API_KEY });
    
    const contents = messages.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    }));

    // Setup Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const responseStream = await ai.models.generateContentStream({
      model: targetModel,
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: temperature !== undefined ? parseFloat(temperature) : 0.7,
      }
    });

    for await (const chunk of responseStream) {
       res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
    }
    
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
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
    if (errorMessage.includes("API key not valid") || errorMessage.includes("API_KEY_INVALID")) {
      errorMessage = "Chave da API inválida. Por favor, verifique se a sua Chave de API nas configurações (ícone de engrenagem) está correta.";
    } else if (errorMessage.includes("limit: 0")) {
      errorMessage = `A Chave de API utilizada não tem permissão para usar o modelo '${targetModel}' (limite 0). Tente usar o modelo Gemini 1.5 Flash.`;
    } else if (errorMessage.toLowerCase().includes("quota") || errorMessage.toLowerCase().includes("exceeded")) {
      errorMessage = "Limite de cota ou tokens excedido. O prompt é muito grande e consome muitos tokens de contexto, ultrapassando o limite da cota gratuita da sua Chave de API imediatamente. Para resolver: adicione um cartão de crédito no Google AI Studio (faturamento ativado) para remover a restrição de tokens por minuto.";
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
