import { Request, Response } from 'express';
import { Review } from '../models/Review';
import { Transaction } from '../models/Transaction';
import { User } from '../models/User';
import { TransactionStatus } from '../types/transaction';
import { ErrorCode, errorResponse, successResponse } from '../utils/errorCodes';

interface AuthRequest extends Request {
  user?: User;
}

export class ReviewController {
  static async createReview(req: AuthRequest, res: Response) {
    try {
      const user = req.user;
      const { transactionId, rating, comment, isPublic = true } = req.body;

      if (!user) {
        return res.status(401).json(errorResponse(ErrorCode.UNAUTHORIZED));
      }

      const transaction = await Transaction.findByPk(transactionId);
      if (!transaction) {
        return res.status(404).json(errorResponse(ErrorCode.TRANSACTION_NOT_FOUND));
      }

      if (user.id !== transaction.senderId && user.id !== transaction.travelerId) {
        return res.status(403).json(errorResponse(ErrorCode.FORBIDDEN));
      }

      if (transaction.status !== TransactionStatus.PAYMENT_RELEASED) {
        return res.status(400).json(errorResponse(ErrorCode.TRANSACTION_NOT_COMPLETED));
      }

      const revieweeId = user.id === transaction.senderId ? transaction.travelerId : transaction.senderId;

      const existingReview = await Review.findOne({
        where: { transactionId, reviewerId: user.id }
      });

      if (existingReview) {
        return res.status(400).json(errorResponse(ErrorCode.REVIEW_ALREADY_EXISTS));
      }

      const review = await Review.create({
        transactionId,
        reviewerId: user.id,
        revieweeId,
        rating,
        comment,
        isPublic
      });

      if (user.id === transaction.senderId) {
        await transaction.update({ senderReviewed: true });
      } else {
        await transaction.update({ travelerReviewed: true });
      }

      await ReviewController.updateUserRating(revieweeId);

      res.status(201).json({
        success: true,
        data: { review },
        message: 'Avis créé avec succès'
      });

    } catch (error: any) {
      console.error('Erreur création avis:', error);
      res.status(500).json(errorResponse(ErrorCode.SERVER_ERROR));
    }
  }

  static async getUserReviews(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.findAndCountAll({
      where: { 
        revieweeId: userId,
        isPublic: true 
      },
      include: [
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'firstName', 'profileName']
        },
        {
          model: Transaction,
          as: 'transaction',
          attributes: ['id', 'createdAt']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit)
    });

    // Correction TypeScript avec any pour contourner le problème de typage
    const transformedReviews = reviews.rows.map((review: any) => {
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

    res.json(successResponse({
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
    }));

  } catch (error: any) {
    console.error('Erreur récupération avis:', error);
    res.status(500).json(errorResponse(ErrorCode.SERVER_ERROR));
  }
}

  static async getTransactionReviews(req: AuthRequest, res: Response) {
    try {
      const user = req.user;
      const { transactionId } = req.params;

      if (!user) {
        return res.status(401).json(errorResponse(ErrorCode.UNAUTHORIZED));
      }

      const transaction = await Transaction.findByPk(transactionId);
      if (!transaction || (user.id !== transaction.senderId && user.id !== transaction.travelerId)) {
        return res.status(403).json(errorResponse(ErrorCode.FORBIDDEN));
      }

      const reviews = await Review.findAll({
        where: { transactionId },
        include: [
          {
            model: User,
            as: 'reviewer',
            attributes: ['id', 'firstName', 'avatar']
          },
          {
            model: User,
            as: 'reviewee',
            attributes: ['id', 'firstName', 'avatar']
          }
        ]
      });

      res.json(successResponse({ reviews }));
       

    } catch (error: any) {
      console.error('Erreur récupération avis transaction:', error);
      res.status(500).json(errorResponse(ErrorCode.SERVER_ERROR));
    }
  }

  static async updateUserRating(userId: number) {
    try {
      const reviews = await Review.findAll({
        where: { revieweeId: userId },
        attributes: ['rating']
      });

      if (reviews.length === 0) return;

      const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
      
      await User.update(
        { rating: Math.round(averageRating * 10) / 10 },
        { where: { id: userId } }
      );

    } catch (error) {
      console.error('Erreur mise à jour note utilisateur:', error);
    }
  }
}