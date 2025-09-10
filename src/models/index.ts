//src/models/index.ts
import { User } from './User';
import { Trip } from './Trip';
import { Transaction } from './Transaction';
import { ChatConversation } from './ChatConversation';
import { ChatMessage } from './ChatMessage';
import { Review } from './Review';

// ======= RELATIONS EXISTANTES =======

// Relations User -> Trip
User.hasMany(Trip, { 
  foreignKey: 'travelerId', 
  as: 'trips' 
});
Trip.belongsTo(User, { 
  foreignKey: 'travelerId', 
  as: 'traveler' 
});

// Relations User -> Transaction
User.hasMany(Transaction, { 
  foreignKey: 'travelerId', 
  as: 'travelerTransactions' 
});
User.hasMany(Transaction, { 
  foreignKey: 'senderId', 
  as: 'senderTransactions' 
});

Transaction.belongsTo(User, { 
  foreignKey: 'travelerId', 
  as: 'traveler' 
});
Transaction.belongsTo(User, { 
  foreignKey: 'senderId', 
  as: 'sender' 
});

// Relations Trip -> Transaction
Trip.hasMany(Transaction, { 
  foreignKey: 'tripId', 
  as: 'transactions' 
});
Transaction.belongsTo(Trip, { 
  foreignKey: 'tripId', 
  as: 'trip' 
});

// ======= NOUVELLES RELATIONS CHAT =======

// User -> ChatConversation
User.hasMany(ChatConversation, { 
  foreignKey: 'user1Id', 
  as: 'conversationsAsUser1' 
});
User.hasMany(ChatConversation, { 
  foreignKey: 'user2Id', 
  as: 'conversationsAsUser2' 
});

ChatConversation.belongsTo(User, { 
  foreignKey: 'user1Id', 
  as: 'user1' 
});
ChatConversation.belongsTo(User, { 
  foreignKey: 'user2Id', 
  as: 'user2' 
});

// Transaction -> ChatConversation
Transaction.hasMany(ChatConversation, { 
  foreignKey: 'transactionId', 
  as: 'conversations' 
});
ChatConversation.belongsTo(Transaction, { 
  foreignKey: 'transactionId', 
  as: 'transaction' 
});

// ChatConversation -> ChatMessage
ChatConversation.hasMany(ChatMessage, { 
  foreignKey: 'conversationId', 
  as: 'messages' 
});
ChatMessage.belongsTo(ChatConversation, { 
  foreignKey: 'conversationId', 
  as: 'conversation' 
});

// User -> ChatMessage
User.hasMany(ChatMessage, { 
  foreignKey: 'senderId', 
  as: 'sentMessages' 
});
ChatMessage.belongsTo(User, { 
  foreignKey: 'senderId', 
  as: 'sender' 
});

// Relations Review
Transaction.hasMany(Review, {
  foreignKey: 'transactionId',
  as: 'reviews'
});
Review.belongsTo(Transaction, {
  foreignKey: 'transactionId',
  as: 'transaction'
});

User.hasMany(Review, {
  foreignKey: 'reviewerId',
  as: 'givenReviews'
});
User.hasMany(Review, {
  foreignKey: 'revieweeId',
  as: 'receivedReviews'
});

Review.belongsTo(User, {
  foreignKey: 'reviewerId',
  as: 'reviewer'
});
Review.belongsTo(User, {
  foreignKey: 'revieweeId',
  as: 'reviewee'
});

// ======= SYNCHRONISATION DES MODÈLES =======

export const syncModels = async () => {
  try {
    console.log('Modèles chat importés:', ChatConversation.name, ChatMessage.name);
    
    // CORRECTION: Tester les associations
    try {
      const testQuery = await ChatConversation.findOne({
        include: [
          { 
            model: User, 
            as: 'user1', 
            attributes: ['id', 'firstName', 'lastName'],
            required: false
          },
          { 
            model: User, 
            as: 'user2', 
            attributes: ['id', 'firstName', 'lastName'],
            required: false
          },
          {
            model: Transaction,
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
    } catch (associationError: any) {
      console.warn('⚠️ Erreur test associations:', associationError.message);
    }
    
    // Mode production - utilisation des tables existantes sans synchronisation
    console.log('✅ Mode production - utilisation des tables existantes');
    
  } catch (error) {
    console.error('❌ Erreur synchronisation modèles:', error);
    throw error;
  }
};

// ======= EXPORTS =======

export { 
  User, 
  Trip, 
  Transaction,
  ChatConversation,
  ChatMessage,
  Review
};