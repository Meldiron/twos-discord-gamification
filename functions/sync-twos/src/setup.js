import Axios from 'axios';
import { throwIfMissing } from './utils.js';

async function registerCommand(body) {
    const registerApi = `https://discord.com/api/v9/applications/${process.env.DISCORD_APPLICATION_ID}/commands`;

    const response = await Axios.post(registerApi, body, {
        headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
        },
    });

    if (response.status >= 400) {
        throw new Error('Failed to register command');
    }
}

async function setup() {
    throwIfMissing(process.env, [
        'WEBHOOK_URL',
        'DISCORD_PUBLIC_KEY',
        'DISCORD_APPLICATION_ID',
        'DISCORD_TOKEN',
    ]);

    await registerCommand({
        name: 'help',
        description: 'Explains how to get reward for todos.',
    });

    await registerCommand({
        name: 'reward',
        description: 'Claim your reward for todos.',
        options: [
            {
                type: 4, // Integer
                name: "finished_todos",
                description: "Total finished todos.",
                required: true,
                min_value: 1
            }
        ]
    });

    await registerCommand({
        name: 'voucher',
        description: 'Redeem voucher for pack of cards.',
        options: [
            {
                type: 3, // String
                name: "code",
                description: "Voucher code.",
                required: true,
                min_length: 1
            }
        ]
    });

    console.log('Commands registered successfully');
}

setup();