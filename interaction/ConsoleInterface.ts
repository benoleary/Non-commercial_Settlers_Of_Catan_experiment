import { PlayerNamesInTurnOrder, Game } from "../game/state";
import { BoardVisualization, PlayerVisualization } from "../visualization/visualization";
import { CommandParser } from "./CommandParser";
import promptSync from 'prompt-sync';

export class ConsoleInterface {
    static readonly errorSignifier = "ERROR";
    static readonly helpKeyword = "HELP";
    static readonly helpKeywords = [ConsoleInterface.helpKeyword, `"${ConsoleInterface.helpKeyword}"`];

    constructor(
        private consolePrompt: promptSync.Prompt,
        private playerNamesInTurnOrder: PlayerNamesInTurnOrder,
        private playerVisualization: PlayerVisualization,
        private currentGame: Game,
        private boardVisualization: BoardVisualization,
        private quitKeywords: string[]
    ) {
        this.quitKeywords = quitKeywords.map(quitKeyword => quitKeyword.toUpperCase());
        const quitKeywordEnumeration =
            quitKeywords.map(quitKeyword => `"${quitKeyword}"`).join(" or ");
        this.quitInstruction = `(Enter ${quitKeywordEnumeration} to end this program.)`;
        this.helpInstruction =
            `(Enter ${ConsoleInterface.helpKeyword} to show help for the game's current phase.)`;

        // Just in case someone enters the quote marks as well...
        this.quitKeywords.push(...this.quitKeywords.map(quitKeyword => `"${quitKeyword}"`));
    }

    /**
     * This shows the state of the game and prompts for a player action, and tries to perform it
     * through the given CommandParser. It will display help if requested. If the player enters a
     * command to quit, false is returned. Otherwise (regardless of the result of the player's)
     * request), true is returned.
     *
     * @param commandParser An object which takes a player and a set of words and performs a game
     *                      action
     */
    promptAndExecutePlayerRequest(commandParser: CommandParser): boolean {
        this.showBoard();
        console.log(this.quitInstruction);
        console.log(this.helpInstruction);

        for (const playerName of this.playerNamesInTurnOrder) {
            console.log(
                this.playerVisualization.asString(this.currentGame.getPlayer(playerName)!)
            );
        }

        let rawPlayerRequest = this.consolePrompt("Command: ");
        while(ConsoleInterface.helpKeywords.includes(rawPlayerRequest.toUpperCase())) {
            console.log(commandParser.getHelpText());
            rawPlayerRequest = this.consolePrompt("Command: ");;
        }

        console.log("########");
        console.log(`You entered: \"${rawPlayerRequest}\"`);
        console.log("########");
        if (this.isQuitCommand(rawPlayerRequest)) {
            return false;
        }

        const [parsedPlayerIdentifier, parsedRequest] = this.parsePlayerRequest(rawPlayerRequest);
        if (parsedPlayerIdentifier == ConsoleInterface.errorSignifier) {
            console.log(`${parsedRequest[0]}`);
            console.log("########");
            return true;
        }

        const commandResult = commandParser.performRequest(parsedPlayerIdentifier, parsedRequest);
        console.log(`Request status: ${commandResult}`);
        console.log("########");
        return true;
    }

    showBoard() {
        console.log(this.boardVisualization.asString(this.currentGame.viewBoard()));
    }

    parsePlayerRequest(
        unparsedText: string
    ): [string, string[]] {
        const parsedWords =
            unparsedText.split(" ")
            .map(untrimmedString => untrimmedString.trim())
            .filter(trimmedString => trimmedString);

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

    private readonly quitInstruction: string;
    private readonly helpInstruction: string;
}