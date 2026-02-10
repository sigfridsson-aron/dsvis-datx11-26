import { Engine, MessagesObject } from "~/engine";
import { EngineGeneralControls } from "~/general-controls/engine-general-controls";
import { Graph } from "~/graph";

export const DepthMessages = {
    example: {
        here: "test"
    }
    //the messages we put somewhere on the canvas
    //to be implemented I think this is in the form of json file
    //seems to be used when you put "this.pause(example.here)"
    //that should put "test" but i have nowhere to test this
    //think we need to initialize before we can put anything
} as const satisfies MessagesObject

export class Depth extends Engine implements Graph {
    messages: MessagesObject = DepthMessages;
    generalControls: EngineGeneralControls;

    constructor(containorSelector: string) {
        super(containorSelector)


        //general controls are the buttons on the bottom
        //so we create our own general if we want to change those
        this.generalControls = new EngineGeneralControls(this.container, this)
    }

    async start() {
        //placeholder to check if i can add buttons
    }

    initialise(): void {
        //probably used to put our graf on canvas and reset
        //from previous algorithms
    }

    async resetAlgorithm() {
        await super.resetAlgorithm();
        //I think this is used to reset canvas when we go from example
        //depth-first to breadth-first
    }
}