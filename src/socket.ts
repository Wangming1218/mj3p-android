import { io, Socket } from 'socket.io-client';

const config = (window as any).__APP_CONFIG || (window as any).APP_CONFIG || {};
const SERVER_URL = config.serverUrl || 'http://123.45.67.89:3000';

export const socket: Socket = io(SERVER_URL, { autoConnect: true });
