import Axios from 'axios';
import { generateImage } from '../canvas.js';

export const sendCard = async (
  appwrite,
  userId,
  history,
  progress,
  webhookUrl
) => {
  const user = await appwrite.getUser(userId);
  let attempt = user.prefs.attempt ?? 0;

  attempt++;

  const numbers = [
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    'ace',
    'jack',
    'queen',
    'king',
  ];
  const colors = ['heart', 'spade', 'diamond', 'club'];

  let golden = false;

  const winChance = 1 - Math.pow(1 - 1 / 100, Math.max(attempt, 1));
  if (Math.random() < winChance) {
    golden = true;
  }

  if (golden) {
    await appwrite.updateUserAttempt(userId, 0);
    attempt = 0;
  } else {
    await appwrite.updateUserAttempt(userId, attempt);
  }

  let winning = 0;

  const number = numbers[Math.floor(Math.random() * numbers.length)];
  const color = colors[Math.floor(Math.random() * colors.length)];
  let card = `${number}_of_${color}`;

  if (golden) {
    card = `golden_${card}`;
  }

  if (number === 'ace') {
    winning = 300;
  } else if (number === 'jack') {
    winning = 150;
  } else if (number === 'queen') {
    winning = 200;
  } else if (number === 'king') {
    winning = 250;
  } else {
    winning = +number * 10;
  }

  const buffer = await generateImage([...history, card]);
  const file = await appwrite.saveFile(buffer);

  let msg = {};
  if (golden) {
    msg.content = `You won **${winning} Kč** for our vacation! 🥳 <@287294735054274560> <@1152120064154288169>`;
  } else {
    msg.content = ``;
  }

  msg.embeds = [
    {
      title: `Table with cards (${progress}, luck ${Math.round(winChance * 1000) / 10}%)`,
      type: 'image',
      image: {
        url: `https://cloud.appwrite.io/v1/storage/buckets/games/files/${file.$id}/view?project=twos-gamification&project=twos-gamification`,
      },
    },
  ];

  await Axios.post(webhookUrl, msg);

  return card;
};

export const sendJoker = async (appwrite, user, webhookUrl) => {
  const userId = user.$id;

  const todayId = new Date().toISOString().split('T')[0];
  const lastDayId = user.prefs.lastFinishDate ?? '';

  if (todayId !== lastDayId) {
    await appwrite.updateLastFinish(userId, todayId);

    const jokerFragmentsString = user.prefs.jokerFragments ?? '';
    const jokerFragments =
      jokerFragmentsString !== '' ? jokerFragmentsString.split(',') : [];

    let missingFragments = [];
    for (let i = 0; i < 12; i++) {
      if (!jokerFragments.includes(`${i}`)) {
        missingFragments.push(`${i}`);
      }
    }

    if (missingFragments.length > 0) {
      const randomMissing =
        missingFragments[Math.floor(Math.random() * missingFragments.length)];
      jokerFragments.push(randomMissing);

      if (jokerFragments.length === 12) {
        await appwrite.updateJokerFragments(userId, '');
      } else {
        await appwrite.updateJokerFragments(userId, jokerFragments.join(','));
      }
    }

    const joker = await renderJoker(jokerFragments);

    await Axios.post(webhookUrl, {
      content: `You recieved 1 joker fragment 🔥.\n_Earn one everyday for your first todo._\n\n`,
    });

    await Axios.post(webhookUrl, {
      content: `${joker}\n\n`,
    });

    if (jokerFragments.length === 12) {
      await Axios.post(webhookUrl, {
        content: `You collected entire joker card! 🏆 A surprise awaits you. <@287294735054274560> <@1152120064154288169>`,
      });
    }
  }
};

export const renderJoker = async (jokerFragments) => {
  const empty = '<:jokerempty:1307749779106955395>';
  const fragments = [
    '<:joker0:1307747177891631147>',
    '<:joker1:1307747175790411926>',
    '<:joker2:1307747203489599519>',
    '<:joker3:1307747172107681823>',
    '<:joker4:1307747170774024302>',
    '<:joker5:1307747169419399290>',
    '<:joker6:1307747167687020716>',
    '<:joker7:1307747166143643739>',
    '<:joker8:1307747164608266280>',
    '<:joker9:1307747163308032041>',
    '<:joker10:1307747161966116884>',
    '<:joker11:1307747160175022151>',
  ];

  let joker = '';
  for (let i = 0; i < 12; i++) {
    joker += jokerFragments.includes(`${i}`) ? fragments[i] : empty;
    if (i === 2 || i === 5 || i === 8) {
      joker += `\n`;
    }
  }

  return joker;
};
