import { HexBoard } from "./game/board/hex"
import { Game, PlayerNamesInTurnOrder } from "./game/state"
import { BoardVisualization, PlayerVisualization } from "./visualization/visualization"
import { ConsoleInterface } from "./interaction/console"
import { InitialPlacementCommandParser } from "./interaction/InitialPlacementCommandParser"
import { NormalTurnsCommandParser } from "./interaction/NormalTurnsCommandParser"
import promptSync from 'prompt-sync';

console.log("Example game played with occasional logging of relevant state");

const emojiArgument = "--emoji";
const threePlayersArgument = "--three";
const fourPlayersArgument = "--four";
const possiblePlayerNumberArguments = [threePlayersArgument, fourPlayersArgument];

if (["-h", "-help", "--help"].some(helpArgument => process.argv.includes(helpArgument))) {
    console.log("Sorry, there's not much help.");
    console.log("I hope to have an interactive hot-seat mode. We'll see how it goes.");
    console.log("The main choise is whether to use emoji for the visualization.");
    console.log(`Include \"${emojiArgument}\" to use emoji instead of ASCII.`);
    console.log(`You must include either \"${threePlayersArgument}\" to play a game for 3 players`);
    console.log(`or \"${fourPlayersArgument}\" to play a game for 4 players`);
    process.exit();
}

const playerNumberArguments =
    possiblePlayerNumberArguments.filter(inputOption => process.argv.includes(inputOption));

if (playerNumberArguments.length > 1) {
    console.log(`Received ${playerNumberArguments} and could not determine which to use.`);
    process.exit();
}

if (playerNumberArguments.length < 1) {
    console.log(
        `You must include exactly one of ${playerNumberArguments} to choose how many players`
    );
    process.exit();
}

const playerNamesInTurnOrder: PlayerNamesInTurnOrder =
    playerNumberArguments[0] == fourPlayersArgument
    ? ["p1", "p2", "p3", "p4"]
    : ["p1", "p2", "p3"];
let exampleGame = new Game(playerNamesInTurnOrder, HexBoard.getFullyRandomBoard());
const hasEmojiArgument = process.argv.includes(emojiArgument)
let playerVisualization = new PlayerVisualization(hasEmojiArgument);
let boardVisualization = new BoardVisualization(hasEmojiArgument);


const consoleInterface =
    new ConsoleInterface(
        promptSync(),
        playerNamesInTurnOrder,
        playerVisualization,
        exampleGame,
        boardVisualization,
        ["exit", "quit"]
    );


const initialPlacementCommandParser = new InitialPlacementCommandParser(exampleGame);
while(exampleGame.getPhase() == "InitialPlacement") {
    const isFineToContinue =
        consoleInterface.promptAndExecutePlayerRequest(initialPlacementCommandParser);

    if (!isFineToContinue) {
        process.exit();
    }
}

const normalTurnsCommandParser = new NormalTurnsCommandParser(exampleGame);
while(exampleGame.getPhase() == "NormalTurns") {
    const isFineToContinue =
        consoleInterface.promptAndExecutePlayerRequest(normalTurnsCommandParser);

    if (!isFineToContinue) {
        process.exit();
    }
}
