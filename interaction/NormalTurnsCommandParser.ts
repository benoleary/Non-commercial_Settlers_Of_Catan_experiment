import { Game } from "../game/Game";
import { RequestResult } from "../game/state/ReadableState";
import { HexSelector } from "./HexSelector";
import { ResourceCardSet } from "../game/resource/resource";
import { CommandParser, INVALID_INPUT_EFFECT } from "./CommandParser";

type FunctionOfValidHexIndices =
    (rowIndexInBoardFromZero: number, hexIndexInRowFromZero: number) => RequestResult;

const NEXT_TURN_ACTION_KEYWORD = "NEXT";
const TRADE_ACTION_KEYWORD = "TRADE";
const ROAD_ACTION_KEYWORD = "ROAD";
const VILLAGE_ACTION_KEYWORD = "VILLAGE";
const CITY_ACTION_KEYWORD = "CITY";

/**
 * This class parses player text input and invokes Game methods for normal turns after the initial
 * placement.
 */
export class NormalTurnsCommandParser implements CommandParser {
    constructor(private currentGame: Game) { }

    getHelpText(): string {
        const possiblePlayerNumbers =
            `1/2/3${this.currentGame.playerNamesAndColorsInTurnOrder.length > 3 ? "/4" : ""}`;
        const possiblePlayerNames = this.currentGame.playerNamesAndColorsInTurnOrder.join("/");

        // This is just for compactness.
        const portName = NormalTurnsCommandParser.PORT_NAME;

        return [
            "Normal turns phase.",
            `The active player is ${this.currentGame.getActivePlayerName()}`,
            "There are several possible commands",
            `(P is the number of the player requesting the action: ${possiblePlayerNumbers})`,
            "1) \"P next\" to pass the turn to the next player",
            "2) \"P trade X give Y get Z\" to offer to X that P gives Y and gets Z",
            `   - X is the player name (${possiblePlayerNames}) or \"${portName}\"`,
            "   - Y and Z are sets of letters representing the cards to give or get respectively",
            "   -- b for brick, l for lumber, o for ore, g for grain, w for wool",
            "   - e.g. \"2 trade p1 give bll get gw\" for p2 to give 1 brick and 2 lumber to p1",
            "     in exchange for p1 giving p2 1 grain and 1 wool if p1 accepts",
            "     (trading between players has not been implemented)",
            `   - \"${portName}\" always accepts 4 of 1 type for 1 of another`,
            "     (there is no requirement to have a settlement on the coast for 4-for-1,",
            "     while generic 3-for-1 or specific 2-for-1 ports have not been implemented)",
            "3) \"P road X Y Z\" to buy and place a road on row X, hex Y, edge Z",
            "   - e.g. \"3 road B 1 E\" to buy and place a road on the eastern edge of the",
            "     westernmost hex of row B",
            "   - placing a road costs bl (1 brick + 1 lumber)",
            "4) \"P village X Y Z\" to buy and place a settlement on row X, hex Y, corner Z",
            "   - e.g. \"2 village B 4 N\" to buy and place a settlement on the northern corner",
            "     of the easternmost hex of row B",
            "   - placing a settlement costs blgw (1 brick + 1 lumber + 1 grain + 1 wool)",
            "5) \"P city X Y Z\" to upgrade a settlement on row X, hex Y, corner Z to a city",
            "   - e.g. \"1 city C 5 NW\" to upgrade a settlement on the northwestern corner",
            "     of the easternmost hex of row C",
            "   - upgrading a settlement to a city costs ooogg (3 ore + 2 grain)"
        ].join("\n");
    }

