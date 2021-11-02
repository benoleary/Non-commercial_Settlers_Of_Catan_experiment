import { HexBoard } from "./game/board/hex"
import { Game } from "./game/state"
import { BoardVisualization, PlayerVisualization } from "./visualization/visualization"
import { ConsoleInterface } from "./interaction/console"
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

const playerNamesInTurnOrder: [string, string, string, string] = ["p1", "p2", "p3", "p4"];
let exampleGame = new Game(playerNamesInTurnOrder, HexBoard.getFullyRandomBoard());
const hasEmojiArgument = process.argv.includes(emojiArgument)
let playerVisualization = new PlayerVisualization(hasEmojiArgument);
let boardVisualization = new BoardVisualization(hasEmojiArgument);


if (process.argv.includes(neighborDebuggingArgument)) {
    console.log(boardVisualization.asString(exampleGame.viewBoard()));
    console.log(boardVisualization.describeAllNeighborSets(exampleGame.viewBoard()));

    process.exit();
}

const consoleInterface =
    new ConsoleInterface(
        promptSync(),
        playerNamesInTurnOrder,
        exampleGame,
        boardVisualization,
        ["exit", "quit"]
    );

while(exampleGame.getPhase() == "InitialPlacement") {
    consoleInterface.showBoard();

    for (const playerName of playerNamesInTurnOrder) {
        console.log(playerVisualization.asString(exampleGame.getPlayer(playerName)!));
    }

    const rawPlayerRequest = consoleInterface.promptInitialPlacement();

    console.log("########");
    console.log(`You entered: \"${rawPlayerRequest}\"`);
    console.log("########");
    if (consoleInterface.isQuitCommand(rawPlayerRequest)) {
        process.exit();
    }

    const [parsedPlayerIdentifier, parsedRequest] =
        consoleInterface.parsePlayerRequest(rawPlayerRequest, 5);
    if (parsedPlayerIdentifier == ConsoleInterface.errorSignifier) {
        console.log(`${parsedRequest[0]}`);
        console.log("########");
        continue;
    }

    const [rowIndexInBoardFromZero, hexIndexInRowFromZero] =
        consoleInterface.convertToGridIndices(parsedRequest[0]!, parsedRequest[1]!);

    if (rowIndexInBoardFromZero == undefined) {
        console.log(`Could not understand ${parsedRequest[0]} as a valid row`);
        console.log("########");
        continue;
    }
    if (hexIndexInRowFromZero == undefined) {
        console.log(
            `Could not understand ${parsedRequest[1]} as a valid hex within the chosen row`
        );
        console.log("########");
        continue;
    }

    const settlementCorner = consoleInterface.convertToHexCorner(parsedRequest[2]!);
    if (settlementCorner == undefined) {
        console.log(
            `Could not understand ${parsedRequest[2]} as a valid corner of the chosen hex`
        );
        console.log("########");
        continue;
    }

    const roadEdge = consoleInterface.convertToHexToHex(parsedRequest[3]!);
    if (roadEdge == undefined) {
        console.log(
            `Could not understand ${parsedRequest[3]} as a valid edge of the chosen hex`
        );
        console.log("########");
        continue;
    }

    const requestResult =
        exampleGame.placeInitialSettlement(
            parsedPlayerIdentifier,
            rowIndexInBoardFromZero,
            hexIndexInRowFromZero,
            settlementCorner,
            roadEdge
        );

    console.log(`Request status: ${requestResult}`);
    console.log("########");
}
