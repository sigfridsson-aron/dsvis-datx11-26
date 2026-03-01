import { parseValues } from "~/helpers";
import { Engine, MessagesObject } from "~/engine";
import { EngineGeneralControls } from "~/general-controls/engine-general-controls";
import { Graph } from "~/graph";
import { G } from "@svgdotjs/svg.js";
import { WeightedGraphNode } from "~/objects/weightedgraph-node";
import { WeightedConnection } from "~/objects/weigted-connection";
import { GraphNode } from "~/objects/graph-node";

export const DepthMessages = {
    example: {
        here: "test"
    }
    //the messages we put somewhere on the canvas
    //to be implemented I think this is in the form of json file
    //seems to be used when you put "this.pause(example.here)"
} as const satisfies MessagesObject

export class Depth extends Engine implements Graph {
    graph: WeightedGraphNode | null = null;
    edgeTableGroup: G 
    createdNodes: WeightedGraphNode[] = []
    initialValues: (String | Number)[] = [];
    messages: MessagesObject = DepthMessages;
    generalControls: EngineGeneralControls;
    allEdges:WeightedConnection<WeightedGraphNode>[] = []
    
    



    constructor(containorSelector: string) {
        super(containorSelector)
        //general controls are the buttons on the bottom
        //so we create our own general if we want to change those
        this.generalControls = new EngineGeneralControls(this.container, this)
        this.edgeTableGroup = this.Svg.group()
        this.edgeTableGroup.addClass("edge-table")
        
        
    }

    async start() {
        this.generalControls.setRunning(true)
        const nodes =this.directedGraph()
        
        this.allEdges = this.getEdges(nodes)
        const result = this.searchGraph(nodes[2])
        console.log(result)
       
        await this.nodeTraversalVisualisation(result)
    }


    async nodeTraversalVisualisation(graphTraversal:WeightedConnection<GraphNode>[]) {
        this.generalControls.setRunning(false)
        let currNode:GraphNode
        let lastNode:GraphNode | null = null
        
        
    
        for (const edge of graphTraversal) {
            
            currNode = edge.$start
            
            if (currNode === lastNode) { 
                lastNode = currNode
            
            }
            else {
                currNode.setHighlight(true)
                await this.pause("the same node twice in a row")
                currNode.setHighlight(false)
            }

            edge.setHighlight(true)
            currNode = edge.$end
            currNode.setHighlight(true)
            await this.pause("i am here now")
            currNode.setHighlight(false)
            lastNode = currNode
            

        }
    }





    //search through the graph starting from "startNode". returns a list of chronological order of traversal
    searchGraph(startNode:WeightedGraphNode):WeightedConnection<GraphNode>[] {
        const visitedNodes: WeightedGraphNode[] = []
        const result:WeightedConnection<GraphNode>[] = []
        this.searchGraphRecursion(startNode,visitedNodes,result)
        return result
        

    }



    private searchGraphRecursion(currNode:WeightedGraphNode,visitedNodes:WeightedGraphNode[],result:WeightedConnection<GraphNode>[]):void {
        
        if (!currNode) {
            throw new Error("start node doesnt exist")
        }
        
        visitedNodes.push(currNode)
        
        const edges = this.getEdges([currNode])
        for (let i = 0; i < edges.length;i++) {
            const connectedNode = edges[i].$end
            if (!visitedNodes.includes(connectedNode)) {
                


              
                result.push(edges[i])
                this.searchGraphRecursion(connectedNode, visitedNodes,result)
                

            }
        }



    } 








    async chosenGraph(graf: string | number) {
        if (graf === "") {
            await this.resetAlgorithm()
        } else if (graf === "Undirected") {
            await this.resetAlgorithm()
            this.pause("")
            this.undirectedGraph()
        } else if (graf === "Directed") {
            await this.resetAlgorithm()
            this.pause("")
            this.directedGraph()
        } else {
            await this.resetAlgorithm()
            this.Svg.text("You are WRONG!")
            .center(this.$Svg.width/10, this.$Svg.height/2)
            .font({ size: 100 })
            .stroke({ color: "#f44444", width: 5 })
            this.Svg.text("also ERROR!")
            .center(this.$Svg.width/10, this.$Svg.height/2 + 100)
            .font({ size: 10 })
            .stroke({ color: "#f44444", width: 0.5 })
        }
    }

    initialise(initialValues: string[] | null = null): this {
        //initialValues will probably only be used if we can make it so
        //that you can construct your own graph, in other classes it's
        //used like this.initialise(["k"]) and you start with a k node
        this.initialValues = parseValues(initialValues);
        super.initialise()
        return this;
    }

    //Currently only works if each node has a connection to another node
    //for example it would not find a node with an empty $outgoing
    //and empty $incoming
    async resetAlgorithm() {
        await super.resetAlgorithm();
        this.resetHelp(this.graph, new Set<WeightedGraphNode>)
    }

