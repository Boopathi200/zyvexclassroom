import { io } from 'socket.io-client';
import { API_BASE } from '../api.js';

let socket;

export function getSocket() {
  if (!socket) {
    socket = io(API_BASE || undefined, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  return socket;
}
