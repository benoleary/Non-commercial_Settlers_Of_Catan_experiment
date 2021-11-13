import { HexCornerDirection, HexToHexDirection } from "../board/hex";
import { MutableHex } from "../board/MutableHex";
import { SixSidedDieScore } from "../die/die";
import { ResourceCardSet, RobberActivationScore } from "../resource/resource";
import { AuthenticatedPlayer } from "../player/player";
import { ReadableState, RequestResult } from "./ReadableState";
import { CanTakePlayerRequests } from "./CanTakePlayerRequests";
import { InternalState } from "./InternalState";
import { AfterVictory } from "./AfterVictory";

type FunctionOfActivePlayerAndValidHex =
    (activePlayer: AuthenticatedPlayer, validHex: MutableHex) =>
        [CanTakePlayerRequests, RequestResult];

/**
 * This class applies all the rules for the phase of the game which would be considered the "main"
 * phase of the game, afer the initial pieces have been placed: players rolling the dice for
 * production, making trades, and buying and placing pieces on the board (also buying and playing
 * development cards but these will not be implemented). It creates an AfterVictory instance with
 * its InternalState instance once an action results in a player reaching the threshold to win.
 */
export class InNormalTurns implements CanTakePlayerRequests {
    static createInNormalTurns(internalState: InternalState): CanTakePlayerRequests {
        return new InNormalTurns(internalState);
    }

    getReadableState(): ReadableState {
        return this.internalState;
    }

    getActivePlayer(): AuthenticatedPlayer | undefined {
        return this.internalState.playersInTurnOrder[this.activePlayerIndex];
    }

    placeInitialSettlement(
        requestingPlayer: AuthenticatedPlayer,
        rowIndexFromZeroInBoard: number,
        hexIndexFromZeroInRow: number,
        settlementCorner: HexCornerDirection,
        roadEdge: HexToHexDirection
    ): [CanTakePlayerRequests, RequestResult] {
        return [this, ["RefusedSameTurn", "initial settlement placement phase is over"]];
    }

    beginNextNormalTurn(
        requestingPlayer: AuthenticatedPlayer
    ): [CanTakePlayerRequests, RequestResult] {
        if (requestingPlayer != this.getActivePlayer()) {
            const refusalMessage =
                `${requestingPlayer.playerName} is not the active player,`
                + ` ${this.getActivePlayer()?.playerName} is`;
            return [this, ["RefusedSameTurn", refusalMessage]];
        }

        this.activePlayerIndex = (this.activePlayerIndex + 1) % this.numberOfPlayers;

        // It is possible (through another player breaking someone else having longest road) for
        // a player to begin the turn with enough victory points to win.
        if (this.isNowWonByActivePlayer()) {
            this.internalState.lastSuccessfulRequestResult = [
                "SuccessfulNewTurn",
                `Player ${requestingPlayer.playerName} passed the turn`
                + ` to player ${this.getActivePlayer()!.playerName} who has now won`];
            return [
                AfterVictory.createAfterVictory(this.internalState, this.getActivePlayer()!),
                this.internalState.lastSuccessfulRequestResult
            ];
        }

        const diceRollScore = this.beginTurn();
        this.internalState.lastSuccessfulRequestResult = [
            "SuccessfulNewTurn",
            `Player ${requestingPlayer.playerName} passed the turn`
            + ` to player ${this.getActivePlayer()?.playerName} who rolled`
            + ` ${diceRollScore[0]} + ${diceRollScore[1]} = ${diceRollScore[0] + diceRollScore[1]}`
        ];

        return [this, this.internalState.lastSuccessfulRequestResult];
    }

    makeMaritimeTrade(
        requestingPlayer: AuthenticatedPlayer,
        offeredOutgoingResources: ResourceCardSet,
        desiredIncomingResources: ResourceCardSet
    ): [CanTakePlayerRequests, RequestResult] {
        if (requestingPlayer != this.getActivePlayer()) {
            const refusalMessage =
                `${requestingPlayer.playerName} is not the active player,`
                + ` ${this.getActivePlayer()?.playerName} is`;
            return [this, ["RefusedSameTurn", refusalMessage]];
        }

        if (!requestingPlayer.canAfford(offeredOutgoingResources)) {
            const offeredButNotAfforded = offeredOutgoingResources.asArray().join(", ");
            const refusalMessage =
                `Player ${requestingPlayer.playerName} cannot afford`
                + ` to offer ${offeredButNotAfforded}`;
            return [this, ["RefusedSameTurn", refusalMessage]];
        }

        const givingText = offeredOutgoingResources.asArray().join(", ");
        const gettingText = desiredIncomingResources.asArray().join(", ");
        const isValidMaritimeTrade =
            this.internalState.cardBank.makeMaritimeTrade(
                requestingPlayer,
                offeredOutgoingResources,
                desiredIncomingResources
        );
        if (!isValidMaritimeTrade) {
            const givingText = offeredOutgoingResources.asArray().join(", ");
            const gettingText = desiredIncomingResources.asArray().join(", ");
            const refusalMessage =
                `Giving ${givingText} to get ${gettingText} is not a valid maritime trade`;
            return [this, ["RefusedSameTurn", refusalMessage]];
        }

        const successMessage =
            `Player ${requestingPlayer.playerName} gave ${givingText} and got ${gettingText}`;
        return [this, ["SuccessfulSameTurn", successMessage]];
    }

