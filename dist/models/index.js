"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserPresence = exports.ChatMessage = exports.ChatConversation = exports.Transaction = exports.Trip = exports.User = exports.syncModels = void 0;
//src/models/index.ts
const User_1 = require("./User");
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return User_1.User; } });
const Trip_1 = require("./Trip");
Object.defineProperty(exports, "Trip", { enumerable: true, get: function () { return Trip_1.Trip; } });
const Transaction_1 = require("./Transaction");
Object.defineProperty(exports, "Transaction", { enumerable: true, get: function () { return Transaction_1.Transaction; } });
const ChatConversation_1 = require("./ChatConversation");
Object.defineProperty(exports, "ChatConversation", { enumerable: true, get: function () { return ChatConversation_1.ChatConversation; } });
const ChatMessage_1 = require("./ChatMessage");
Object.defineProperty(exports, "ChatMessage", { enumerable: true, get: function () { return ChatMessage_1.ChatMessage; } });
const Review_1 = require("./Review");
const UserPresence_1 = require("./UserPresence");
Object.defineProperty(exports, "UserPresence", { enumerable: true, get: function () { return UserPresence_1.UserPresence; } });
// ======= RELATIONS EXISTANTES =======
// Relations User -> Trip
User_1.User.hasMany(Trip_1.Trip, {
    foreignKey: 'travelerId',
    as: 'trips'
});
Trip_1.Trip.belongsTo(User_1.User, {
    foreignKey: 'travelerId',
    as: 'traveler'
});
// Relations User -> Transaction
User_1.User.hasMany(Transaction_1.Transaction, {
    foreignKey: 'travelerId',
    as: 'travelerTransactions'
});
User_1.User.hasMany(Transaction_1.Transaction, {
    foreignKey: 'senderId',
    as: 'senderTransactions'
});
Transaction_1.Transaction.belongsTo(User_1.User, {
    foreignKey: 'travelerId',
    as: 'traveler'
});
Transaction_1.Transaction.belongsTo(User_1.User, {
    foreignKey: 'senderId',
    as: 'sender'
});
// Relations Trip -> Transaction
Trip_1.Trip.hasMany(Transaction_1.Transaction, {
    foreignKey: 'tripId',
    as: 'transactions'
});
Transaction_1.Transaction.belongsTo(Trip_1.Trip, {
    foreignKey: 'tripId',
    as: 'trip'
});
// ======= NOUVELLES RELATIONS CHAT =======
// User -> ChatConversation
User_1.User.hasMany(ChatConversation_1.ChatConversation, {
    foreignKey: 'user1Id',
    as: 'conversationsAsUser1'
});
User_1.User.hasMany(ChatConversation_1.ChatConversation, {
    foreignKey: 'user2Id',
    as: 'conversationsAsUser2'
});
ChatConversation_1.ChatConversation.belongsTo(User_1.User, {
    foreignKey: 'user1Id',
    as: 'user1'
});
ChatConversation_1.ChatConversation.belongsTo(User_1.User, {
    foreignKey: 'user2Id',
    as: 'user2'
});
// Transaction -> ChatConversation
Transaction_1.Transaction.hasMany(ChatConversation_1.ChatConversation, {
    foreignKey: 'transactionId',
    as: 'conversations'
});
ChatConversation_1.ChatConversation.belongsTo(Transaction_1.Transaction, {
    foreignKey: 'transactionId',
    as: 'transaction'
});
// ChatConversation -> ChatMessage
ChatConversation_1.ChatConversation.hasMany(ChatMessage_1.ChatMessage, {
    foreignKey: 'conversationId',
    as: 'messages'
});
ChatMessage_1.ChatMessage.belongsTo(ChatConversation_1.ChatConversation, {
    foreignKey: 'conversationId',
    as: 'conversation'
});
// User -> ChatMessage
User_1.User.hasMany(ChatMessage_1.ChatMessage, {
    foreignKey: 'senderId',
    as: 'sentMessages'
});
ChatMessage_1.ChatMessage.belongsTo(User_1.User, {
    foreignKey: 'senderId',
    as: 'sender'
});
// Relations Review
Transaction_1.Transaction.hasMany(Review_1.Review, {
    foreignKey: 'transactionId',
    as: 'reviews'
});
Review_1.Review.belongsTo(Transaction_1.Transaction, {
    foreignKey: 'transactionId',
    as: 'transaction'
});
User_1.User.hasMany(Review_1.Review, {
    foreignKey: 'reviewerId',
    as: 'givenReviews'
});
User_1.User.hasMany(Review_1.Review, {
    foreignKey: 'revieweeId',
    as: 'receivedReviews'
});
Review_1.Review.belongsTo(User_1.User, {
    foreignKey: 'reviewerId',
    as: 'reviewer'
});
Review_1.Review.belongsTo(User_1.User, {
    foreignKey: 'revieweeId',
    as: 'reviewee'
});
// User -> UserPresence
User_1.User.hasMany(UserPresence_1.UserPresence, {
    foreignKey: 'userId',
    as: 'presences'
});
UserPresence_1.UserPresence.belongsTo(User_1.User, {
    foreignKey: 'userId',
    as: 'user'
});
// ======= SYNCHRONISATION DES MODÈLES =======
const syncModels = async () => {
    try {
        console.log('Modèles chat importés:', ChatConversation_1.ChatConversation.name, ChatMessage_1.ChatMessage.name);
        if (process.env.NODE_ENV === 'development') {
            // Synchroniser les modèles existants
            await User_1.User.sync({ alter: true });
            await Trip_1.Trip.sync({ alter: true });
            await Transaction_1.Transaction.sync({ alter: true });
            // Synchroniser les nouveaux modèles chat
            await ChatConversation_1.ChatConversation.sync({ alter: true });
            await ChatMessage_1.ChatMessage.sync({ alter: true });
            await UserPresence_1.UserPresence.sync({ alter: true }); // AJOUTEZ CETTE LIGNE
            //Synchroniser les modeles Review
            await Review_1.Review.sync({ alter: true });
            console.log('✅ Modèles synchronisés (incluant le chat)');
        }
        else {
            // En production
            await User_1.User.sync();
            await Trip_1.Trip.sync();
            await Transaction_1.Transaction.sync();
            await ChatConversation_1.ChatConversation.sync();
            await ChatMessage_1.ChatMessage.sync();
            console.log('✅ Modèles synchronisés (production, incluant le chat)');
        }
    }
    catch (error) {
        console.error('❌ Erreur synchronisation modèles:', error);
        throw error;
    }
};
exports.syncModels = syncModels;
