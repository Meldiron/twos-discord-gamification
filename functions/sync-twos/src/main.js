import {
  InteractionResponseType,
  InteractionType,
  verifyKey,
} from 'discord-interactions';

import { throwIfMissing } from './utils.js';
import { helpCommand } from './commands/help.js';

import { readFileSync } from 'fs';
import path from 'path';
import { base } from './utils.js';
import { rewardCommand } from './commands/reward.js';
import { AppwriteService } from './appwrite.js';

export default async (context) => {
  const { req, res, error, log } = context;

  const appwrite = new AppwriteService(req.headers['x-appwrite-key'] ?? '');

  if (req.headers['x-appwrite-trigger'] === 'schedule') {
    return res.empty();
  }

  if (req.path === '/static/help.png') {
    const file = readFileSync(path.join(base, "static/help.png"));
    return res.binary(file, 200, { 'content-type': 'image/png' });
  }

  throwIfMissing(process.env, [
    'WEBHOOK_URL',
    'DISCORD_PUBLIC_KEY',
    'DISCORD_APPLICATION_ID',
    'DISCORD_TOKEN',
  ]);

  context.log(req.bodyBinary.length);
  context.log(req.headers['x-signature-ed25519']);
  context.log(req.headers['x-signature-timestamp']);
  context.log(process.env.DISCORD_PUBLIC_KEY);

  if(!req.headers['x-signature-ed25519'] || !req.headers['x-signature-timestamp']) {
    context.error('Invalid headers');
    return res.json({ error: 'Invalid request signature' }, 401);
  }

  if (
    !verifyKey(
      req.bodyBinary,
      req.headers['x-signature-ed25519'],
      req.headers['x-signature-timestamp'],
      process.env.DISCORD_PUBLIC_KEY
    )
  ) {
    context.error('Invalid request');
    return res.json({ error: 'Invalid request signature' }, 401);
  }

  log('Valid request');

  const interaction = req.body;

  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    if (interaction.data.name === 'help') {
      return await helpCommand(context);
    }
    if (interaction.data.name === 'reward') {
      return await rewardCommand(context, appwrite);
    }
  }

  log("Didn't match command - returning PONG");

  return res.json({ type: InteractionResponseType.PONG }, 200);
};