    buildRoad(
        requestingPlayer: AuthenticatedPlayer,
        rowIndexFromZeroInBoard: number,
        hexIndexFromZeroInRow: number,
        roadEdge: HexToHexDirection
    ): [CanTakePlayerRequests, RequestResult] {
        const roadCost = new ResourceCardSet(1n, 1n, 0n, 0n, 0n);
        return this.validateActivePlayerAndValidHexThenPerformRequest(
            requestingPlayer,
            rowIndexFromZeroInBoard,
            hexIndexFromZeroInRow,
            roadCost,
            (activePlayer: AuthenticatedPlayer, validHex: MutableHex) => {
                const [isPlaced, refusalMessage] =
                    validHex.acceptRoad(activePlayer.getRoadFactory(),roadEdge);

                if (!isPlaced) {
                    return [this, ["RefusedSameTurn", refusalMessage]];
                }

                // Placing a road could obviously change the longest road.
                const successMessage =
                    `Player ${activePlayer.playerName} placed`
                    + ` a road on edge ${roadEdge}`
                    + ` of hex ${rowIndexFromZeroInBoard}-${hexIndexFromZeroInRow}`
                    + this.recalculateLongestRoad();

                return this.applyCostsAndCheckForVictory(
                    activePlayer,
                    roadCost,
                    successMessage
                );
            }
        );
    }

    buildSettlement(
        requestingPlayer: AuthenticatedPlayer,
        rowIndexFromZeroInBoard: number,
        hexIndexFromZeroInRow: number,
        settlementCorner: HexCornerDirection
    ): [CanTakePlayerRequests, RequestResult] {
        const villageCost = new ResourceCardSet(1n, 1n, 0n, 1n, 1n);
        return this.validateActivePlayerAndValidHexThenPerformRequest(
            requestingPlayer,
            rowIndexFromZeroInBoard,
            hexIndexFromZeroInRow,
            villageCost,
            (activePlayer: AuthenticatedPlayer, validHex: MutableHex) => {
                const [isPlaced, refusalMessage] =
                validHex.acceptSettlement(
                        activePlayer.getVillageFactory(),
                        settlementCorner
                    );

                if (!isPlaced) {
                    return [this, ["RefusedSameTurn", refusalMessage]];
                }

                // Placing a settlement could break the longest road.
                const successMessage =
                    `Player ${activePlayer.playerName} placed`
                    + ` a village on corner ${settlementCorner}`
                    + ` of hex ${rowIndexFromZeroInBoard}-${hexIndexFromZeroInRow}`
                    + this.recalculateLongestRoad();

                return this.applyCostsAndCheckForVictory(
                    activePlayer,
                    villageCost,
                    successMessage
                );
            }
        );
    }

    upgradeToCity(
        requestingPlayer: AuthenticatedPlayer,
        rowIndexFromZeroInBoard: number,
        hexIndexFromZeroInRow: number,
        settlementCorner: HexCornerDirection
    ): [CanTakePlayerRequests, RequestResult] {
        const cityCost = new ResourceCardSet(0n, 0n, 3n, 2n, 0n);
        return this.validateActivePlayerAndValidHexThenPerformRequest(
            requestingPlayer,
            rowIndexFromZeroInBoard,
            hexIndexFromZeroInRow,
            cityCost,
            (activePlayer: AuthenticatedPlayer, validHex: MutableHex) => {
                const [isPlaced, refusalMessage] =
                    validHex.upgradeToCity(settlementCorner, activePlayer.playerColor);

                if (!isPlaced) {
                    return [this, ["RefusedSameTurn", refusalMessage]];
                }

                // Upgrading a village to a city cannot change the longest road.
                const successMessage =
                    `Player ${activePlayer.playerName} upgraded`
                    + ` a village on corner ${settlementCorner}`
                    + ` of hex ${rowIndexFromZeroInBoard}-${hexIndexFromZeroInRow} to a city`;

                return this.applyCostsAndCheckForVictory(
                    activePlayer,
                    cityCost,
                    successMessage
                );
            }
        );
    }

    private constructor(private internalState: InternalState) {
        this.internalState.gamePhase = "NormalTurns";
        this.numberOfPlayers = this.internalState.playersInTurnOrder.length;
        this.activePlayerIndex = 0;

        this.hexesByResourceProductionScore = new Map<bigint, MutableHex[]>();
        const allMutableHexes = this.internalState.hexBoard.changeBoard().flatMap(
            hexRow =>hexRow.filter(mutableHex => mutableHex != undefined)
        );
        for (const mutableHex of allMutableHexes) {
            const hexScore = mutableHex!.productionRollScore;
            if (hexScore == undefined) {
                continue;
            }

            let hexesForScore = this.hexesByResourceProductionScore.get(hexScore);
            if (hexesForScore == undefined) {
                hexesForScore = [];
                this.hexesByResourceProductionScore.set(hexScore, hexesForScore);
            }

            hexesForScore.push(mutableHex!);
        }

        const diceRollScore = this.beginTurn();
        this.internalState.lastSuccessfulRequestResult = [
            "SuccessfulNewTurn",
            `First normal turn has begun: player ${this.getActivePlayer()?.playerName} rolled`
            + ` ${diceRollScore[0]} + ${diceRollScore[1]} = ${diceRollScore[0] + diceRollScore[1]}`
        ];
    }

