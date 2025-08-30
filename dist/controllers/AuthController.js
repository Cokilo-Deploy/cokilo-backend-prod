"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const userAccess_1 = require("../utils/userAccess");
class AuthController {
    static async register(req, res) {
        try {
            const { email, password, firstName, lastName, phone } = req.body;
            const existingUser = await User_1.User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    error: 'Email déjà utilisé'
                });
            }
            const user = await User_1.User.create({
                email,
                password,
                firstName,
                lastName,
                phone,
            });
            const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
            const token = jsonwebtoken_1.default.sign({ userId: user.id }, jwtSecret, { expiresIn: '7d' });
            const userAccess = (0, userAccess_1.getUserAccessInfo)(user);
            res.status(201).json({
                success: true,
                data: {
                    token,
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        verificationStatus: user.verificationStatus,
                    }
                },
                userAccess,
                message: 'Compte créé avec succès'
            });
        }
        catch (error) {
            console.error('Erreur inscription:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de l\'inscription'
            });
        }
    }
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            const user = await User_1.User.findOne({ where: { email } });
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Email ou mot de passe incorrect'
                });
            }
            const isValidPassword = await user.validatePassword(password);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    error: 'Email ou mot de passe incorrect'
                });
            }
            const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
            const token = jsonwebtoken_1.default.sign({ userId: user.id }, jwtSecret, { expiresIn: '7d' });
            const userAccess = (0, userAccess_1.getUserAccessInfo)(user);
            res.json({
                success: true,
                data: {
                    token,
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        verificationStatus: user.verificationStatus,
                    }
                },
                userAccess,
                message: 'Connexion réussie'
            });
        }
        catch (error) {
            console.error('Erreur connexion:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la connexion'
            });
        }
    }
    static async getProfile(req, res) {
        try {
            const user = req.user;
            const userAccess = (0, userAccess_1.getUserAccessInfo)(user);
            res.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        phone: user.phone,
                        verificationStatus: user.verificationStatus,
                        rating: user.rating,
                        totalTrips: user.totalTrips,
                        totalDeliveries: user.totalDeliveries,
                    }
                },
                userAccess
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la récupération du profil'
            });
        }
    }
}
exports.AuthController = AuthController;
