import { ResourceCardSet, ResourceType } from "../resource/resource";
import { AuthenticatedPlayer } from"./AuthenticatedPlayer";

/**
 * This class represents the stock of cards which are passed out to the players when hexes produce
 * resources for them, and absorbs the cards paid out as costs for building pieces and given for
 * maritime trades. Well, it would, but I am not bothering to represent the pretty rare cases of
 * running out of physical cards. However, the class still needs to exist to validate maritime
 * trades.
 *
 * If I did implement a finite amount of resources in a CardBank instance, then all the methods
 * would clearly be instance methods, which is why I have not made any one of these static even
 * though they all could be in the current implementation (except for the few which would be static
 * in the finite-amount-of-resources implementation).
 */
export class CardBank {
    makeMaritimeTrade(
        requestingPlayer: AuthenticatedPlayer,
        offeredOutgoingResources: ResourceCardSet,
        desiredIncomingResources: ResourceCardSet
    ): boolean {
        const desiredResourceAndCount =
            CardBank.getSingleResourceTypeAndCount(desiredIncomingResources);
        if ((desiredResourceAndCount == undefined) || (desiredResourceAndCount[1] != 1n)) {
            return false;
        }

        // We cannot make the trade if the card bank cannot give out its resource.
        if (this.getCount(desiredResourceAndCount[0]) < desiredResourceAndCount[1]) {
            return false
        }

        const offeredResourceAndCount =
            CardBank.getSingleResourceTypeAndCount(offeredOutgoingResources);
        if (offeredResourceAndCount == undefined) {
            return false;
        }

        const costForPlayer = requestingPlayer.getMaritimeCost(offeredResourceAndCount[0]);
        if (offeredResourceAndCount[1] < costForPlayer) {
            return false;
        }

        // We make the optimal offer on behalf of the player in case they forgot that they have a
        // relevant port and offered too much.
        requestingPlayer.acceptResource(offeredResourceAndCount[0], -costForPlayer);
        this.absorbSpentCards(offeredResourceAndCount[0], costForPlayer);
        requestingPlayer.acceptResource(desiredResourceAndCount[0], desiredResourceAndCount[1]);
        this.giveOutCards(desiredResourceAndCount[0], desiredResourceAndCount[1]);

        return true;
    }

    private getCount(resourceType: ResourceType): bigint {
        // I'm not going to implement a finite card bank.
        return 1n;
    }

    private absorbSpentCards(resourceType: ResourceType, cardCount: bigint): void {
        // I'm not going to implement a finite card bank.
    }

    private giveOutCards(resourceType: ResourceType, cardCount: bigint): void {
        // I'm not going to implement a finite card bank.
    }

    private static getSingleResourceTypeAndCount(
        offeredOutgoingResources: ResourceCardSet
    ): [ResourceType, bigint] | undefined {
        // This can be set to something other than undefined once, but if it would be set again,
        // the whole offer is invalid, so undefined can be returned immediately.
        let singleTypeAndCount: [ResourceType, bigint] | undefined = undefined;

        if (offeredOutgoingResources.brickCount != 0n) {
            singleTypeAndCount = ["brick", offeredOutgoingResources.brickCount];
        }
        if (offeredOutgoingResources.lumberCount != 0n) {
            if (singleTypeAndCount != undefined) {
                return undefined;
            }
            singleTypeAndCount = ["lumber", offeredOutgoingResources.lumberCount];
        }
        if (offeredOutgoingResources.oreCount != 0n) {
            if (singleTypeAndCount != undefined) {
                return undefined;
            }
            singleTypeAndCount = ["ore", offeredOutgoingResources.oreCount];
        }
        if (offeredOutgoingResources.grainCount != 0n) {
            if (singleTypeAndCount != undefined) {
                return undefined;
            }
            singleTypeAndCount = ["grain", offeredOutgoingResources.grainCount];
        }
        if (offeredOutgoingResources.woolCount != 0n) {
            if (singleTypeAndCount != undefined) {
                return undefined;
            }
            singleTypeAndCount = ["wool", offeredOutgoingResources.woolCount];
        }

        return singleTypeAndCount;
    }
}