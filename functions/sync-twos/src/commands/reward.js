import Axios from "axios";
import { InteractionResponseType } from 'discord-interactions';
import { generateImage } from "../canvas.js";

const goldenId = "6_of_heart"; // Also update golden.png

export const rewardCommand = async (context, appwrite) => {
    context.log("Running reward command");

    const userId = context.req.body.member.user.id;
    const finishes = context.req.body.data.options[0].value;

    context.log(`User ID: ${finishes}`);
    context.log(`Entered finishes: ${finishes}`);

    (async () => {
        try {
            const user = await appwrite.getUser(userId);
            const previousFinishes = user.prefs.finishes ?? 0;

            if (finishes > previousFinishes) {
                await appwrite.updateUserFinishes(userId, finishes);
            }

            if (finishes > previousFinishes) {
                const diff = finishes - previousFinishes;

                await Axios.post(process.env.WEBHOOK_URL, {
                    content: `🤖 Dealing ${diff} ${diff === 1 ? 'card' : 'cards'} for  <@${userId}>...\n\n_Finished todos increased from ${previousFinishes} to ${finishes}._`
                });

                setTimeout(async () => {
                    try {
                        const history = []; // TODO: Remember rotation and position

                        for (let i = 0; i < diff; i++) {
                            const numbers = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'ace', 'jack', 'queen', 'king'];
                            const colors = ['heart', 'spade', 'diamond', 'club'];

                            let joker = false;
                            let golden = false;

                            if (Math.random() < 0.01) {
                                joker = true;
                            } else if (Math.random() < 0.02) {
                                golden = true;
                            }

                            let card;
                            if (joker) {
                                card = "joker";
                            } else if (golden) {
                                card = "golden";
                            } else {
                                do {
                                    const number = numbers[Math.floor(Math.random() * numbers.length)];
                                    const color = colors[Math.floor(Math.random() * colors.length)];
                                    card = `${number}_of_${color}`;
                                } while(card == goldenId);
                            }

                            context.log(`Card: ${card}`);

                            const buffer = await generateImage([...history, card]);
                            const file = await appwrite.saveFile(buffer);
                            context.log(`File ID: ${file.$id}`);

                            let msg = {}
                            if (card === 'joker') {
                                msg.content = `**Golden card** was dealt.\n\nYou won! 🥳 You can wish for anything and I'll make it happen within 24 hours. <@287294735054274560> <@1152120064154288169>`;
                            } else if (card === 'golden') {
                                msg.content = `**${goldenId.split('_').join(' ')}** was dealt.\n\nYou won! 🥳 <@287294735054274560> <@1152120064154288169>`;
                            } else {
                                msg.content = `Card **${card.split('_').join(' ')}** was dealt.\n_Better luck next time. You are looking for **${goldenId.split('_').join(' ')}**._`;
                            }

                            msg.embeds = [
                                {
                                    "title": "Table with cards",
                                    "type": "image",
                                    "image": {
                                        "url": `https://cloud.appwrite.io/v1/storage/buckets/games/files/${file.$id}/view?project=twos-gamification&project=twos-gamification`
                                    }
                                }
                            ];

                            history.push(card);

                            const response = await Axios.post(process.env.WEBHOOK_URL, msg);
                            context.log(`Discord responded with ${response.status}`);

                            await new Promise((res, rej) => {
                                setTimeout(() => {
                                    res();
                                }, 1000);
                            });
                        }
                    } catch (err) {
                        await Axios.post(process.env.WEBHOOK_URL, {
                            content: "❌ Error occured <@287294735054274560>! " + err.message + "\nDetails: ```\n" + JSON.stringify(err.stack) + "\n```"
                        });
                    }
                }, 1000);
            } else {
                await Axios.post(process.env.WEBHOOK_URL, {
                    content: `Oh no! 😓 You entered ${finishes} finished todos, but we already ran rewards for ${previousFinishes} todos. You need to finish more todos before running \`/reward\` again.`
                });
            }

        } catch (err) {
            await Axios.post(process.env.WEBHOOK_URL, {
                content: "❌ Error occured <@287294735054274560>! " + err.message + "\nDetails: ```\n" + JSON.stringify(err.stack) + "\n```"
            });
        }
    })();

    return context.res.json(
        {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: `Great job! 👏 Shuffling deck, and preparing to deal cards ...`,
            },
        },
        200
    );
}