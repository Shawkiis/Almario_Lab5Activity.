"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const errorHandler_1 = require("./_middleware/errorHandler");
const db_1 = require("./_helpers/db");
const users_controller_1 = __importDefault(require("./_helpers/users/users.controller"));
const app = (0, express_1.default)();
// 💡 MiddleWare
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)());
// 💡 API Routes
app.use('/users', users_controller_1.default);
// 💡 Global Error Handler (must be last)
app.use(errorHandler_1.errorHandler);
// 💡 Start server + initialize database
const PORT = process.env.PORT || 4000;
(0, db_1.initialize)()
    .then(() => {
    app.listen(PORT, () => {
        console.log(`✅ Server running on http://localhost:${PORT}`);
        console.log(`🔐 Test with: POST /users with { email, password, ... }`);
    });
})
    .catch((err) => {
    console.error('❌ Failed to initialize database:', err);
    process.exit(1);
});
