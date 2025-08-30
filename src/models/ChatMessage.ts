//src/models/ChatMessage.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface ChatMessageAttributes {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  messageType: string;
  attachmentUrl?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ChatMessageCreationAttributes extends Optional<ChatMessageAttributes, 
  'id' | 'messageType' | 'isRead' > {}


class ChatMessage extends Model<ChatMessageAttributes, ChatMessageCreationAttributes> 
  implements ChatMessageAttributes {
  public id!: number;
  public conversationId!: number;
  public senderId!: number;
  public content!: string;
  public messageType!: string;
  public attachmentUrl?: string;
  public attachmentType?: string;  // AJOUTÉ
  public attachmentSize?: number;  // AJOUTÉ
  public status?: string;          // AJOUTÉ
  public isRead!: boolean;
  public readAt?: Date;
  public editedAt?: Date;          // AJOUTÉ
  public replyToId?: number;       // AJOUTÉ
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // AJOUTÉ - Relations pour TypeScript
  public readonly sender?: any;
  public readonly replyTo?: any;
}

ChatMessage.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  conversationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'chat_conversations',
      key: 'id',
    },
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  messageType: {
    type: DataTypes.STRING,
    defaultValue: 'text',
  },
  attachmentUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  
}, {
  sequelize,
  modelName: 'ChatMessage',
  tableName: 'chat_messages',
});

export { ChatMessage };