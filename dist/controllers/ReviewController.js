"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewController = void 0;
const Review_1 = require("../models/Review");
const Transaction_1 = require("../models/Transaction");
const User_1 = require("../models/User");
const transaction_1 = require("../types/transaction");
const responseHelpers_1 = require("../utils/responseHelpers");
class ReviewController {
    static async createReview(req, res) {
        try {
            const user = req.user;
            const { transactionId, rating, comment, isPublic = true } = req.body;
            if (!user) {
                return res.status(401).json({ success: false, error: 'Non autorisé' });
            }
            const transaction = await Transaction_1.Transaction.findByPk(transactionId);
            if (!transaction) {
                return res.status(404).json({ success: false, error: 'Transaction non trouvée' });
            }
            if (user.id !== transaction.senderId && user.id !== transaction.travelerId) {
                return res.status(403).json({ success: false, error: 'Non autorisé pour cette transaction' });
            }
            if (transaction.status !== transaction_1.TransactionStatus.PAYMENT_RELEASED) {
                return res.status(400).json({ success: false, error: 'Transaction non terminée' });
            }
            const revieweeId = user.id === transaction.senderId ? transaction.travelerId : transaction.senderId;
            const existingReview = await Review_1.Review.findOne({
                where: { transactionId, reviewerId: user.id }
            });
            if (existingReview) {
                return res.status(400).json({ success: false, error: 'Avis déjà donné pour cette transaction' });
            }
            const review = await Review_1.Review.create({
                transactionId,
                reviewerId: user.id,
                revieweeId,
                rating,
                comment,
                isPublic
            });
            if (user.id === transaction.senderId) {
                await transaction.update({ senderReviewed: true });
            }
            else {
                await transaction.update({ travelerReviewed: true });
            }
            await ReviewController.updateUserRating(revieweeId);
            res.status(201).json({
                success: true,
                data: { review },
                message: 'Avis créé avec succès'
            });
        }
        catch (error) {
            console.error('Erreur création avis:', error);
            return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.server_error', null, 500, req.user);
        }
    }
    static async getUserReviews(req, res) {
        try {
            const { userId } = req.params;
            const { page = 1, limit = 10 } = req.query;
            const reviews = await Review_1.Review.findAndCountAll({
                where: {
                    revieweeId: userId,
                    isPublic: true
                },
                include: [
                    {
                        model: User_1.User,
                        as: 'reviewer',
                        attributes: ['id', 'firstName', 'profileName']
                    },
                    {
                        model: Transaction_1.Transaction,
                        as: 'transaction',
                        attributes: ['id', 'createdAt']
                    }
                ],
                order: [['createdAt', 'DESC']],
                limit: Number(limit),
                offset: (Number(page) - 1) * Number(limit)
            });
            // Correction TypeScript avec any pour contourner le problème de typage
            const transformedReviews = reviews.rows.map((review) => {
                return {
                    id: review.id,
                    transactionId: review.transactionId,
                    reviewerId: review.reviewerId,
                    revieweeId: review.revieweeId,
                    rating: review.rating,
                    comment: review.comment,
                    isPublic: review.isPublic,
                    createdAt: review.createdAt,
                    reviewer: {
                        id: review.reviewer.id,
                        firstName: review.reviewer.firstName,
                        displayName: review.reviewer.profileName || review.reviewer.firstName
                    }
                };
            });
            res.json({
                success: true,
                data: {
                    reviews: transformedReviews,
                    pagination: {
                        total: reviews.count,
                        page: Number(page),
                        limit: Number(limit),
                        totalPages: Math.ceil(reviews.count / Number(limit))
                    }
                }
            });
        }
        catch (error) {
            console.error('Erreur récupération avis:', error);
            return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.server_error', null, 500, req.user);
        }
    }
    static async getTransactionReviews(req, res) {
        try {
            const user = req.user;
            const { transactionId } = req.params;
            if (!user) {
                return res.status(401).json({ success: false, error: 'Non autorisé' });
            }
            const transaction = await Transaction_1.Transaction.findByPk(transactionId);
            if (!transaction || (user.id !== transaction.senderId && user.id !== transaction.travelerId)) {
                return res.status(403).json({ success: false, error: 'Non autorisé' });
            }
            const reviews = await Review_1.Review.findAll({
                where: { transactionId },
                include: [
                    {
                        model: User_1.User,
                        as: 'reviewer',
                        attributes: ['id', 'firstName', 'avatar']
                    },
                    {
                        model: User_1.User,
                        as: 'reviewee',
                        attributes: ['id', 'firstName', 'avatar']
                    }
                ]
            });
            res.json({
                success: true,
                data: { reviews }
            });
        }
        catch (error) {
            console.error('Erreur récupération avis transaction:', error);
            return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.server_error', null, 500, req.user);
        }
    }
    static async updateUserRating(userId) {
        try {
            const reviews = await Review_1.Review.findAll({
                where: { revieweeId: userId },
                attributes: ['rating']
            });
            if (reviews.length === 0)
                return;
            const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
            await User_1.User.update({ rating: Math.round(averageRating * 10) / 10 }, { where: { id: userId } });
        }
        catch (error) {
            console.error('Erreur mise à jour note utilisateur:', error);
        }
    }
}
exports.ReviewController = ReviewController;
