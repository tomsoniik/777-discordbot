import { GuildMember } from 'discord.js';
import { ENV } from '../config/env';

async function fetchConfig() {
    try {
        const res = await fetch(`${ENV.WEB_URL}/api/bot/config`);
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        console.error("Failed to fetch bot config from API", e);
        return null;
    }
}

export async function onGuildMemberAdd(member: GuildMember) {
    const config = await fetchConfig();
    if (!config) return;

    if (config.autoRoleId) {
        try {
            await member.roles.add(config.autoRoleId);
        } catch (e) {
            console.error("Failed to add auto role", e);
        }
    }

    if (config.welcomeChannelId && config.welcomeMessage) {
        const channel = member.guild.channels.cache.get(config.welcomeChannelId);
        if (channel && channel.isTextBased() && 'send' in channel) {
            const msg = config.welcomeMessage
                .replace(/{user}/g, `<@${member.id}>`)
                .replace(/{server}/g, member.guild.name);
            await channel.send(msg);
        }
    }
}

export async function onGuildMemberRemove(member: GuildMember | any) {
    const config = await fetchConfig();
    if (!config) return;

    if (config.leaveChannelId && config.leaveMessage) {
        const channel = member.guild.channels.cache.get(config.leaveChannelId);
        if (channel && channel.isTextBased() && 'send' in channel) {
            const msg = config.leaveMessage
                .replace(/{user}/g, member.user.username)
                .replace(/{server}/g, member.guild.name);
            await channel.send(msg);
        }
    }
}
