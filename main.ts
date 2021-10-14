import { HexBoard } from "./game/board/hex"
import { Game } from "./game/state"
import { BoardVisualization } from "./visualization/visualization"

console.log("Example game played with occasional logging of relevant state");

const emojiArgument = "--emoji";

if (["-h", "-help", "--help"].some(helpArgument => process.argv.includes(helpArgument))) {
    console.log("Sorry, there's not much help.");
    console.log("The program should just run some turns with no interaction.");
    console.log("The only choice implemented is whether to use emoji for the visualization.");
    console.log(`Include \"${emojiArgument}\" to use emoji instead of ASCII.`);
    process.exit();
}

let exampleGame = new Game(HexBoard.getFullyRandomBoard());
let boardVisualization = new BoardVisualization(process.argv.includes(emojiArgument));

console.log(boardVisualization.asString(exampleGame.viewBoard()));
