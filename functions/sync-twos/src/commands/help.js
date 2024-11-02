import { InteractionResponseType } from 'discord-interactions';

export const helpCommand = async (context) => {
    return context.res.json(
        {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: 'Visit https://www.twosapp.com/badges and look for `Completed to-dos` count.\nThen type `/reward <count>`.',
                embeds: [
                    {
                        type: "image",
                        title: "Example where count of finished todos is 13.",
                        description: "If this was what you see, you would type `/reward 13`",
                        image: {
                            url: `https://67261b6b58513adcecd9.appwrite.global/static/help.png`,
                            width: 1518,
                            height: 1428
                        }
                    }
                ]
            },
        },
        200
    );
}