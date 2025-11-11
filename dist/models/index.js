"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Location = exports.Country = exports.Review = exports.ChatMessage = exports.ChatConversation = exports.Transaction = exports.Trip = exports.User = exports.syncModels = void 0;
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
Object.defineProperty(exports, "Review", { enumerable: true, get: function () { return Review_1.Review; } });
const Country_1 = require("./Country");
Object.defineProperty(exports, "Country", { enumerable: true, get: function () { return Country_1.Country; } });
const Location_1 = require("./Location");
Object.defineProperty(exports, "Location", { enumerable: true, get: function () { return Location_1.Location; } });
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
// ======= SYNCHRONISATION DES MODÈLES =======
const syncModels = async () => {
    try {
        console.log('Modèles chat importés:', ChatConversation_1.ChatConversation.name, ChatMessage_1.ChatMessage.name);
        // CORRECTION: Tester les associations
        try {
            const testQuery = await ChatConversation_1.ChatConversation.findOne({
                include: [
                    {
                        model: User_1.User,
                        as: 'user1',
                        attributes: ['id', 'firstName', 'lastName'],
                        required: false
                    },
                    {
                        model: User_1.User,
                        as: 'user2',
                        attributes: ['id', 'firstName', 'lastName'],
                        required: false
                    },
                    {
                        model: Transaction_1.Transaction,
                        as: 'transaction',
                        attributes: ['id', 'packageDescription'],
                        required: false
                    }
                ],
                limit: 1
            });
            console.log('✅ Test associations chat réussi');
            if (testQuery) {
                console.log('📋 Exemple conversation trouvée avec utilisateurs:', {
                    id: testQuery.id,
                    user1: testQuery.user1 ? `${testQuery.user1.firstName} ${testQuery.user1.lastName}` : 'N/A',
                    user2: testQuery.user2 ? `${testQuery.user2.firstName} ${testQuery.user2.lastName}` : 'N/A'
                });
            }
        }
        catch (associationError) {
            console.warn('⚠️ Erreur test associations:', associationError.message);
        }
        // Mode production - utilisation des tables existantes sans synchronisation
        console.log('✅ Mode production - utilisation des tables existantes');
    }
    catch (error) {
        console.error('❌ Erreur synchronisation modèles:', error);
        throw error;
    }
};
exports.syncModels = syncModels;
