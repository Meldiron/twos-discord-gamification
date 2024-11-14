const shell = require('shelljs');
const fs = require('fs');

const character = 'elves';
const numbers = [ '2', '3', '4', '5', '6', '7', '8', '9', '10', 'ace', character + '_jack', character + '_queen', character + '_king'];
const colors = [
    'heart_red_design_2', 'spade_black_design_2', 'diamond_green_design_2', 'club_blue_design_2',
    'heart_gold_design_2', 'spade_gold_design_2', 'diamond_gold_design_2', 'club_gold_design_2',
];

(async () => {
    for(const number of numbers) {
        for(const color of colors) {
            const colorVerbose = color.split('_')[0];

            const goldenPrefix = color.includes('_gold_') ? 'golden_' : '';

            let numberVerbose = '';
            if(number.includes('_')) {
                numberVerbose = number.split('_')[1];
            } else {
                numberVerbose = number;
            }

            let fileName = `${number}_of_${color}.png`;

            // Files name fix
            if(fileName === 'ace_of_spade_gold_design_2.png') {
                fileName = 'ace_of_space_gold_design_2.png';
            } else if(fileName === 'elves_queen_of_club_gold_design_2.png') {
                fileName = 'elves_queen_club_of_gold_design_2.png';
            }

            const newFileName = `${goldenPrefix}${numberVerbose}_of_${colorVerbose}.png`;

            shell.exec('cp cards/' + fileName + ' assets/' + newFileName);
        }
    }
})();