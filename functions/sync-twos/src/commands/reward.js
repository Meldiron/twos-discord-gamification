import Axios from "axios";
import { InteractionResponseType } from 'discord-interactions';
import { generateImage } from "../canvas.js";

export const rewardCommand = async (context, appwrite) => {
    context.log("Running reward command");

    const userId = context.req.body.member.user.id;
    const finishes = context.req.body.data.options[0].value;

    const webhookUrl = userId === "287294735054274560" ? process.env.STAGE_WEBHOOK_URL : process.env.WEBHOOK_URL;

    context.log(`User ID: ${finishes}`);
    context.log(`Entered finishes: ${finishes}`);

    (async () => {
        try {
            const user = await appwrite.getUser(userId);
            const previousFinishes = user.prefs.finishes ?? 0;
            let attempt = user.prefs.attempt ?? 0;

            if (finishes > previousFinishes) {
                await appwrite.updateUserFinishes(userId, finishes);
            }

            if (finishes > previousFinishes) {
                const diff = finishes - previousFinishes;

                await Axios.post(webhookUrl, {
                    content: `🤖 Dealing ${diff} ${diff === 1 ? 'card' : 'cards'} for <@${userId}>...\n\n_Finished todos increased from ${previousFinishes} to ${finishes}._`
                });


                const history = [];

                for (let i = 0; i < diff; i++) {
                    attempt++;

                    const numbers = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'ace', 'jack', 'queen', 'king'];
                    const colors = ['heart', 'spade', 'diamond', 'club'];

                    let joker = false;
                    let golden = false;

                    const winChance = 1 - Math.pow((1 - (1 / 100)), Math.max(attempt, 1));
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
                        card = "joker";
                    } else {
                        const number = numbers[Math.floor(Math.random() * numbers.length)];
                        const color = colors[Math.floor(Math.random() * colors.length)];
                        card = `${number}_of_${color}`;
                        
                        if(golden) {
                            card = `golden_${card}`;
                        }

                        if(number === "ace") {
                            winning = 300;
                        } else if(number === "jack") {
                            winning = 1500;
                        } else if(number === "queen") {
                            winning = 200;
                        } else if(number === "king") {
                            winning = 250;
                        } else {
                            winning = (+number) * 10;
                        }
                    }

                    context.log(`Card: ${card}`);

                    const buffer = await generateImage([...history, card]);
                    const file = await appwrite.saveFile(buffer);
                    context.log(`File ID: ${file.$id}`);

                    let msg = {}
                    if (joker) {
                        msg.content = `You won a surprise! 🔥 <@287294735054274560> <@1152120064154288169>`;
                    } else if (golden) {
                        msg.content = `You won **${winning} Kč** for our vacation! 🥳 <@287294735054274560> <@1152120064154288169>`;
                    } else {
                        msg.content = ``;
                    }

                    msg.embeds = [
                        {
                            "title": `Table with cards (${i + 1}/${diff} cards, luck ${Math.round(winChance * 1000) / 10}%)`,
                            "type": "image",
                            "image": {
                                "url": `https://cloud.appwrite.io/v1/storage/buckets/games/files/${file.$id}/view?project=twos-gamification&project=twos-gamification`
                            }
                        }
                    ];

                    history.push(card);

                    const response = await Axios.post(webhookUrl, msg);
                    context.log(`Discord responded with ${response.status}`);
                }
            } else {
                await Axios.post(webhookUrl, {
                    content: `Oh no! 😓 You entered ${finishes} finished todos, but we already ran rewards for ${previousFinishes} todos. You need to finish more todos before running \`/reward\` again.`
                });
            }

        } catch (err) {
            await Axios.post(webhookUrl, {
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