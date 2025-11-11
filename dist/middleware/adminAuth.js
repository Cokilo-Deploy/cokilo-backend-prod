"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Admin_1 = require("../models/Admin");
const adminAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Token manquant' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Chercher dans la table admins au lieu de users
        const admin = await Admin_1.Admin.findByPk(decoded.adminId || decoded.userId);
        if (!admin || !admin.isActive) {
            return res.status(403).json({ error: 'Accès admin requis' });
        }
        req.admin = admin;
        next();
    }
    catch (error) {
        res.status(401).json({ error: 'Token invalide' });
    }
};
exports.adminAuth = adminAuth;