    resetHelp(resetter: WeightedGraphNode | null,
              visited: Set<WeightedGraphNode>
    ): void {
        if (!resetter || visited.has(resetter)) {
            return;
        }

        visited.add(resetter)

        const inp = resetter.$incoming
        const out = resetter.$outgoing
        resetter.remove()

        for (const k in inp) {
            if (inp[k]) {
                this.resetHelp(inp[k].getStart(), visited)
                inp[k].remove()
                inp[k].$textObj.remove()
            }
        }
        for (const k in out) {
            if (out[k]) {
                this.resetHelp(out[k].getStart(), visited)
                out[k].remove()
                out[k].$textObj.remove()
            }
        }
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

    //This is just the connect function but i didn't wanna bother with
    //sending along a unique key to every node.
    link(
        ourNode: WeightedGraphNode, 
        theirNode: WeightedGraphNode,
        weight: number,
        dir: string
    ): void {
        ourNode.connect(theirNode.getText(), 
                        ourNode.getText(), 
                        theirNode, 
                        this.getStrokeWidth(), 
                        weight, 
                        dir)
    }

    //Puts a Node a 100(px not sure what unit we have) away from
    //another node at a degree(not radians!)
    //does not have animation implemented
    putAtDeg(
        putNode: WeightedGraphNode,
        relativNode: WeightedGraphNode,
        degree: number
    ): void {
        const degreé = Math.PI/180 * degree * (-1)
        const [relativX, relativY] = relativNode.getCenter()
        putNode.setCenter(
            relativX + 125*Math.cos(degreé),
            relativY + 125*Math.sin(degreé)
        )
    }

    //Implement default graphs below

    //TODO immplement mixed(both directed and undirected),
    // cyclic, acyclic, DAG (directed acyclic), connected (strongly, weakly), 
    // disconnected, tournament, eulerian, hamiltonian, chordal and complete
    // directed graphs

    //If we ever want to animate adding to graphs we would need to
    //adress this bug, run the code to se it.





    bugExample(): void {
        const midW = this.$Svg.width/2
        const midH = this.$Svg.height/2
        const A = this.newNode("A")
        A.setCenter(midW, midH, this.getAnimationSpeed())
        const B = this.newNode("B")
        this.pause("")
        this.graph = A
        this.putAtDeg(B, A, 135)
        this.link(A, B, 2, "both")
        this.pause("")
    }

    undirectedGraph():WeightedGraphNode[] { // i am happy with this but feel free to add to it
        const midW = this.$Svg.width/2
        const midH = this.$Svg.height/2

        const A = this.newNode("A")
        const B = this.newNode("B")
        const C = this.newNode("C")
        const D = this.newNode("D")
        const E = this.newNode("E")
        const F = this.newNode("F")
        const G = this.newNode("G")

        this.graph = A
        A.setCenter(midW, midH)
        this.link(A, B, 1, "both")
        this.putAtDeg(B, A, 135)

        this.link(A, C, 666, "both")
        this.putAtDeg(C, A, 0)
        this.link(C, D, 30, "both")

        this.link(B, D, 4, "both")
        this.putAtDeg(D, B, 45)
        this.link(A, D, 3, "both")

        this.putAtDeg(E, A, 225)
        this.link(E, A, 5, "both")

        this.putAtDeg(F, C, 45)
        this.link(F, C, 2, "both")

        this.putAtDeg(G, C, -45)
        this.link(G, C, 1, "both")
        this.link(G, F, 5, "both")
        return [A,B,C,D,E,F,G]
        
    }

    directedGraph():WeightedGraphNode[] { //copied the undirected graph and made it directed
        const midW = this.$Svg.width/2
        const midH = this.$Svg.height/2

        const A = this.newNode("A")
        const B = this.newNode("B")
        const C = this.newNode("C")
        const D = this.newNode("D")
        const E = this.newNode("E")
        const F = this.newNode("F")
        const G = this.newNode("G")

        this.graph = A
        A.setCenter(midW, midH)
        this.link(A, B, 1, "from")
        this.putAtDeg(B, A, 135)

        this.link(A, C, 666, "from")
        this.putAtDeg(C, A, 0)
        this.link(C, D, 30, "to")

        this.link(B, D, 4, "to")
        this.putAtDeg(D, B, 45)
        this.link(A, D, 3, "from")

        this.putAtDeg(E, A, 225)
        this.link(E, A, 5, "to")

        this.putAtDeg(F, C, 45)
        this.link(F, C, 2, "to")

        this.putAtDeg(G, C, -45)
        this.link(G, C, 1, "from")
        this.link(G, F, 5, "to")
        
        
        return [A,B,C,D,E,F,G]
    }

    mixedGraph(): WeightedGraphNode[] { //unfinished
        const midW = this.$Svg.width/2
        const midH = this.$Svg.height/2

        const A = this.newNode("A")
        const B = this.newNode("B")
        const C = this.newNode("C")
        const D = this.newNode("D")
        const E = this.newNode("E")

        this.graph = A
        this.link(A, B, 4, "to")
        A.setCenter(midW, midH)
        this.link(A, B, 3, "from")
        B.setCenter(midW + 100, midH)
        this.link(A, C, 5, "to")
        C.setCenter(midW - 100, midH)
        this.link(A, D, 11, "from")
        D.setCenter(midW, midH + 100)
        this.link(A, E, 1, "both")
        E.setCenter(midW, midH - 100)
        return [A,B,C,D,E]
    }



    

    //Want the eventual algorithm to call this every it takes a "step"
    updateEdgeTable() {
    

    const columns = ["From", "To", "Weight"];
    const edges = this.allEdges
    
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







//returns all outgoing edges from the provided nodes
private getEdges(nodes:WeightedGraphNode[]):WeightedConnection<WeightedGraphNode>[] {
    const edges:WeightedConnection<WeightedGraphNode>[] = []
    for (const node of nodes) {
        for (const key in node.$outgoing) {
            
            const edge = node.$outgoing[key];
            
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