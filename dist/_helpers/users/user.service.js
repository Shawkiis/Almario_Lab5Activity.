"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../db");
const role_1 = require("./role");
exports.userService = {
    getAll,
    getById,
    create,
    update,
    delete: _delete,
};
async function getAll() {
    return await db_1.db.User.findAll();
}
async function getById(id) {
    return await getUser(id);
}
async function create(params) {
    // Check if email already exists
    const existingUser = await db_1.db.User.findOne({ where: { email: params.email } });
    if (existingUser) {
        throw new Error(`Email "${params.email}" is already registered`);
    }
    // Hash password
    const passwordHash = await bcryptjs_1.default.hash(params.password, 10);
    // Create user (exclude password from saved fields)
    await db_1.db.User.create({
        ...params,
        passwordHash,
        role: params.role || role_1.Role.User, // Default to User role
    });
}
async function update(id, params) {
    const user = await getUser(id);
    // Hash new password if provided
    if (params.password) {
        params.passwordHash = await bcryptjs_1.default.hash(params.password, 10);
        delete params.password; // Remove plain password
    }
    // Update user
    await user.update(params);
}
async function _delete(id) {
    const user = await getUser(id);
    await user.destroy();
}
// Helper: Get user or throw error
async function getUser(id) {
    const user = await db_1.db.User.scope('withHash').findByPk(id);
    if (!user) {
        throw new Error('User not found');
    }
    return user;
}
