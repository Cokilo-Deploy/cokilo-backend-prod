//src/socket/chatSocketServer.ts
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { ChatConversation, ChatMessage, UserPresence } from '../models';
import { User } from '../models/User';
import { SocketChatEvents, ChatMessageType, ChatMessageStatus } from '../types/chat';

// Extension du type Socket pour TypeScript
declare module 'socket.io' {
  interface Socket {
    userId: number;
    userInfo: {
      id: number;
      firstName: string;
      lastName: string;
    };
  }
}

export class ChatSocketServer {
  private io: SocketIOServer;
  private connectedUsers: Map<number, Set<string>> = new Map();
  private typingUsers: Map<number, Set<number>> = new Map();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3001",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          throw new Error('Token d\'authentification manquant');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const userId = decoded.userId || decoded.id;

        // Vérifier que l'utilisateur existe et peut chatter
        const user = await User.findByPk(userId);
        if (!user || !user.canChat()) {
          throw new Error('Utilisateur non autorisé à utiliser le chat');
        }

        socket.userId = userId;
        socket.userInfo = {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName
        };

        next();
      } catch (error) {
        console.error('❌ Erreur authentification socket:', error);
        next(new Error('Authentification échouée'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', async (socket) => {
      console.log(`✅ Utilisateur ${socket.userInfo.firstName} (${socket.userId}) connecté avec socket ${socket.id}`);

      try {
        await this.handleUserConnection(socket);
        await this.joinUserConversations(socket);

        // Gestionnaires d'événements
        socket.on('join_conversation', (data) => this.handleJoinConversation(socket, data));
        socket.on('send_message', (data) => this.handleSendMessage(socket, data));
        socket.on('mark_messages_read', (data) => this.handleMarkMessagesRead(socket, data));
        socket.on('typing_start', (data) => this.handleTypingStart(socket, data));
        socket.on('typing_stop', (data) => this.handleTypingStop(socket, data));

        socket.on('disconnect', () => this.handleUserDisconnection(socket));

      } catch (error) {
        console.error('❌ Erreur lors de la connexion socket:', error);
        socket.emit('error', { message: 'Erreur de connexion' });
      }
    });
  }

  private async handleUserConnection(socket: any) {
    try {
      const userId = socket.userId;

      // Ajouter à la carte des utilisateurs connectés
      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, new Set());
      }
      this.connectedUsers.get(userId)!.add(socket.id);

      // Enregistrer en base
      await UserPresence.create({
        userId,
        socketId: socket.id,
        isOnline: true,
        lastSeen: new Date(),
        deviceInfo: socket.handshake.headers['user-agent']?.substring(0, 100)
      });

      // Notifier les autres utilisateurs
      socket.broadcast.emit('user_online', { userId });

    } catch (error) {
      console.error('❌ Erreur connection utilisateur:', error);
    }
  }

  private async handleUserDisconnection(socket: any) {
    try {
      const userId = socket.userId;

      // Retirer de la carte
      const userSockets = this.connectedUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          this.connectedUsers.delete(userId);
          // Utilisateur complètement déconnecté
          const lastSeen = new Date();
          socket.broadcast.emit('user_offline', { userId, lastSeen });
        }
      }

      // Arrêter le typing s'il était en train d'écrire
      this.typingUsers.forEach((users, conversationId) => {
        if (users.has(userId)) {
          users.delete(userId);
          socket.to(`conversation_${conversationId}`).emit('user_stopped_typing', {
            userId,
            conversationId
          });
        }
      });

      // Mettre à jour en base
      await UserPresence.update(
        { isOnline: false, lastSeen: new Date() },
        { where: { userId, socketId: socket.id } }
      );

      console.log(`❌ Utilisateur ${socket.userInfo?.firstName} (${userId}) déconnecté (socket ${socket.id})`);
    } catch (error) {
      console.error('❌ Erreur déconnexion:', error);
    }
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

      console.log(`📱 Utilisateur ${socket.userId} rejoint ${conversations.length} conversations`);
    } catch (error) {
      console.error('❌ Erreur rejoindre conversations:', error);
    }
  }

  private async handleJoinConversation(socket: any, data: { conversationId: number }) {
    try {
      const { conversationId } = data;

      // Vérifier que l'utilisateur fait partie de cette conversation
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
        socket.emit('error', { message: 'Conversation non trouvée', code: 'CONVERSATION_NOT_FOUND' });
        return;
      }

      socket.join(`conversation_${conversationId}`);
    } catch (error) {
      console.error('❌ Erreur rejoindre conversation:', error);
      socket.emit('error', { message: 'Erreur lors de l\'accès à la conversation' });
    }
  }

  private async handleSendMessage(socket: any, data: any) {
    try {
      const { conversationId, content, messageType = ChatMessageType.TEXT, attachmentUrl, attachmentType, replyToId } = data;

      // Validation basique
      if (!content?.trim() && !attachmentUrl) {
        socket.emit('error', { message: 'Message vide', code: 'EMPTY_MESSAGE' });
        return;
      }

      // Vérifier la conversation
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
        socket.emit('error', { message: 'Conversation non trouvée', code: 'CONVERSATION_NOT_FOUND' });
        return;
      }

      // Créer le message
      const message = await ChatMessage.create({
        conversationId,
        senderId: socket.userId,
        content: content?.trim() || '',
        messageType,
        attachmentUrl,
        attachmentType,
        replyToId,
        status: ChatMessageStatus.SENT
      });

      // Charger le message complet avec les relations
      const fullMessage = await ChatMessage.findByPk(message.id, {
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'firstName', 'lastName', 'avatar', 'verificationStatus']
          },
          {
            model: ChatMessage,
            as: 'replyTo',
            required: false,
            include: [{
              model: User,
              as: 'sender',
              attributes: ['id', 'firstName', 'lastName']
            }]
          }
        ]
      });

      // Mettre à jour la conversation
      await conversation.update({
        lastMessageId: message.id,
        lastMessageAt: new Date()
      });

      // Envoyer à tous les participants
      this.io.to(`conversation_${conversationId}`).emit('new_message', fullMessage);

      // Envoyer notification de mise à jour de conversation
      this.io.to(`conversation_${conversationId}`).emit('conversation_updated', {
        conversationId,
        lastMessage: fullMessage
      });

      // Marquer comme livré
      setTimeout(async () => {
        await message.update({ status: ChatMessageStatus.DELIVERED });
        this.io.to(`conversation_${conversationId}`).emit('message_delivered', {
          messageId: message.id,
          conversationId
        });
      }, 100);

    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
      socket.emit('error', { message: 'Erreur lors de l\'envoi du message' });
    }
  }

  private async handleMarkMessagesRead(socket: any, data: { conversationId: number; messageIds: number[] }) {
    try {
      const { conversationId, messageIds } = data;

      await ChatMessage.update(
        { isRead: true, readAt: new Date() },
        {
          where: {
            id: { [Op.in]: messageIds },
            conversationId,
            senderId: { [Op.ne]: socket.userId }
          }
        }
      );

      // Notifier les autres utilisateurs de la conversation
      socket.to(`conversation_${conversationId}`).emit('messages_read', {
        messageIds,
        conversationId,
        readBy: socket.userId
      });

    } catch (error) {
      console.error('❌ Erreur marquer messages comme lus:', error);
    }
  }

  private handleTypingStart(socket: any, data: { conversationId: number }) {
    const { conversationId } = data;
    const userId = socket.userId;

    if (!this.typingUsers.has(conversationId)) {
      this.typingUsers.set(conversationId, new Set());
    }
    this.typingUsers.get(conversationId)!.add(userId);

    socket.to(`conversation_${conversationId}`).emit('user_typing', {
      userId,
      conversationId,
      userName: socket.userInfo.firstName
    });
  }

  private handleTypingStop(socket: any, data: { conversationId: number }) {
    const { conversationId } = data;
    const userId = socket.userId;

    const typingInConv = this.typingUsers.get(conversationId);
    if (typingInConv) {
      typingInConv.delete(userId);
      if (typingInConv.size === 0) {
        this.typingUsers.delete(conversationId);
      }
    }

    socket.to(`conversation_${conversationId}`).emit('user_stopped_typing', {
      userId,
      conversationId
    });
  }

  // Méthodes utilitaires
  public isUserOnline(userId: number): boolean {
    return this.connectedUsers.has(userId);
  }

  public getOnlineUsersCount(): number {
    return this.connectedUsers.size;
  }

  public getUserSocketCount(userId: number): number {
    return this.connectedUsers.get(userId)?.size || 0;
  }
}