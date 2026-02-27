import { parseValues } from "~/helpers";
import { Engine, MessagesObject } from "~/engine";
import { EngineGeneralControls } from "~/general-controls/engine-general-controls";
import { Graph } from "~/graph";
import { GraphNode } from "~/objects/graph-node";
import { G } from "@svgdotjs/svg.js";
import { Rect } from "@svgdotjs/svg.js";
import { WeightedGraphNode } from "~/objects/weightedgraph-node";
import { WeightedConnection } from "~/objects/weigted-connection";


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
   
    edgeTableGroup: G 
    createdNodes: WeightedGraphNode[] = []



    initialValues: (String | Number)[] = [];
    messages: MessagesObject = DepthMessages;
    generalControls: EngineGeneralControls;

    constructor(containorSelector: string) {
        super(containorSelector)
        //general controls are the buttons on the bottom
        //so we create our own general if we want to change those
        this.generalControls = new EngineGeneralControls(this.container, this)
        this.edgeTableGroup = this.Svg.group()
        this.edgeTableGroup.addClass("edge-table")
        
    }

    async start() {
        
        
         const testNode1 = this.newNode("testHEJHEJ").setCenter(this.$Svg.width/2,this.$Svg.height/2)
        const testNode2 = this.newNode("test213").setCenter(this.$Svg.width/2 -100,this.$Svg.height/2 - 100)
        const testNode3 = this.newNode("senasteNoden").setCenter(this.$Svg.width/2 + 100,this.$Svg.height/2 + 100)
        testNode3.connect("1","3",testNode1,this.getStrokeWidth(),13,"to")
        testNode1.connect("1","1",testNode2,this.getStrokeWidth(),10,"both")
        

        this.updateEdgeTable([testNode1,testNode2,testNode3])


        
        
       
       

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
    newNode(text: string): WeightedGraphNode {
        const newNode = new WeightedGraphNode(text, this.getObjectSize(), this.getStrokeWidth())
        this.createdNodes.push(newNode)
        return this.Svg.put(
            newNode
        ).init(...this.getNodeStart());
    }



    

    //Want the eventual algorithm to call this every it takes a "step"
    updateEdgeTable(createdNodes:WeightedGraphNode[]) {
    

    const columns = ["From", "To", "Weight"];
    const edges = this.getAllEdges(createdNodes)
    const rows = edges.length + 1; // including header
    
    const cellHeight = 40;
    const cellWidth = 80;

    const startX = this.$Svg.width-cellWidth*columns.length;
    const startY = 0;
    
    // Clear previous content
    this.edgeTableGroup.clear();

    this.drawRow(columns,0,startX,startY,cellWidth,cellHeight)
     for (let i = 0; i < edges.length; i++) {
        const currEdge = edges[i]
        const rowData = [currEdge.$start.getText(),currEdge.$end.getText(),currEdge.$weight.toString()]
    

        this.drawRow(
            rowData,
            i + 1,
            startX,
            startY,
            cellWidth,
            cellHeight
        );
    }           


    
    this.Svg.add(this.edgeTableGroup)
}

private getAllEdges(createdNodes:WeightedGraphNode[]):WeightedConnection<WeightedGraphNode>[] {
    const edges:WeightedConnection<WeightedGraphNode>[] = []
    for (const node of createdNodes) {
        for (const key of node.$outGoingKeys) {

            const edge = node.$outgoing[key];
            console.log(key)
            if (!edge) continue;

            edges.push(edge);
        }
    }
    return edges

}

private drawRow(
    rowData: string[],
    rowIndex: number,
    startX: number,
    startY: number,
    cellWidth: number,
    cellHeight: number
) {
    for (let col = 0; col < rowData.length; col++) {

        const x = startX + col * cellWidth;
        const y = startY + rowIndex * cellHeight;

        this.edgeTableGroup
            .rect(cellWidth, cellHeight)
            .move(x, y);

        this.edgeTableGroup
            .text(rowData[col])
            .font({
                anchor: 'middle',
                leading: '1em',
                size: 14
            })
            .center(x + cellWidth / 2, y + cellHeight / 2);
    }
}



}