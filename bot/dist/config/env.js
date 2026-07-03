"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENV = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.ENV = {
    DISCORD_TOKEN: process.env.DISCORD_TOKEN || '',
    GUILD_ID: process.env.GUILD_ID || '',
    PORT: process.env.PORT || 3001,
    WEB_URL: process.env.WEB_URL || 'http://localhost:3000',
    WAITING_ROLE_ID: process.env.WAITING_ROLE_ID || '',
    ADMIN_CHANNEL_ID: process.env.ADMIN_CHANNEL_ID || '',
    STEAM_API_KEY: process.env.STEAM_API_KEY || ''
};
