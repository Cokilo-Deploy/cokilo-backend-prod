"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatConversation = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class ChatConversation extends sequelize_1.Model {
    // NOUVELLE MÉTHODE: Pour définir les associations
    static associate(models) {
        // Association avec User pour user1
        ChatConversation.belongsTo(models.User, {
            foreignKey: 'user1Id',
            as: 'user1'
        });
        // Association avec User pour user2
        ChatConversation.belongsTo(models.User, {
            foreignKey: 'user2Id',
            as: 'user2'
        });
        // Association avec Transaction
        ChatConversation.belongsTo(models.Transaction, {
            foreignKey: 'transactionId',
            as: 'transaction'
        });
        // Association avec ChatMessage pour les messages
        ChatConversation.hasMany(models.ChatMessage, {
            foreignKey: 'conversationId',
            as: 'messages'
        });
    }
}
exports.ChatConversation = ChatConversation;
ChatConversation.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    transactionId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'transactions',
            key: 'id',
        },
    },
    user1Id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    user2Id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    lastMessageAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    status: {
        type: sequelize_1.DataTypes.STRING,
        defaultValue: 'active',
    },
    isArchived: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    sequelize: database_1.sequelize,
    modelName: 'ChatConversation',
    tableName: 'chat_conversations',
});
