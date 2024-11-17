import { InteractionResponseType } from 'discord-interactions';
import { renderJoker } from '../utils/game.js';
import Axios from 'axios';

export const jokerCommand = async (context, appwrite) => {
  context.log('Running joker command');

  const userId = context.req.body.member.user.id;

  const webhookUrl =
    userId === '287294735054274560'
      ? process.env.STAGE_WEBHOOK_URL
      : process.env.WEBHOOK_URL;

  context.log(`User ID: ${userId}`);

  (async () => {
    try {
      const user = await appwrite.getUser(userId);

      const jokerFragmentsString = user.prefs.jokerFragments ?? '';
      const jokerFragments =
        jokerFragmentsString !== '' ? jokerFragmentsString.split(',') : [];

      const joker = await renderJoker(jokerFragments);

      await Axios.post(webhookUrl, {
        content: `Collect 12 joker fragments to assemble joker card.\nJoker card rewards a surprise 🤫\n\nYou have ${jokerFragments.length} of 12 fragments:\n`,
      });

      await Axios.post(webhookUrl, {
        content: joker,
      });
    } catch (err) {
      await Axios.post(webhookUrl, {
        content:
          '❌ Error occured <@287294735054274560>! ' +
          err.message +
          '\nDetails: ```\n' +
          JSON.stringify(err.stack) +
          '\n```',
      });
    }
  })();

  return context.res.json(
    {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: '🤖 Looking for your fragments...',
      },
    },
    200
  );
};
