import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { ChatConversation, ChatMessage} from '../models';
import { User } from '../models/User';
import { Transaction } from '../models/Transaction';

// CORRECTION: Interface qui n'étend pas Request pour éviter les conflits
interface AuthenticatedRequest {
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    verificationStatus: string;
  };
  params: any;
  query: any;
  body: any;
}

export class ChatController {

  // GET /api/chat/conversations
  async getConversations(req: Request, res: Response) {
    try {
      const authReq = req as any; // Cast temporaire
      const userId = authReq.user.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const conversations = await ChatConversation.findAll({
        where: {
          [Op.or]: [
            { user1Id: userId },
            { user2Id: userId }
          ],
          isArchived: false
        },
        include: [
          {
            model: User,
            as: 'user1',
            attributes: ['id', 'firstName', 'lastName', 'avatar', 'verificationStatus']
          },
          {
            model: User,
            as: 'user2',
            attributes: ['id', 'firstName', 'lastName', 'avatar', 'verificationStatus']
          },
          {
            model: ChatMessage,
            as: 'lastMessage',
            required: false,
            include: [{
              model: User,
              as: 'sender',
              attributes: ['id', 'firstName', 'lastName']
            }]
          },
          {
            model: Transaction,
            as: 'transaction',
            attributes: ['id', 'packageDescription', 'status', 'amount'],
            required: false
          }
        ],
        order: [['lastMessageAt', 'DESC']],
        limit,
        offset
      });

      const conversationsWithDetails = await Promise.all(
        conversations.map(async (conv: any) => {
          const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1;
          
          const unreadCount = await ChatMessage.count({
            where: {
              conversationId: conv.id,
              senderId: { [Op.ne]: userId },
              isRead: false
            }
          });

          

          return {
            id: conv.id,
            transactionId: conv.transactionId,
            otherUser: {
              id: otherUser.id,
              firstName: otherUser.firstName,
              lastName: otherUser.lastName,
              avatar: otherUser.avatar,
              verificationStatus: otherUser.verificationStatus,
              isOnline: null,
              lastSeen: null,
            },
            lastMessage: conv.lastMessage ? {
              id: conv.lastMessage.id,
              conversationId: conv.lastMessage.conversationId,
              senderId: conv.lastMessage.senderId,
              content: conv.lastMessage.content,
              messageType: conv.lastMessage.messageType,
              attachmentUrl: conv.lastMessage.attachmentUrl,
              attachmentType: conv.lastMessage.attachmentType,
              attachmentSize: conv.lastMessage.attachmentSize,
              status: conv.lastMessage.status,
              isRead: conv.lastMessage.isRead,
              readAt: conv.lastMessage.readAt,
              editedAt: conv.lastMessage.editedAt,
              replyToId: conv.lastMessage.replyToId,
              createdAt: conv.lastMessage.createdAt,
              updatedAt: conv.lastMessage.updatedAt,
              sender: {
                id: conv.lastMessage.sender.id,
                firstName: conv.lastMessage.sender.firstName,
                lastName: conv.lastMessage.sender.lastName,
                avatar: conv.lastMessage.sender.avatar,
                verificationStatus: conv.lastMessage.sender.verificationStatus
              }
            } : undefined,
            unreadCount,
            status: conv.status,
            isArchived: conv.isArchived,
            transaction: conv.transaction ? {
              id: conv.transaction.id,
              packageDescription: conv.transaction.packageDescription,
              status: conv.transaction.status,
              amount: conv.transaction.amount
            } : undefined,
            lastMessageAt: conv.lastMessageAt,
            createdAt: conv.createdAt
          };
        })
      );

      res.json({ 
        conversations: conversationsWithDetails,
        hasMore: conversations.length === limit
      });
    } catch (error) {
      console.error('❌ Erreur récupération conversations:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  // GET /api/chat/conversations/:id/messages
  async getMessages(req: Request, res: Response) {
    try {
      const authReq = req as any;
      const userId = authReq.user.id;
      const conversationId = parseInt(req.params.id);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      const conversation = await ChatConversation.findOne({
        where: {
          id: conversationId,
          [Op.or]: [
            { user1Id: userId },
            { user2Id: userId }
          ]
        }
      });

      if (!conversation) {
        return res.status(404).json({ error: 'Conversation non trouvée' });
      }

      const messages = await ChatMessage.findAll({
        where: { conversationId },
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
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      const unreadMessageIds = messages
        .filter(msg => msg.senderId !== userId && !msg.isRead)
        .map(msg => msg.id);

      if (unreadMessageIds.length > 0) {
        await ChatMessage.update(
          { isRead: true, readAt: new Date() },
          { where: { id: { [Op.in]: unreadMessageIds } } }
        );
      }

      res.json({ 
        messages: messages.reverse(),
        hasMore: messages.length === limit,
        markedAsRead: unreadMessageIds.length
      });
    } catch (error) {
      console.error('❌ Erreur récupération messages:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  // POST /api/chat/conversations
  async createOrGetConversation(req: Request, res: Response) {
    try {
      const authReq = req as any;
      const userId = authReq.user.id;
      const { otherUserId, transactionId, initialMessage } = req.body;

      if (!otherUserId) {
        return res.status(400).json({ error: 'otherUserId requis' });
      }

      if (otherUserId === userId) {
        return res.status(400).json({ error: 'Impossible de créer une conversation avec soi-même' });
      }

      const otherUser = await User.findByPk(otherUserId);
      if (!otherUser || !otherUser.canChat()) {
        return res.status(400).json({ error: 'Utilisateur non autorisé ou introuvable' });
      }

      const user1Id = Math.min(userId, otherUserId);
      const user2Id = Math.max(userId, otherUserId);

      let conversation = await ChatConversation.findOne({
        where: {
          user1Id,
          user2Id,
          ...(transactionId && { transactionId })
        }
      });

      if (!conversation) {
        conversation = await ChatConversation.create({
          user1Id,
          user2Id,
          transactionId,
          status: 'active'
        } as any);

        if (initialMessage) {
          await ChatMessage.create({
            conversationId: conversation.id,
            senderId: userId,
            content: initialMessage,
            messageType: 'text'
          } as any);
        }
      }

      const fullConversation = await ChatConversation.findByPk(conversation.id, {
        include: [
          {
            model: User,
            as: 'user1',
            attributes: ['id', 'firstName', 'lastName', 'avatar', 'verificationStatus']
          },
          {
            model: User,
            as: 'user2',
            attributes: ['id', 'firstName', 'lastName', 'avatar', 'verificationStatus']
          },
          {
            model: Transaction,
            as: 'transaction',
            attributes: ['id', 'packageDescription', 'status', 'amount'],
            required: false
          }
        ]
      }) as any; 

      // CORRECTION: Utiliser les IDs au lieu des objets user
      const otherUserInfo = fullConversation!.user1Id === userId ? fullConversation!.user2 : fullConversation!.user1;

      res.json({
        conversation: {
          id: fullConversation!.id,
          transactionId: fullConversation!.transactionId,
          otherUser: {
            id: otherUserInfo.id,
            firstName: otherUserInfo.firstName,
            lastName: otherUserInfo.lastName,
            avatar: otherUserInfo.avatar,
            verificationStatus: otherUserInfo.verificationStatus
          },
          // CORRECTION: Utiliser transactionId au lieu de transaction
          transaction: fullConversation!.transactionId,
          createdAt: fullConversation!.createdAt
        }
      });
    } catch (error) {
      console.error('❌ Erreur création conversation:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  // GET /api/chat/online-users

  // PATCH /api/chat/conversations/:id/archive
  async archiveConversation(req: Request, res: Response) {
    try {
      const authReq = req as any;
      const userId = authReq.user.id;
      const conversationId = parseInt(req.params.id);

      const conversation = await ChatConversation.findOne({
        where: {
          id: conversationId,
          [Op.or]: [
            { user1Id: userId },
            { user2Id: userId }
          ]
        }
      });

      if (!conversation) {
        return res.status(404).json({ error: 'Conversation non trouvée' });
      }

      await conversation.update({ isArchived: true });

      res.json({ message: 'Conversation archivée' });
    } catch (error) {
      console.error('❌ Erreur archivage conversation:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
}