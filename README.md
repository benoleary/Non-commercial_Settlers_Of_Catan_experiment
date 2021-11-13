# Non-commercial_Settlers_Of_Catan_experiment
Non-commercial proof of concept of design for an implementation of the game "Settlers Of Catan".

REQUIREMENTS:
Built with Node version v16.11.0
Requires Node Types (npm i --save-dev @types/node)
Requires Node Prompt-Sync (npm install prompt-sync and npm i --save-dev @types/prompt-sync)
I might have tried to make the package.json cover the requirements but I don't have time for that.

The game is playable (e.g. node main.js --emoji --three) but lacks ports for better than 4-for-1
maritime trade, lacks losing resources or moving the robber on the roll of a 7, and lacks trading
between players. The lack of ports is due to it just being a layer of fiddliness as to where to put
them and how to represent them. (Probably best to let each hex have a list of whether there is a
port or not for each of its corners, and if a settlement is placed on such a corner, the player
placing the settlement gets a flag for "owns such a port".) Implementing the robber or trading
between players would require another state of "waiting for some or all players to respond to an
event" which could be done by another implementation of CanTakePlayerRequests which only responds
to e.g. actions for where players discard the cards that they must because a 7 was rolled.

Since this is for an assignment for a course entitled Object-Oriented Programming, the rest of this
README is going to be an introduction to the code form the viewpoint of showing that it
demonstrates a knowledge of object-oriented programming...

In general, I have tried to favor composition over inheritance, but old habits die hard.

The Game class is the facade API for playing a game. The stuff in interaction/ and in
visualization/ is for a playable implementation taking text commands from the command prompt and
printing the board as character "art" to stdout. I have tried to keep that stuff tidy and organized
but less thought went into the structures there than into the classes for the game (i.e. in game/).

Within the Game class, there is a reference to an implementation of the CanTakePlayerRequests
interface. The actual object behind the reference changes as the game moves from one phase to
another. It begins as an instance of InInitialPlacement, which returns itself after executing each
player's turn until the first round of initial placements is over, when the first
InInitialPlacement then creates another InInitialPlacement with the players in reverse order and
returns a reference to that back to the Game, so that the game delegates the job of interpreting
player requests to the second InInitialPlacement instance, which returns references to itself until
that instance has placed the second initial pieces for each player, when it returns an instance of
InNormalTurns to the Game instance. This instance of InNormalTurns performs the player actions and
returns references to itself until it determines that a player has won, when it returns a
reference to an instance of AfterVictory, which simply returns a reference to itself with a
constant message declaring the winner as a response to all requests.

The state of the game is split between the board represented by a grid of MutableHex instances and
the players represented by instances of Authenticated player. (There is no authentication of
players in this project, but if it were to ever grow into a client-server thing, entities issuing
move requests would have to be authenticated and verified.) There is interaction between the board
hexes and the players directly, as most of the sequences of events are set up as callbacks. An
example is a callback invoked by a hex when it produces its resource, which is a callback to a
settlement piece which in turn invokes another callback to a player to increase the amount of that
resource in their hand. The interaction between the class representing the dice and the event of a
hex producing its resource could also be tied together with callbacks to increase the length of the
callback chain, but in this case, I decided that it was simpler to let the game orchestrate that.
(It would have been basically the same code to allocate the callbacks, but in the game state
constructor, and then a little more for actually defining the callbacks.)

Within game/board/, there is an awful lot of logic for figuring out which of the pair of hexes
sharing an edge is doing the job of storing whether a road is there or not, and even more regarding
settlements on corners. I probably should have copied the references among all sharing hexes on
placement. There is still a lot of code for determining if a player's requested move is valid which
might be simpler if I had chosen a different way of representing hex and piece location.

SOLID:
S - Um, I tried to keep each class to 1 job, but that's always subjective. InInitialPlacement and
    InNormalTurns probably do too much.
O - Well, there are some interfaces and some abstract classes.
L - Eh, it's kinda enforced by TypeScript because subtypes are usable as supertypes?
I - Hm, there is no example of one class implementing multiple interfaces in this project.
D - I like dependency inversion. It's a little sloppy in interaction/ and in visualization/, but
    for example the Game constructor accepts a board to allow the main program to determine if a
    fixed board layout or random layout should be used.

Checklist of common OO patterns (assuming that they really exist and are not just artifacts of the
world view of TypeScript...):
State - Implementations of CanTakePlayerRequests: InInitialPlacement, InNormalTurns, AfterVictory
Factory - The PieceFactory<T> class.
Observer - The various circles of callback hell between e.g. MutableHex and SettlementPiece and
           AuthenticatedPlayer.
Facade - The Game class.
Adaptor - I guess that InitialPlacementCommandParser is an adaptor around a Game which internally
          has an InInitialPlacement instance, and likewise NormalTurnsCommandParser.
Singleton - The CardBank should be a single object per game. Otherwise I am not a fan of classic
            Java-style global references to lazily-initialized objects. I prefer just organizing
            the program to enforce things like "there should be only one of these used by several
            other things".

Also, I completely underestimated how much work this would be. I spend an awful lot of time on code
to parse and validate player input, which was the least fun aspect of this project.

However, I did rather enjoy it. I always wanted to make video games.
