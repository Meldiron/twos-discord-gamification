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

  let joker = false;
  let golden = false;

  const winChance = 1 - Math.pow(1 - 1 / 100, Math.max(attempt, 1));
  if (Math.random() < winChance) {
    if (Math.random() < 0.2) {
      joker = true;
    } else {
      golden = true;
    }
  }

  if (joker || golden) {
    await appwrite.updateUserAttempt(userId, 0);
    attempt = 0;
  } else {
    await appwrite.updateUserAttempt(userId, attempt);
  }

  let winning = 0;

  let card;
  if (joker) {
    card = 'joker';
  } else {
    const number = numbers[Math.floor(Math.random() * numbers.length)];
    const color = colors[Math.floor(Math.random() * colors.length)];
    card = `${number}_of_${color}`;

    if (golden) {
      card = `golden_${card}`;
    }

    if (number === 'ace') {
      winning = 300;
    } else if (number === 'jack') {
      winning = 1500;
    } else if (number === 'queen') {
      winning = 200;
    } else if (number === 'king') {
      winning = 250;
    } else {
      winning = +number * 10;
    }
  }

  const buffer = await generateImage([...history, card]);
  const file = await appwrite.saveFile(buffer);

  let msg = {};
  if (joker) {
    msg.content = `You won a surprise! 🔥 <@287294735054274560> <@1152120064154288169>`;
  } else if (golden) {
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
