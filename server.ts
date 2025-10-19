// server.ts - Next.js Standalone + Socket.IO
import { initializeSocket } from '@/lib/socket';
import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';
import { config } from 'dotenv';

// Проверяем и устанавливаем переменные только если они не заданы
if (!process.env.AI_PROVIDER) {
  process.env.AI_PROVIDER = 'ollama';
}
if (!process.env.OLLAMA_URL) {
  process.env.OLLAMA_URL = 'http://127.0.0.1:11434';
}
if (!process.env.OLLAMA_CHAT_MODEL) {
  process.env.OLLAMA_CHAT_MODEL = 'qwen2.5:7b-instruct';
}
if (!process.env.OLLAMA_EMBED_MODEL) {
  process.env.OLLAMA_EMBED_MODEL = 'nomic-embed-text:latest';
}
if (!process.env.OLLAMA_KEEP_ALIVE) {
  process.env.OLLAMA_KEEP_ALIVE = '24h';
}

// Check if Ollama is available and try to start it
async function checkOllamaAvailability() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${process.env.OLLAMA_URL}/api/tags`, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log('> Ollama is available and running');
    } else {
      console.warn('> Ollama is not responding properly, using fallback mode');
    }
  } catch (error) {
    console.warn('> Ollama is not available, using fallback mode for AI features');
    console.log('> To enable AI features, install and start Ollama:');
    console.log('>   1. Download from https://ollama.ai');
    console.log('>   2. Run: ollama serve');
    console.log('>   3. Run: ollama pull llama3.1:8b-instruct');
  }
}

const dev = process.env.NODE_ENV !== 'production';
const currentPort = Number(process.env.PORT) || 3000;
const hostname = process.env.HOST || '0.0.0.0';

// Custom server with Socket.IO integration
async function createCustomServer() {
  try {
    // Create Next.js app
    const nextApp = next({ 
      dev,
      dir: process.cwd(),
      // In production, use the current directory where .next is located
      conf: dev ? undefined : { distDir: './.next' }
    });

    await nextApp.prepare();
    const handle = nextApp.getRequestHandler();

    // Create HTTP server that will handle both Next.js and Socket.IO
    const server = createServer((req, res) => {
      // Skip socket.io requests from Next.js handler
      if (req.url?.startsWith('/socket.io')) {
        return;
      }
      handle(req, res);
    });

    // Setup Socket.IO via realtime manager
    try {
      initializeSocket(server);
    } catch (err) {
      console.error('Socket.IO setup error:', err);
    }

    // Check Ollama availability
    checkOllamaAvailability();

    // Start the server
    server.listen(currentPort, hostname, () => {
      console.log(`> AI Provider: Ollama (local); API key: not required for local Ollama`);
      console.log(`> Ready on http://${hostname}:${currentPort}`);
      console.log(`> Socket.IO server running at ws://${hostname}:${currentPort}/socket.io`);
    });

  } catch (err) {
    console.error('Server startup error:', err);
    process.exit(1);
  }
}

// Start the server
createCustomServer();
