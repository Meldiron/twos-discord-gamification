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

export default async (context) => {
  const { req, res, error, log } = context;

  if(req.headers['x-appwrite-trigger'] === 'schedule') {
    return res.empty();
  }

  if(req.path === '/static/help.png') {
    const file = readFileSync(path.join(base, "static/help.png"));
    return res.binary(file, 200, { 'content-type': 'image/png' });
  }

  throwIfMissing(process.env, [
    'DISCORD_PUBLIC_KEY',
    'DISCORD_APPLICATION_ID',
    'DISCORD_TOKEN',
  ]);

  if (
    !verifyKey(
      req.bodyBinary,
      req.headers['x-signature-ed25519'],
      req.headers['x-signature-timestamp'],
      process.env.DISCORD_PUBLIC_KEY
    )
  ) {
    error('Invalid request');
    return res.json({ error: 'Invalid request signature' }, 401);
  }

  log('Valid request');

  const interaction = req.body;

  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    if (interaction.data.name === 'help') {
      return await helpCommand(context);
    }
  }

  log("Didn't match command - returning PONG");

  return res.json({ type: InteractionResponseType.PONG }, 200);
};

/*
export default async ({ req, res, log, error }) => {
  const appwrite = new AppwriteService(req.headers['x-appwrite-key'] ?? '');

  const users = process.env['USERS'].split(',');

  for(const user of users) {
    const [ userId, token ] = user.split('_');

    log(`User ID: ${userId}`);

    const finishes = await getFinishedCount(userId, token);
    log(`Finishes: ${finishes}`);

    const user = await appwrite.getUser(userId);
    const lastFinishes = user.prefs.finishes ?? 0;
    log(`Last finishes: ${finishes}`);

    if(finishes !== lastFinishes) {
      await appwrite.updateUserFinishes(userId, finishes);
    }

    if(finishes <= lastFinishes) {
      log(`Skipping`);
      continue;
    }

    const cards = [];
    const didWin = false;
    // TODO: Radomness

    const buffer = await generateImage();

    const file = await appwrite.saveFile(buffer);
    log(`File ID: ${file.$id}`);

    // TODO: Send message to Discord
  }

  return res.send('OK');
};
*/