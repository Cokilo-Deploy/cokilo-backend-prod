import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface ChatConversationAttributes {
  id: number;
  transactionId?: number;
  user1Id: number;
  user2Id: number;
  lastMessageAt?: Date;
  status: string;
  isArchived: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ChatConversationCreationAttributes extends Optional<ChatConversationAttributes, 
  'id' | 'status' | 'isArchived'> {}

class ChatConversation extends Model<ChatConversationAttributes, ChatConversationCreationAttributes> 
  implements ChatConversationAttributes {
  public id!: number;
  public transactionId?: number;
  public user1Id!: number;
  public user2Id!: number;
  public lastMessageAt?: Date;
  public lastMessageId?: number;
  public status!: string;
  public isArchived!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // AJOUTEZ CES LIGNES - Relations Sequelize
  public readonly user1?: any;
  public readonly user2?: any;
  public readonly transaction?: any;
  public readonly lastMessage?: any;
}

ChatConversation.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  transactionId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'transactions',
      key: 'id',
    },
  },
  user1Id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  user2Id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  lastMessageAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'active',
  },
   
  isArchived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  sequelize,
  modelName: 'ChatConversation',
  tableName: 'chat_conversations',
});

export { ChatConversation };