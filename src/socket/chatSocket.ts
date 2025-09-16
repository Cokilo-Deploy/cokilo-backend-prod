//src/socket/chatSoket.ts
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { ChatMessage, ChatConversation } from '../models';
import { Op } from 'sequelize';

export class ChatSocketServer {
  private io: SocketIOServer;
  private connectedUsers: Map<number, Set<string>> = new Map();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3001",
        methods: ["GET", "POST"]
      }
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          throw new Error('Token manquant');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        socket.userId = decoded.userId || decoded.id;
        next();
      } catch (error) {
        next(new Error('Authentification échouée'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: any) => {
      console.log(`Utilisateur ${socket.userId} connecté`);

      // Ajouter à la liste des utilisateurs connectés
      if (!this.connectedUsers.has(socket.userId)) {
        this.connectedUsers.set(socket.userId, new Set());
      }
      this.connectedUsers.get(socket.userId)!.add(socket.id);

      // Rejoindre les conversations de l'utilisateur
      this.joinUserConversations(socket);

      // Gestionnaire d'envoi de message
      socket.on('send_message', async (data: any) => {
        await this.handleSendMessage(socket, data);
      });

      // Déconnexion
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private async joinUserConversations(socket: any) {
    try {
      const conversations = await ChatConversation.findAll({
        where: {
          [Op.or]: [
            { user1Id: socket.userId },
            { user2Id: socket.userId }
          ]
        }
      });

      conversations.forEach(conv => {
        socket.join(`conversation_${conv.id}`);
      });
    } catch (error) {
      console.error('Erreur rejoindre conversations:', error);
    }
  }

  // Dans la méthode handleSendMessage, modifiez :
private async handleSendMessage(socket: any, data: any) {
  console.log('📨 Message reçu sur le serveur:', {
    userId: socket.userId,
    conversationId: data.conversationId,
    content: data.content?.substring(0, 50)
  });
  try {
    const { conversationId, content, messageType = 'text', attachmentUrl } = data;

    // Vérifier l'accès à la conversation
    const conversation = await ChatConversation.findOne({
      where: {
        id: conversationId,
        [Op.or]: [
          { user1Id: socket.userId },
          { user2Id: socket.userId }
        ]
      }
    });

    if (!conversation) {
      socket.emit('error', { message: 'Conversation non trouvée' });
      return;
    }

    // Créer le message avec support des images
    const message = await ChatMessage.create({
      conversationId,
      senderId: socket.userId,
      content: content || '',
      messageType,
      attachmentUrl
    });

     console.log('💾 Message sauvegardé en base:', message.id); 
    

    // Mettre à jour la conversation
    await conversation.update({ lastMessageAt: new Date() });
    console.log('📤 Envoi du message à la room:', `conversation_${conversationId}`);
    console.log('👥 Clients dans la room:', this.io.sockets.adapter.rooms.get(`conversation_${conversationId}`)?.size || 0);

    // Envoyer à tous les participants AVEC les métadonnées complètes
    this.io.to(`conversation_${conversationId}`).emit('new_message', {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      messageType: message.messageType,
      attachmentUrl: message.attachmentUrl,
      isRead: message.isRead,
      createdAt: message.createdAt
    });

  } catch (error) {
    console.error('Erreur envoi message:', error);
    socket.emit('error', { message: 'Erreur envoi message' });
  }
}

  private handleDisconnect(socket: any) {
    const userSockets = this.connectedUsers.get(socket.userId);
    if (userSockets) {
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        this.connectedUsers.delete(socket.userId);
      }
    }
    console.log(`Utilisateur ${socket.userId} déconnecté`);
  }

  public isUserOnline(userId: number): boolean {
    return this.connectedUsers.has(userId);
  }
}

// Extension du type Socket
declare module 'socket.io' {
  interface Socket {
    userId: number;
  }
}