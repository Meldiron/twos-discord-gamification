import * as sharp from 'sharp';
import * as path from 'path';
import { base } from './utils.js';

export const generateImage = async (cards) => {
    const images = [];

    let i = 0;
    for (const card of cards) {
        const sharpCard = sharp.default(path.join(base, `assets/${card}.png`))

        const isLast = i === cards.length - 1;
        if (isLast) {
            sharpCard.resize(460);
        } else {
            let angle = (Math.random() > 0.5 ? 1 : -1) * Math.round((5 + Math.random() * 10));

            if (Math.random() < 0.5) {
                angle += 180;
            }

            sharpCard.rotate(angle, {
                background: {
                    r: 0, g: 0, b: 0, alpha: 0
                }
            });

            const { info } = await sharpCard.png().toBuffer({ resolveWithObject: true });
            const { width, height } = info;

            sharpCard.extract({
                width: 512,
                height: 512,
                left: Math.round((width - 512) / 2),
                top: Math.round((height - 512) / 2),
            });

            sharpCard.resize(460);
        }

        images.push(sharpCard);

        i++;
    }

    const sharpObject = await sharp.default({
        create: {
            width: 512,
            height: 512,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 1 }
        }
    });

    const composition = [
        { input: path.join(base, 'bg.png'), top: 0, left: 0 },
    ];

    i = 0;
    for (const image of images) {
        const { info } = await image.png().toBuffer({ resolveWithObject: true });
        const { width, height } = info;

        const diffWidth = 512 - width;
        const diffHeight = 512 - height;

        let top = diffWidth / 2;
        let left = diffHeight / 2;

        const isLast = i === cards.length - 1;
        if (!isLast) {
            top += (Math.random() > 0.5 ? 1 : -1) * Math.ceil(Math.random() * 25);
            left += (Math.random() > 0.5 ? 1 : -1) * Math.ceil(Math.random() * 25);
        }

        composition.push({ input: await image.toBuffer(), top: top, left: left });

        i++
    }

    const sharpObjectFinal = await sharpObject.composite(composition);

    return sharpObjectFinal.png().toBuffer();
}