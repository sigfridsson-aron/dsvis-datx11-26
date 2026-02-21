import { parseValues } from "~/helpers";
import { Engine, MessagesObject } from "~/engine";
import { EngineGeneralControls } from "~/general-controls/engine-general-controls";
import { Graph } from "~/graph";
import { GraphNode } from "~/objects/graph-node";

/********************code to understand Path type**********************/
// const pathString = `M 0,0 L ${
//     s * nX
// },${nY} m ${nR},0 a ${nR},${nR} 0 1,0 ${
//     -2 * nR
// },0 a ${nR},${nR} 0 1,0 ${2 * nR},0`;
// explanation of pathString
// M 0,0 move to 0,0 (start at node)
// L ${s'nX},${nY} draw a line from 0,0 to s*nX,nY
// m ${nR},0 move (relative to where you left) 
// to nR,0 i.e +nR in the x-axis
// a ${nR},{nR} 0(rotation) 1(large arc),0(counterclock) ${-2*nR},0 
// this command is draw an arc of a circle with x radius nR
// and y-radius nR(the circle would be an elipse if y and x differ)
// this arc should not be rotated, take the long way there(i don't
// fully understand this) and go counterclockwise. Draw from where
// you are to 2*nR,0

//other commands
//l (dx, dy)-draw a line from where you were(x, y) to (x+dx, y+dy)
//H, h- draws line only using x
//V, v- draws line only using y
//C, c, S, s - draws cubic bezier curves (I doubt we'll use this)
//Q, q, T, t - draws quadratic bezier curves (doubt we'll use this too)
//A - same as a but from current point to set coordinates
//Z, z - goes from current point to initial point (fills in gaps too i think)
/********************code to understand Path type**********************/

export const DepthMessages = {
    example: {
        here: "test"
    }
    //the messages we put somewhere on the canvas
    //to be implemented I think this is in the form of json file
    //seems to be used when you put "this.pause(example.here)"
    //current start uses the example
} as const satisfies MessagesObject

export class Depth extends Engine implements Graph {
    graph: GraphNode | null = null;
    initialValues: (String | Number)[] = [];
    messages: MessagesObject = DepthMessages;
    generalControls: EngineGeneralControls;

    constructor(containorSelector: string) {
        super(containorSelector)
        //general controls are the buttons on the bottom
        //so we create our own general if we want to change those
        this.generalControls = new EngineGeneralControls(this.container, this)
    }

    async start() {
        await this.pause("example.here")
        this.graph = this.newNode("K")
        this.graph.center(this.$Svg.width/2, this.$Svg.height/2)
        const test = this.newNode("A")
        //setPredecessor adds an arrow from the predecessor to the node
        //it was called from
        //setSuccessor adds an arrow from the node it was called
        //to the successor
        //The first 2 variables you call with setSuccessor stand for
        //first variable, outkey which will structure like (outkey, successor)
        //in a the outgoing record, so if 2 successors have the same outkey 
        //they will delete the old one.
        //second, inkey which is structured like (inkey, node you called from)
        //in the record for incoming in the successor(which is the third
        //variable), so if the successor already has an incomming with
        //the same key it will delete it.
        this.graph.setPredecessor("1", "1", test, this.getStrokeWidth())
        this.graph.setSuccessor("1", "1", test, this.getStrokeWidth())
        this.graph.getSuccessor("1")?.setCenter(this.$Svg.width/2-100, this.$Svg.height/2-100, 1)
    }

    initialise(initialValues: string[] | null = null): this {
        //initialValues will probably only be used if we can make it so
        //that you can construct your own graph, in other classes it's
        //used like this.initialise(["k"]) and you start with a k node
        this.initialValues = parseValues(initialValues);
        super.initialise()
        return this;
    }

    async resetAlgorithm() {
        await super.resetAlgorithm();
        //I think this is used to reset canvas when we go from example
        //depth-first to breadth-first

        //in our case we will probably use the same graph for most algorithms
        //so we would probably only need to remove highlighted paths from the 
        //graph in this function
    }

    //defines a new Node object and puts it under where messages
    //are, will not define connections to different nodes.
    newNode(text: string): GraphNode {
        return this.Svg.put(
            new GraphNode(text, this.getObjectSize(), this.getStrokeWidth())
        ).init(...this.getNodeStart());
    }
}