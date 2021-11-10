import { WideCharacterProvider } from "./WideCharacterProvider";

export class AsciiProvider implements WideCharacterProvider {
    getFor(inputType: string | undefined): string {
        if (inputType == "red") {
            return "rd";
        }
        if (inputType == "blue") {
            return "bl";
        }
        if (inputType == "green") {
            return "gn";
        }
        if (inputType == "yellow") {
            return "yw";
        }
        if (inputType == "village") {
            return "VV";
        }
        if (inputType == "city") {
            return "CC";
        }
        if (inputType == "hills") {
            return "hh";
        }
        if (inputType == "forest") {
            return "tt";  // For "trees" to disambiguate from fields.
        }
        if (inputType == "mountains") {
            return "MM";
        }
        if (inputType == "fields") {
            return "gg";  // For "grain" to disambiguate from forest.
        }
        if (inputType == "pasture") {
            return "pp";
        }
        if (inputType == "desert") {
            return "DD";
        }
        if (inputType == "brick") {
            return " B";
        }
        if (inputType == "lumber") {
            return " L";
        }
        if (inputType == "ore") {
            return " O";
        }
        if (inputType == "grain") {
            return " G";
        }
        if (inputType == "wool") {
            return " W";
        }
        if (inputType == "robber") {
            return " R";
        }

        return "  ";
    }
}
