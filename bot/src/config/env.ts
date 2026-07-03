import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
    DISCORD_TOKEN: process.env.DISCORD_TOKEN || '',
    GUILD_ID: process.env.GUILD_ID || '',
    PORT: process.env.PORT || 3001,
    WEB_URL: process.env.WEB_URL || 'http://localhost:3000',
    WAITING_ROLE_ID: process.env.WAITING_ROLE_ID || '',
    ADMIN_CHANNEL_ID: process.env.ADMIN_CHANNEL_ID || '',
    STEAM_API_KEY: process.env.STEAM_API_KEY || ''
};
