import Axios from 'axios';
import { InteractionResponseType } from 'discord-interactions';
import { sendCard } from '../utils/game.js';

export const voucherCommand = async (context, appwrite) => {
  context.log('Running voucher command');

  const userId = context.req.body.member.user.id;
  const code = context.req.body.data.options[0].value;

  const webhookUrl =
    userId === '287294735054274560'
      ? process.env.STAGE_WEBHOOK_URL
      : process.env.WEBHOOK_URL;

  context.log(`User ID: ${userId}`);
  context.log(`Code: ${code}`);

  (async () => {
    let diff = 0;
    try {
      try {
        const voucher = await appwrite.getVoucher(code);

        if (!voucher) {
          await Axios.post(webhookUrl, {
            content: `Voucher \`${code}\` has already been used 🚧 Sorry!`,
          });
          return;
        }

        diff = voucher.cards;
      } catch (err) {
        if (err.code === 404) {
          await Axios.post(webhookUrl, {
            content: `I could not find voucher \`${code}\` ❌ Sorry!`,
          });
          return;
        }
        throw err;
      }

      await appwrite.useVoucher(code);

      await Axios.post(webhookUrl, {
        content: `🤖 Dealing ${diff} ${diff === 1 ? 'card' : 'cards'} for <@${userId}>...`,
      });

      const history = [];
      for (let i = 0; i < diff; i++) {
        const card = await sendCard(
          appwrite,
          userId,
          history,
          `${i + 1}/${diff} ${diff === 1 ? 'card' : 'cards'}`,
          webhookUrl
        );
        history.push(card);
      }
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
        content: `🔍 Looking for your voucher ...`,
      },
    },
    200
  );
};
