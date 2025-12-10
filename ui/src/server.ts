#!/usr/bin/env node

import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';

interface EnvVars {
  readonly [key: string]: string;
}

interface ServerConfig {
  readonly assistantBaseUrl: string;
}

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || 'localhost';

// MIME types for common file extensions
const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
} as const;

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

function loadEnvFile(): EnvVars {
  const envPath = path.join(__dirname, '..', '..', '.env');
  const env: Record<string, string> = {};
  
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    }
  } catch (error) {
    console.warn('Warning: Could not load .env file from root directory');
  }
  
  return env;
}

function createServerConfig(envVars: EnvVars): ServerConfig {
  return {
    assistantBaseUrl: envVars.ASSISTANT_URL || 'http://localhost:8083/proposal-assistant-service'
  };
}

function injectConfigIntoHtml(htmlContent: string, config: ServerConfig): string {
  const configScript = `<script>window.UI_CONFIG = ${JSON.stringify(config)};</script>`;
  
  // Insert config script before the closing </head> tag
  if (htmlContent.includes('</head>')) {
    return htmlContent.replace('</head>', `  ${configScript}\n</head>`);
  } else {
    // Fallback: insert after <head> tag
    return htmlContent.replace('<head>', `<head>\n  ${configScript}`);
  }
}

function serveFile(res: http.ServerResponse, filePath: string, config: ServerConfig): void {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      }
      return;
    }

    let content: string | Buffer = data;
    const mimeType = getMimeType(filePath);

    // Inject configuration into HTML files
    if (mimeType === 'text/html') {
      const htmlContent = data.toString();
      content = injectConfigIntoHtml(htmlContent, config);
    }

    res.writeHead(200, { 
      'Content-Type': mimeType,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.end(content);
  });
}

function handleRequest(req: http.IncomingMessage, res: http.ServerResponse, config: ServerConfig): void {
  // Enable CORS for development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (!req.url) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('400 Bad Request');
    return;
  }

  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname || '';

  // Remove leading slash
  if (pathname.startsWith('/')) {
    pathname = pathname.substring(1);
  }

  // Default to index.html for root path
  if (pathname === '' || pathname === '/') {
    pathname = 'index.html';
  }

  // Construct file path
  const rootDir = path.join(__dirname, '..');
  const filePath = path.join(rootDir, pathname);

  // Security check - prevent directory traversal
  const resolvedPath = path.resolve(filePath);
  const rootPath = path.resolve(rootDir);
  
  if (!resolvedPath.startsWith(rootPath)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  // Check if file exists
  fs.stat(resolvedPath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Try serving from dist directory for built assets
      const distPath = path.join(rootDir, 'dist', pathname);
      fs.stat(distPath, (distErr, distStats) => {
        if (distErr || !distStats.isFile()) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
        } else {
          serveFile(res, distPath, config);
        }
      });
    } else {
      serveFile(res, resolvedPath, config);
    }
  });
}

function startServer(): void {
  const envVars = loadEnvFile();
  const config = createServerConfig(envVars);

  const server = http.createServer((req, res) => {
    handleRequest(req, res, config);
  });

  server.listen(PORT, HOST, () => {
    console.log(`🚀 Pooch Palace UI Server running at http://${HOST}:${PORT}/`);
    console.log(`📁 Serving files from: ${path.join(__dirname, '..')}`);
    console.log(`🔧 Built assets served from: ${path.join(__dirname, '..', 'dist')}`);
    console.log(`🔗 Assistant API URL: ${config.assistantBaseUrl}`);
    console.log('');
    console.log('Press Ctrl+C to stop the server');
  });

  // Graceful shutdown
  const shutdown = (signal: string) => {
    console.log(`\n👋 Received ${signal}, shutting down server...`);
    server.close(() => {
      console.log('✅ Server stopped');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}