    performRequest(playerIdentifier: string, requestWords: string[]): RequestResult {
        const actionWord = requestWords[0]?.toUpperCase();

        if (actionWord == undefined) {
            return [
                INVALID_INPUT_EFFECT,
                "Required at least 1 word to determine which action has been requested"
            ];
        }

        if (actionWord == NEXT_TURN_ACTION_KEYWORD) {
            return this.currentGame.beginNextNormalTurn(playerIdentifier);
        }

        if (actionWord == TRADE_ACTION_KEYWORD) {
            return this.performTrade(playerIdentifier, requestWords);
        }

        if (actionWord == ROAD_ACTION_KEYWORD) {
            return this.buildRoad(playerIdentifier, requestWords);
        }

        if (actionWord == VILLAGE_ACTION_KEYWORD) {
            return this.buildSettlement(playerIdentifier, requestWords);
        }

        if (actionWord == CITY_ACTION_KEYWORD) {
            return this.buildCity(playerIdentifier, requestWords);
        }

        return [
            INVALID_INPUT_EFFECT,
            `Could not understand ${actionWord} as a valid action`
        ];
    }

    private static readonly PORT_NAME = "PORT";

    private performTrade(playerIdentifier: string, requestWords: string[]): RequestResult {
        if ((requestWords.length != 6)
            || (requestWords[2]?.toUpperCase() != "GIVE")
            || (requestWords[4]?.toUpperCase() != "GET")) {
            return [
                "RefusedSameTurn",
                "Required exactly 7 \"words\" in this order: player number,"
                + ` \"${TRADE_ACTION_KEYWORD.toLowerCase()}\",`
                + " accepting player name, \"give\", offered resources, \"get\","
                + " resources to receive in exchange"
            ];
        }

        const offeredOutgoingResources = this.parseTradeResources(requestWords[3]);
        const desiredIncomingResources = this.parseTradeResources(requestWords[5]);
        if ((offeredOutgoingResources == undefined) || (desiredIncomingResources == undefined)) {
            return [
                INVALID_INPUT_EFFECT,
                `Could not understand (giving) ${requestWords[3]} and`
                + ` (getting) ${requestWords[5]} as two valid sets of resources`
            ];
        }

        const tradeTarget = requestWords[1]?.toUpperCase();
        if (tradeTarget == undefined) {
            return [
                INVALID_INPUT_EFFECT,
                `Could not understand ${tradeTarget} as a valid trade partner`
                + ` (valid: ${this.currentGame.playerNamesAndColorsInTurnOrder},`
                + ` ${NormalTurnsCommandParser.PORT_NAME})`
            ];
        }

        if (tradeTarget == playerIdentifier.toUpperCase()) {
            return [
                INVALID_INPUT_EFFECT,
                "Cannot trade with yourself"
            ];
        }

        if (this.currentGame.playerNamesAndColorsInTurnOrder.map(
            playerNameAndColor => playerNameAndColor[0].toUpperCase()).includes(tradeTarget)) {
            return [
                INVALID_INPUT_EFFECT,
                "Sorry, trading with other players is not yet implemented"
            ];
        }

        if (tradeTarget == NormalTurnsCommandParser.PORT_NAME) {
            return this.currentGame.makeMaritimeTrade(
                playerIdentifier,
                offeredOutgoingResources,
                desiredIncomingResources
            );
        }

        return [
            INVALID_INPUT_EFFECT,
            `Could not understand ${tradeTarget} as a valid trade partner`
            + ` (valid: ${this.currentGame.playerNamesAndColorsInTurnOrder},`
            + ` ${NormalTurnsCommandParser.PORT_NAME})`
        ];
    }

    private buildPiece(
        requestWords: string[],
        pieceDisplayName: string,
        lastParameterText: string,
        functionOfValidHexIndices: FunctionOfValidHexIndices
    ): RequestResult {
        if (requestWords.length != 4) {
            return [
                "RefusedSameTurn",
                `Required exactly 5 \"words\" in this order: player number, \"${pieceDisplayName}\",`
                + ` row letter (A/B/C/D/E), hex within row (1-5), ${lastParameterText}`
            ];
        }

        const [rowIndexInBoardFromZero, hexIndexInRowFromZero] =
            HexSelector.convertToGridIndices(requestWords[1]!, requestWords[2]!);

        if (rowIndexInBoardFromZero == undefined) {
            return [
                INVALID_INPUT_EFFECT,
                `Could not understand ${requestWords[1]} as a valid row`
            ];
        }

        if (hexIndexInRowFromZero == undefined) {
            return [
                INVALID_INPUT_EFFECT,
                `Could not understand ${requestWords[2]} as a valid hex within the chosen row`
            ];
        }

        return functionOfValidHexIndices(
            rowIndexInBoardFromZero,
            hexIndexInRowFromZero
        );
    }

