"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminAuthController = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Admin_1 = require("../models/Admin");
const responseHelpers_1 = require("../utils/responseHelpers");
class AdminAuthController {
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            const admin = await Admin_1.Admin.findOne({ where: { email } });
            if (!admin) {
                return res.status(401).json({
                    success: false,
                    error: 'Email ou mot de passe incorrect'
                });
            }
            if (!admin.isActive) {
                return res.status(403).json({
                    success: false,
                    error: 'Compte désactivé'
                });
            }
            const isPasswordValid = await bcrypt_1.default.compare(password, admin.password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    error: 'Email ou mot de passe incorrect'
                });
            }
            // Mettre à jour lastLoginAt
            await admin.update({ lastLoginAt: new Date() });
            // Générer le token
            const token = jsonwebtoken_1.default.sign({ adminId: admin.id, email: admin.email, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
            res.json({
                success: true,
                token,
                admin: {
                    id: admin.id,
                    email: admin.email,
                    name: admin.name,
                    role: admin.role,
                },
            });
        }
        catch (error) {
            console.error('Erreur login admin:', error);
            return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.server_error', null, 500, req.user);
        }
    }
    static async getProfile(req, res) {
        try {
            const admin = req.admin;
            res.json({
                success: true,
                admin: {
                    id: admin.id,
                    email: admin.email,
                    name: admin.name,
                    role: admin.role,
                },
            });
        }
        catch (error) {
            console.error('Erreur profil admin:', error);
            return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.server_error', null, 500, req.user);
        }
    }
    static async createAdmin(req, res) {
        try {
            const { email, password, name, role } = req.body;
            // Vérifier si l'admin existe déjà
            const existingAdmin = await Admin_1.Admin.findOne({ where: { email } });
            if (existingAdmin) {
                return res.status(400).json({
                    success: false,
                    error: 'Un admin avec cet email existe déjà'
                });
            }
            // Hasher le mot de passe
            const hashedPassword = await bcrypt_1.default.hash(password, 12);
            // Créer l'admin
            const admin = await Admin_1.Admin.create({
                email,
                password: hashedPassword,
                name,
                role: role || 'admin',
                isActive: true,
            });
            res.json({
                success: true,
                message: 'Admin créé avec succès',
                admin: {
                    id: admin.id,
                    email: admin.email,
                    name: admin.name,
                    role: admin.role,
                },
            });
        }
        catch (error) {
            console.error('Erreur création admin:', error);
            return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.server_error', null, 500, req.user);
        }
    }
}
exports.AdminAuthController = AdminAuthController;
