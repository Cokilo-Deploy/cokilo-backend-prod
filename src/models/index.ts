//src/models/index.ts
import { User } from './User';
import { Trip } from './Trip';
import { Transaction } from './Transaction';
import { ChatConversation } from './ChatConversation';
import { ChatMessage } from './ChatMessage';
import { Review } from './Review';
import { UserPresence } from './UserPresence';

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
// User -> UserPresence
User.hasMany(UserPresence, { 
  foreignKey: 'userId', 
  as: 'presences' 
});
UserPresence.belongsTo(User, { 
  foreignKey: 'userId', 
  as: 'user' 
});


// ======= SYNCHRONISATION DES MODÈLES =======

export const syncModels = async () => {
  try {
    console.log('Modèles chat importés:', ChatConversation.name, ChatMessage.name);
    
    if (process.env.NODE_ENV === 'development') {
      // Synchroniser les modèles existants
      await User.sync({ alter: true });
      await Trip.sync({ alter: true });
      await Transaction.sync({ alter: true });
      
      // Synchroniser les nouveaux modèles chat
      await ChatConversation.sync({ alter: true });
      await ChatMessage.sync({ alter: true });
      await UserPresence.sync({ alter: true }); // AJOUTEZ CETTE LIGNE

      //Synchroniser les modeles Review
      await Review.sync({ alter: true });
      
      console.log('✅ Modèles synchronisés (incluant le chat)');
    } else {
      // En production
      await User.sync();
      await Trip.sync();
      await Transaction.sync();
      await ChatConversation.sync();
      await ChatMessage.sync();
      
      console.log('✅ Modèles synchronisés (production, incluant le chat)');
    }
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
  UserPresence
};