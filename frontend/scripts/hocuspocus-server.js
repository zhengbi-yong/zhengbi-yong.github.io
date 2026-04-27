import { Server } from '@hocuspocus/server';

const server = Server.configure({
  port: 3002,
  
  async onConnect(data) {
    console.log(`[Hocuspocus] Client connected:`, data.socketId);
  },
  
  async onDisconnect(data) {
    console.log(`[Hocuspocus] Client disconnected:`, data.socketId);
  },
  
  async onLoadDocument(data) {
    console.log(`[Hocuspocus] Loading document:`, data.documentName);
    // In-memory — no persistence needed for Phase 1
    return data.document;
  },
  
  async onStoreDocument(data) {
    // Called when document should be saved
    // Phase 1: no-op (in-memory only)
    console.log(`[Hocuspocus] Store document (no-op):`, data.documentName);
  },
});

server.listen().then(() => {
  console.log('[Hocuspocus] WebSocket server running on ws://localhost:3002');
});

process.on('SIGINT', () => {
  server.destroy();
  process.exit(0);
});