    private beginTurn(): [SixSidedDieScore, SixSidedDieScore] {
        const firstRoll = this.internalState.sixSidedDie.newRoll();
        const secondRoll = this.internalState.sixSidedDie.newRoll();

        const rolledScore = firstRoll + secondRoll;
        if (rolledScore == RobberActivationScore) {
            // TODO: get players to discard cards if necessary, move robber
            // (probably just at random for both)
        } else {
            const hexesProducingOnThisRoll = this.hexesByResourceProductionScore?.get(rolledScore);
            if (hexesProducingOnThisRoll != undefined) {
                for (const producingHex of hexesProducingOnThisRoll) {
                    producingHex.produceResource();
                }
            }
        }

        return [firstRoll, secondRoll];
    }

    private validateActivePlayerAndValidHexThenPerformRequest(
        requestingPlayer: AuthenticatedPlayer,
        rowIndexFromZeroInBoard: number,
        hexIndexFromZeroInRow: number,
        pieceCost: ResourceCardSet,
        functionOfActivePlayerAndValidHex: FunctionOfActivePlayerAndValidHex
    ): [CanTakePlayerRequests, RequestResult] {
        if (requestingPlayer != this.getActivePlayer()) {
            const refusalMessage =
                `${requestingPlayer.playerName} is not the active player,`
                + ` ${this.getActivePlayer()?.playerName} is`;
            return [this, ["RefusedSameTurn", refusalMessage]];
        }

        if (!requestingPlayer.canAfford(pieceCost)) {
            const refusalMessage =
                `${requestingPlayer.playerName} does not have`
                + ` the required resource cost ${pieceCost.asArray()}`;
            return [this, ["RefusedSameTurn", refusalMessage]];
        }

        const chosenRow = this.internalState.hexBoard.changeBoard()[rowIndexFromZeroInBoard];
        if (chosenRow == undefined) {
            const refusalMessage =
                `Row ${rowIndexFromZeroInBoard} is not a valid row index,`
                + ` the range is 0 to ${this.internalState.hexBoard.changeBoard().length - 1}`;
            return [this, ["RefusedSameTurn", refusalMessage]];
        }

        const chosenHex = chosenRow[hexIndexFromZeroInRow];
        if (chosenHex == undefined) {
            const refusalMessage =
                `Hex ${hexIndexFromZeroInRow} is not a valid hex index,`
                + ` the range is 0 to ${chosenRow.length - 1}`;
            return [this, ["RefusedSameTurn", refusalMessage]];
        }

        return functionOfActivePlayerAndValidHex(requestingPlayer, chosenHex);
    }

    /**
     * This re-calculates the longest road (since a new road could change it or a new settlement
     * could break the current longset road) and returns an empty string if nothing has changed,
     * or text declaring who now has the longest road if that did change.
     *
     * @returns Text about who now has the longest road if there has been a change, an empty
     *          string otherwise
     */
    private recalculateLongestRoad(): string {
        // Maybe some day I will implement this.
        // TODO: calculate and compare to previous owner.
        // If changed:
        // return this.getLongestRoadOwnerText();
        return "";
    }

    // Only the active player can win on any turn.
    private isNowWonByActivePlayer(): boolean {
        const activePlayer = this.getActivePlayer();
        return (activePlayer != undefined) && (activePlayer.getVictoryPointScore() >= 10n);
    }

    private applyCostsAndCheckForVictory(
        activePlayer: AuthenticatedPlayer,
        pieceCost: ResourceCardSet,
        successMessage: string
    ): [CanTakePlayerRequests, RequestResult] {
        activePlayer.acceptResourceSet(pieceCost.asCost());
        this.internalState.cardBank.absorbSpentCardSet(pieceCost);

        if (this.isNowWonByActivePlayer()) {
            this.internalState.lastSuccessfulRequestResult = ["SuccessfulNewTurn", successMessage];
            const nextRound =
                AfterVictory.createAfterVictory(this.internalState, this.getActivePlayer()!);
            return [nextRound, this.internalState.lastSuccessfulRequestResult];
        }

        this.internalState.lastSuccessfulRequestResult =
            ["SuccessfulSameTurn", successMessage];
        return [this, this.internalState.lastSuccessfulRequestResult];
    }

    private readonly numberOfPlayers: number;
    private activePlayerIndex: number;
    private hexesByResourceProductionScore: Map<bigint, MutableHex[]>;
}
