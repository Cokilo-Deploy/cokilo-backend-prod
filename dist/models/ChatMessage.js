"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatMessage = void 0;
//src/models/ChatMessage.ts
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class ChatMessage extends sequelize_1.Model {
}
exports.ChatMessage = ChatMessage;
ChatMessage.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    conversationId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'chat_conversations',
            key: 'id',
        },
    },
    senderId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    content: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    messageType: {
        type: sequelize_1.DataTypes.STRING,
        defaultValue: 'text',
    },
    attachmentUrl: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    attachmentType: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    attachmentSize: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    status: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        defaultValue: 'sent',
    },
    isRead: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    readAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    editedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    replyToId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'chat_messages',
            key: 'id',
        },
    },
}, {
    sequelize: database_1.sequelize,
    modelName: 'ChatMessage',
    tableName: 'chat_messages',
});