    private buildRoad(playerIdentifier: string, requestWords: string[]): RequestResult {
        return this.buildPiece(
            requestWords,
            `${ROAD_ACTION_KEYWORD.toLowerCase()}`,
            "edge of hex (NE/E/SE/SW/W/NW)",
            (rowIndexInBoardFromZero: number, hexIndexInRowFromZero: number) => {
                const roadEdge = HexSelector.convertToHexToHex(requestWords[3]!);
                if (roadEdge == undefined) {
                    return [
                        INVALID_INPUT_EFFECT,
                        `Could not understand ${requestWords[3]} as a valid edge of the chosen hex`
                    ];
                }

                return this.currentGame.buildRoad(
                        playerIdentifier,
                        rowIndexInBoardFromZero,
                        hexIndexInRowFromZero,
                        roadEdge
                    );
            }
        );
    }

    private buildSettlement(playerIdentifier: string, requestWords: string[]): RequestResult {
        return this.buildPiece(
            requestWords,
            `${VILLAGE_ACTION_KEYWORD.toLowerCase()}`,
            "corner of hex (N/NE/SE/S/SW/NW)",
            (rowIndexInBoardFromZero: number, hexIndexInRowFromZero: number) => {
                const settlementCorner = HexSelector.convertToHexCorner(requestWords[3]!);
                if (settlementCorner == undefined) {
                    return [
                        INVALID_INPUT_EFFECT,
                        `Could not understand ${requestWords[3]} as a valid corner of the chosen hex`
                    ];
                }

                return this.currentGame.buildSettlement(
                        playerIdentifier,
                        rowIndexInBoardFromZero,
                        hexIndexInRowFromZero,
                        settlementCorner
                    );
            }
        );
    }

    private buildCity(playerIdentifier: string, requestWords: string[]): RequestResult {
        return this.buildPiece(
            requestWords,
            `${CITY_ACTION_KEYWORD.toLowerCase()}`,
            "corner of hex (N/NE/SE/S/SW/NW)",
            (rowIndexInBoardFromZero: number, hexIndexInRowFromZero: number) => {
                const settlementCorner = HexSelector.convertToHexCorner(requestWords[3]!);
                if (settlementCorner == undefined) {
                    return [
                        INVALID_INPUT_EFFECT,
                        `Could not understand ${requestWords[3]} as a valid corner of the chosen hex`
                    ];
                }

                return this.currentGame.upgradeToCity(
                        playerIdentifier,
                        rowIndexInBoardFromZero,
                        hexIndexInRowFromZero,
                        settlementCorner
                    );
            }
        );
    }

    private parseTradeResources(
        resourceCharacters: string | undefined
    ): ResourceCardSet | undefined {
        if (resourceCharacters == undefined) {
            return undefined;
        }

        const parsedResources = ResourceCardSet.createEmpty();
        for (const wordCharacter of resourceCharacters.toUpperCase()) {
            if (wordCharacter == "B") {
                parsedResources.brickCount += 1n;
            } else if (wordCharacter == "L") {
                parsedResources.lumberCount += 1n;
            } else if (wordCharacter == "O") {
                parsedResources.oreCount += 1n;
            } else if (wordCharacter == "G") {
                parsedResources.grainCount += 1n;
            } else if (wordCharacter == "W") {
                parsedResources.woolCount += 1n;
            } else {
                return undefined;
            }
        }

        return parsedResources;
    }
}