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
import { voucherCommand } from './commands/voucher.js';

export default async (context) => {
  const { req, res, log } = context;

  const appwrite = new AppwriteService(req.headers['x-appwrite-key'] ?? '');

  if (req.headers['x-appwrite-trigger'] === 'schedule') {
    return res.empty();
  }

  if (req.path === '/static/help.png') {
    const file = readFileSync(path.join(base, 'static/help.png'));
    return res.binary(file, 200, { 'content-type': 'image/png' });
  }

  throwIfMissing(process.env, [
    'WEBHOOK_URL',
    'STAGE_WEBHOOK_URL',
    'DISCORD_PUBLIC_KEY',
    'DISCORD_APPLICATION_ID',
    'DISCORD_TOKEN',
  ]);

  if (
    !req.headers['x-signature-ed25519'] ||
    !req.headers['x-signature-timestamp']
  ) {
    context.error('Invalid headers');
    return res.json({ error: 'Invalid request signature' }, 401);
  }

  const verification = await verifyKey(
    req.bodyBinary,
    req.headers['x-signature-ed25519'],
    req.headers['x-signature-timestamp'],
    process.env.DISCORD_PUBLIC_KEY
  );

  if (!verification) {
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
    if (interaction.data.name === 'voucher') {
      return await voucherCommand(context, appwrite);
    }
  }

  log("Didn't match command - returning PONG");

  return res.json({ type: InteractionResponseType.PONG }, 200);
};
