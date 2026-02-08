import { io } from 'socket.io-client';

// In dev, Vite proxies /socket.io → localhost:3001
// In prod, connect directly to Render backend (Vercel can't proxy WebSockets reliably)
const URL = import.meta.env.DEV 
  ? 'http://localhost:3001' 
  : (import.meta.env.VITE_SERVER_URL || 'https://mcwics.onrender.com');

const socket = io(URL, {
  autoConnect: false,
  transports: ['websocket', 'polling']
});

export default socket;
