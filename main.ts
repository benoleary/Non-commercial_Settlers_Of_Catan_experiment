import { HexBoard } from "./game/board/hex"
import { Game } from "./game/state"
import { BoardVisualization } from "./visualization/visualization"
import promptSync from 'prompt-sync';

console.log("Example game played with occasional logging of relevant state");

const emojiArgument = "--emoji";
const neighborDebuggingArgument = "--checkNeighbor";

if (["-h", "-help", "--help"].some(helpArgument => process.argv.includes(helpArgument))) {
    console.log("Sorry, there's not much help.");
    console.log("I hope to have an interactive hot-seat mode. We'll see how it goes.");
    console.log("The main choise is whether to use emoji for the visualization.");
    console.log(`Include \"${emojiArgument}\" to use emoji instead of ASCII.`);
    console.log(
        `Include \"${neighborDebuggingArgument}\" to run a check that neighbors have been set up`
        + " correctly."
    );
    process.exit();
}

let exampleGame = new Game(HexBoard.getFullyRandomBoard(), ["p1", "p2", "p3", "p4"]);
let boardVisualization = new BoardVisualization(process.argv.includes(emojiArgument));


if (process.argv.includes(neighborDebuggingArgument)) {
    console.log(boardVisualization.asString(exampleGame.viewBoard()));
    console.log(boardVisualization.describeAllNeighborSets(exampleGame.viewBoard()));

    process.exit();
}


const consolePrompt = promptSync();

console.log("Enter command in form \"player row-from-bottom hex-in-row corner-of-hex direction-of-road-from-corner\"");
console.log("E.g \"1 1 1 NW NE\" for player 1 to put an initial settlement on the westmost hex of the southernmost");
console.log("row on its north-western corner with a road going north-east");
const playerRequest = consolePrompt("Command: ");
console.log(`You entered: \"${playerRequest}\"`);

/*
while(exampleGame.getPhase() == "InitialPlacement") {
    console.log(boardVisualization.asString(exampleGame.viewBoard()));

    // TODO: this does not work as I expected, there is no pause waiting for input.
    readlineInterface.question("Please choose a player: p1, p2, p3, or p4", (readInput: string) => {
        const playerIssuingCommand = exampleGame.getPlayer(readInput);
    });
}
*/

