import { HexCornerDirection, HexToHexDirection } from "../board/hex";
import { MutableHex } from "../board/MutableHex";
import { SixSidedDieScore } from "../die/die";
import { ResourceCardSet, RobberActivationScore } from "../resource/resource";
import { AuthenticatedPlayer } from "../player/player";
import { ReadableState, RequestResult } from "./ReadableState";
import { CanTakePlayerRequests } from "./CanTakePlayerRequests";
import { InternalState } from "./InternalState";
import { AfterVictory } from "./AfterVictory";

/**
 * This class applies all the rules for the phase of the game which would be considered the "main"
 * phase of the game, afer the initial pieces have been placed: players rolling the dice for
 * production, making trades, and buying and placing pieces on the board (also buying and playing
 * development cards but these will not be implemented). It creaates an AfterVictory instance with
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
                `${requestingPlayer.playerName} cannot afford to offer ${offeredButNotAfforded}`;
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
            `${requestingPlayer.playerName} gave ${givingText} and got ${gettingText}`;
        return [this, ["SuccessfulSameTurn", successMessage]];
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

    private readonly numberOfPlayers: number;
    private activePlayerIndex: number;
    private hexesByResourceProductionScore: Map<bigint, MutableHex[]>;
}
