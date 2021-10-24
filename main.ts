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

const playerNamesInTurnOrder: [string, string, string, string] = ["p1", "p2", "p3", "p4"];
let exampleGame = new Game(HexBoard.getFullyRandomBoard(), playerNamesInTurnOrder);
let boardVisualization = new BoardVisualization(process.argv.includes(emojiArgument));


if (process.argv.includes(neighborDebuggingArgument)) {
    console.log(boardVisualization.asString(exampleGame.viewBoard()));
    console.log(boardVisualization.describeAllNeighborSets(exampleGame.viewBoard()));

    process.exit();
}

const errorSignifier = "ERROR";
function parsePlayerRequest(
    unparsedText: string,
    expectedTotalNumberOfWords: number
): [string, string[]] {
    const parsedWords =
        unparsedText.split(" ")
        .map(untrimmedString => untrimmedString.trim())
        .filter(trimmedString => trimmedString);

    if (parsedWords.length != expectedTotalNumberOfWords) {
        return [
            errorSignifier,
            [`Expected ${expectedTotalNumberOfWords} \"words\", got ${parsedWords.length}`]
        ];
    }

    const parsedPlayer = `p${parsedWords[0]}`;
    if (!playerNamesInTurnOrder.includes(parsedPlayer)) {
        return [
            errorSignifier,
            [`Could not understand ${parsedPlayer} as player (valid: ${playerNamesInTurnOrder})`]
        ];
    }

    return [parsedPlayer, parsedWords.slice(1)];
}

const consolePrompt = promptSync();

// We display the board before the loop so that each iteration can show the changed state after the
// command has been processed (and display information text beneath the board where it might be
// noticed).
console.log(boardVisualization.asString(exampleGame.viewBoard()));
while(exampleGame.getPhase() == "InitialPlacement") {
    console.log("Initial settlement placement phase.");
    console.log(`The active player is ${exampleGame.getActivePlayerName()}`);
    console.log("Enter your command in the following form:");
    console.log("player row-from-bottom hex-in-row corner-of-hex direction-of-road-from-corner");
    console.log("E.g. \"1 1 1 NW NE\"");
    console.log("for player 1 to put an initial settlement on the westmost hex of the");
    console.log("southernmost row on its north-western corner with a road going north-east");
    console.log("(Enter \"exit\" or \"quit\" to end this program.)");
    const rawPlayerRequest = consolePrompt("Command: ");

    console.log(boardVisualization.asString(exampleGame.viewBoard()));
    console.log("########");
    console.log(`You entered: \"${rawPlayerRequest}\"`);
    console.log("########");
    if (["EXIT", "QUIT"].includes(rawPlayerRequest.trim().toUpperCase())) {
        process.exit();
    }

    const [parsedPlayerIdentifier, parsedRequest] = parsePlayerRequest(rawPlayerRequest, 5);
    if (parsedPlayerIdentifier == errorSignifier) {
        console.log(`${parsedRequest[0]}`);
        console.log("########");
        continue;
    }

    const requestResult =
        exampleGame.placeInitialSettlement(
            parsedPlayerIdentifier,
            parseInt(parsedRequest[0]!),
            parseInt(parsedRequest[1]!),
            parsedRequest[2]!,
            parsedRequest[3]!
        );
}
