import { HexIndexInRow, RowIndexInBoard } from "../game/board/hex"
import { Game } from "../game/state"
import { BoardVisualization } from "../visualization/visualization"
import promptSync from 'prompt-sync';

export class ConsoleInterface {
    static readonly errorSignifier = "ERROR";

    constructor(
        private consolePrompt: promptSync.Prompt,
        private playerNamesInTurnOrder:
            [string, string, string] | [string, string, string, string],
        private currentGame: Game,
        private boardVisualization: BoardVisualization,
        private quitKeywords: string[]
    ) {
        this.quitKeywords = quitKeywords.map(quitKeyword => quitKeyword.toUpperCase());
        const quitKeywordEnumeration =
            quitKeywords.map(quitKeyword => `\"${quitKeyword}\"`).join(" or ");
        this.quitInstruction = `(Enter ${quitKeywordEnumeration} to end this program.)`
    }

    showBoard() {
        console.log(this.boardVisualization.asString(this.currentGame.viewBoard()));
    }

    parsePlayerRequest(
        unparsedText: string,
        expectedTotalNumberOfWords: number
    ): [string, string[]] {
        const parsedWords =
            unparsedText.split(" ")
            .map(untrimmedString => untrimmedString.trim())
            .filter(trimmedString => trimmedString);

        if (parsedWords.length != expectedTotalNumberOfWords) {
            return [
                ConsoleInterface.errorSignifier,
                [`Expected ${expectedTotalNumberOfWords} \"words\", got ${parsedWords.length}`]
            ];
        }

        const parsedPlayer = `p${parsedWords[0]}`;
        if (!this.playerNamesInTurnOrder.includes(parsedPlayer)) {
            return [
                ConsoleInterface.errorSignifier,
                [
                    `Could not understand ${parsedPlayer} as player`
                    + ` (valid: ${this.playerNamesInTurnOrder})`
                ]
            ];
        }

        return [parsedPlayer, parsedWords.slice(1)];
    }

    isQuitCommand(rawPlayerRequest: string): boolean {
        return (this.quitKeywords.includes(rawPlayerRequest.trim().toUpperCase()))
    }

    promptInitialPlacement(): string {
        console.log("Initial settlement placement phase.");
        console.log(`The active player is ${this.currentGame.getActivePlayerName()}`);
        console.log("Enter your command in the following form:");
        console.log("P R H CD RD");
        console.log("P is the player (1/2/3/4)");
        console.log("R is the row letter (A/B/C/D/E - A the southernmost row, E the northernmost)");
        console.log("H is the hex number from the westernmost of the hexes of the chosen row");
        console.log("CD is the corner direction for placing the settlement on the chosen hex (N/NE/SE/S/SW/NW)");
        console.log("RD is the road direction from the placed settlement (N/NE/SE/S/SW/NW)");
        console.log("E.g. \"1 A 1 NW NE\"");
        console.log("for player 1 to put an initial settlement on the westernmost hex of the");
        console.log("southernmost row on its north-western corner with a road going north-east");
        console.log(this.quitInstruction)
        return this.consolePrompt("Command: ");
    }

    convertToGridIndices(
        rowIdentifier: string,
        hexWithinRow: string
    ): [RowIndexInBoard | undefined, HexIndexInRow | undefined] {
        const uppercaseRow = rowIdentifier.toUpperCase();
        let rowIndex: RowIndexInBoard | undefined = undefined;
        if (uppercaseRow == "A") {
            rowIndex = 0;
        } else if (uppercaseRow == "B") {
            rowIndex = 1;
        } else if (uppercaseRow == "C") {
            rowIndex = 2;
        } else if (uppercaseRow == "D") {
            rowIndex = 3;
        } else if (uppercaseRow == "E") {
            rowIndex = 4;
        } else {
            return [undefined, undefined];
        }

        // The northernmost two rows have dummy undefined hexes, so we start counting from the
        // first valid hex.
        if (rowIndex == 3) {
            if (hexWithinRow == "1") {
                return [rowIndex, 2];
            }
            if (hexWithinRow == "2") {
                return [rowIndex, 3];
            }
            if (hexWithinRow == "3") {
                return [rowIndex, 4];
            }
        }
        if (rowIndex == 4) {
            if (hexWithinRow == "1") {
                return [rowIndex, 1];
            }
            if (hexWithinRow == "2") {
                return [rowIndex, 2];
            }
            if (hexWithinRow == "3") {
                return [rowIndex, 3];
            }
            if (hexWithinRow == "4") {
                return [rowIndex, 4];
            }
        }

        if (hexWithinRow == "1") {
            return [rowIndex, 0];
        } else if (hexWithinRow == "2") {
            return [rowIndex, 1];
        } else if (hexWithinRow == "3") {
            return [rowIndex, 2];
        } else if (hexWithinRow == "4") {
            return [rowIndex, 3];
        } else if (hexWithinRow == "5") {
            return [rowIndex, 4];
        }

        return [rowIndex, undefined];
    }

    private readonly quitInstruction: string;
}