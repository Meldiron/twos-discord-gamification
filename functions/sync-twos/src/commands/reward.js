import Axios from "axios";
import { InteractionResponseType } from 'discord-interactions';
import { sendCard } from "../utils/game.js";

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
                    const card = await sendCard(appwrite, userId, history);
                    history.push(card);
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