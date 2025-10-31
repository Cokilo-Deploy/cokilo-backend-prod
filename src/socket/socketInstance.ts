// src/socket/socketInstance.ts
import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export const setIO = (socketInstance: SocketIOServer) => {
  io = socketInstance;
};

export const getIO = (): SocketIOServer | null => {
  return io;
};