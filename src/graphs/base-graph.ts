import { G } from "@svgdotjs/svg.js";
import { Engine, MessagesObject } from "~/engine";
import { EngineGeneralControls } from "~/general-controls/engine-general-controls";
import { Graph } from "~/graph";
import { parseValues } from "~/helpers";
import { HighlightCircle } from "~/objects/highlight-circle";
import { WeightedGraphNode } from "~/objects/weightedgraph-node";
import { WeightedConnection } from "~/objects/weigted-connection";

export const BaseGraphMessages = {
    error: {
        nullGraph: "Please choose a graph first"
      , incorrectStart: (value: string, graph: string) => 
            `could not find ${value}; current start node is ${graph}`
    }
    , traversal: {
        atNode: (value: string) => `At node ${value}`
      , complete: "Done!"
    }
} as const satisfies MessagesObject

export class BaseGraph extends Engine implements Graph {
    edgeTable: G;
    graph: WeightedGraphNode | null = null;
    createdNodes: WeightedGraphNode[] = [];
    initialValues: (String | Number)[] = [];
    generalControls: EngineGeneralControls;

    constructor(containorSelector: string) {
        super(containorSelector)

        this.generalControls = new EngineGeneralControls(this.container, this)
        this.edgeTable = this.Svg.group()
       
    }

    async start() {
        //Only here because it's apart of the Graph interface
    }


async nodeTraversalVisualisation(
    graphTraversal: WeightedConnection<WeightedGraphNode>[]
) {
    let lastNode: WeightedGraphNode | null = null

    const knownEdges = new Set<WeightedConnection<WeightedGraphNode>>()
    const visitedEdges = new Set<WeightedConnection<WeightedGraphNode>>()

    let pointer: HighlightCircle | null = null

    for (let i = 0; i < graphTraversal.length;i++) {
        const edge = graphTraversal[i]
        const startNode = edge.$start
        
        // discover outgoing edges
        for (const currEdge of Object.values(startNode.$outgoing)) {
                if (currEdge && !visitedEdges.has(currEdge)) {
                    knownEdges.add(currEdge)
                }
            }
        this.updateEdgeTable(knownEdges,edge)
        if (lastNode !== startNode) {

            // create pointer on first visit
            if (!pointer) {
                pointer = this.Svg.put(new HighlightCircle()).init(
                    startNode.cx(),
                    startNode.cy(),
                    this.getObjectSize(),
                    this.getStrokeWidth()
                )
            } else {
                // animate pointer to node
                pointer.setCenter(
                    startNode.cx(),
                    startNode.cy(),
                    this.getAnimationSpeed()
                )
            }

            await this.pause(`traversal.atNode`, startNode.getText())
        }

        visitedEdges.add(edge)

        // remove edge from known edges
        knownEdges.delete(edge)
        

        const endNode = edge.$end
        // discover outgoing edges
        for (const currEdge of Object.values(endNode.$outgoing)) {
                if (currEdge && !visitedEdges.has(currEdge)) {
                    knownEdges.add(currEdge)
                }
            }
       

        //highlight the next edge
        if (i + 1 <= graphTraversal.length -1) {
            this.updateEdgeTable(knownEdges,graphTraversal[i+1])
        }
        else { 
        this.updateEdgeTable(knownEdges,edge)}


        // highlight the traversed edge
        edge.setHighlight(true)

        // animate pointer to next node
        pointer?.setCenter(
            endNode.cx(),
            endNode.cy(),
            this.getAnimationSpeed()
        )

        await this.pause("traversal.atNode", endNode.getText())

        lastNode = endNode
    }

    pointer?.remove()

    await this.pause("traversal.complete")
}

updateEdgeTable(knownEdges:Set<WeightedConnection<WeightedGraphNode>>, highlightEdge?:WeightedConnection<WeightedGraphNode>) {
    

    const columns = ["From", "To", "Weight"];
    const edges = knownEdges
    
    const cellHeight = 40;
    const cellWidth = 80;

    const startX = this.$Svg.width-cellWidth*columns.length;
    const startY = 0;
    
    // Clear previous content
    this.edgeTable.clear();

    this.drawRow(columns,0,startX,startY,cellWidth,cellHeight)

    let k = 0
     for (const edge of edges) {
        const currEdge = edge
        const rowData = [currEdge.$start.getText(),currEdge.$end.getText(),currEdge.$weight.toString()]
    
        
        this.drawRow(
            rowData,
            k + 1,
            startX,
            startY,
            cellWidth,
            cellHeight,
            edge === highlightEdge
        );
        k++
    }           

    this.Svg.add(this.edgeTable)
}

private drawRow(
    rowData: string[],
    rowIndex: number,
    startX: number,
    startY: number,
    cellWidth: number,
    cellHeight: number,
    highlight?: boolean
) {
    const rowY = startY + rowIndex * cellHeight;
    const rowWidth = rowData.length * cellWidth;

    // Create a group for the row
    const rowGroup = this.edgeTable.group();

    // Background highlight (CSS class)
    const rowRect = rowGroup
        .rect(rowWidth, cellHeight)
        .move(startX, rowY)

    if (highlight) rowRect.addClass('row-highlight');
    else rowRect.addClass("row-normal")

    // Send highlight to back so cells and text appear on top
    

    // Draw cells and text on top
    for (let col = 0; col < rowData.length; col++) {
        const x = startX + col * cellWidth;
        const y = rowY;

        rowGroup
            .rect(cellWidth, cellHeight)
            .move(x, y)
            .addClass('cell');

        rowGroup
            .text(rowData[col])
            .font({
                anchor: 'middle',
                leading: '1em',
                size: 14
            })
            .center(x + cellWidth / 2, y + cellHeight / 2);
    }
    rowRect.front();
    return rowGroup;
}

    async reset() {
        for (const k of this.createdNodes) {
            const inc = k.$incoming
            const out = k.$outgoing
            for (const c in inc) {
                inc[c]?.setHighlight(false)
            }
            for (const c in out) {
                out[c]?.setHighlight(false)
            }
            k.setHighlight(false)
        }
        this.graph?.setHighlight(true)
        this.edgeTable.clear()
    }

    async startNode(value: string | number) {
        this.graph?.setHighlight(false)
        for (const k of this.createdNodes) {
            if (k.getText() === value) {
                this.graph = k
                this.graph.setHighlight(true)
                return
            }
        }
        await this.pause("error.incorrectStart", value, this.graph?.getText())
        this.graph?.setHighlight(true)
    }

    async chosenGraph(graf: string | number) {
        if (graf === "") {
            await this.resetAlgorithm()
        } else if (graf === "Undirected") {
            await this.resetAlgorithm()
            this.undirectedGraph()
        } else if (graf === "Directed") {
            await this.resetAlgorithm()
            this.directedGraph()
        } else if (graf === "Tree") {
            await this.resetAlgorithm()
            this.treeGraph()
        } else if (graf === "Mixed") {
            await this.resetAlgorithm()
            this.mixedGraph()
        } else if (graf === "Cyclic") {
            await this.resetAlgorithm()
            this.cyclicGraph()
        } else if (graf === "aCyclic") {
            await this.resetAlgorithm()
            this.acyclicGraph()
        } else if (graf === "DAG") {
            await this.resetAlgorithm()
            this.DAGraph()
        } else if (graf === "Weakly") {
            await this.resetAlgorithm()
            this.weaklyConnectedGraph()
        } else if (graf === "Strongly") {
            await this.resetAlgorithm()
            this.stronglyConnectedGraph()
        } else if (graf === "Eulerian") {
            await this.resetAlgorithm()
            this.eulerianGraph()
        } else if (graf === "Hamiltonian") {
            await this.resetAlgorithm()
            this.hamiltonianGraph()
        } else if (graf === "Chordal") {
            await this.resetAlgorithm()
            this.chordalGraph()
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

        //the current code is just copied and pretty much does nothing
        this.initialValues = parseValues(initialValues);
        super.initialise()
        return this;
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

    async resetAlgorithm() {
        await super.resetAlgorithm();
        for (const k of this.createdNodes) {
            k.remove()
            for (const c in k.$incoming) {
                k.$incoming[c]?.remove()
                k.$incoming[c]?.$textObj.remove()
            }
            for (const c in k.$outgoing) {
                k.$outgoing[c]?.remove()
                k.$outgoing[c]?.$textObj.remove()
            }
        }
        this.createdNodes = []
        this.edgeTable.clear()
    }

    //This is just the connect function but i didn't wanna bother with
    //sending along a unique key to every node.
    private link(
        ourNode: WeightedGraphNode, 
        theirNode: WeightedGraphNode,
        weight: number,
        dir: string
    ): WeightedGraphNode {
        return ourNode.connect(theirNode.getText(), 
                               ourNode.getText(), 
                               theirNode, 
                               this.getStrokeWidth(), 
                               weight, 
                               dir)
    }

    //Puts a Node a 100(px not sure what unit we have) away from
    //another node at a degree(not radians!)
    //does not have animation implemented
    private putAtDeg(
        putNode: WeightedGraphNode,
        relativNode: WeightedGraphNode,
        degree: number,
        distance: number = 125,
        animation: boolean = false
    ): void {
        distance = distance*putNode.getSize()/40
        const degreé = Math.PI/180 * degree * (-1)
        const [relativX, relativY] = relativNode.getCenter()
        var ani = 0
        if (animation) ani = this.getAnimationSpeed();
        putNode.setCenter(
            relativX + distance*Math.cos(degreé),
            relativY + distance*Math.sin(degreé),
            ani
        )
    }

    //Implement default graphs below

    //New bug putAtDeg seems to cause issues if you redraw a graph (only in animation)
    private async bugExample() {
        const midW = this.$Svg.width/2
        const midH = this.$Svg.height/2
        const A = this.newNode("A")
        A.setCenter(midW, midH, this.getAnimationSpeed())
        await this.pause("example.here")
        const B = this.newNode("B")
        await this.pause("example.here")
        this.graph = A
        this.link(A, B, 2, "both")
        await this.pause("example.here")
        this.putAtDeg(B, A, 135, 125, true)
        await this.pause("example.here")
    }

    private undirectedGraph():WeightedGraphNode[] {
        // i am happy with this but feel free to add to it
        const midW = this.$Svg.width/2 - 200
        const midH = this.$Svg.height/2 + 100

        const A = this.newNode("A")
        const B = this.newNode("B")
        const C = this.newNode("C")
        const D = this.newNode("D")
        const E = this.newNode("E")
        const F = this.newNode("F")
        const G = this.newNode("G")
        const H = this.newNode("H")
        const I = this.newNode("I")
        const J = this.newNode("J")

        A.setCenter(midW, midH)
        this.graph = A

        this.putAtDeg(B, A, 135)
        this.link(A, B, 1, "both")

        this.putAtDeg(C, A, 0)
        this.link(A, C, 6, "both")
        
        this.putAtDeg(D, B, 45)
        this.link(C, D, 30, "both")
        this.link(B, D, 4, "both")
        this.link(A, D, 3, "both")

        this.putAtDeg(E, A, 225)
        this.link(E, A, 5, "both")

        this.putAtDeg(F, C, 45)
        this.link(F, C, 2, "both")

        this.putAtDeg(G, C, -45)
        this.link(G, C, 1, "both")
        this.link(G, F, 5, "both")

        this.putAtDeg(H, D, 0)
        this.link(D, H, 7, "both")
        this.link(H, C, 0, "both")

        this.putAtDeg(I, D, 135)
        this.link(I, D, 3, "both")

        this.putAtDeg(J, G, 45)
        this.link(G, J, 8, "both")

        return [A,B,C,D,E,F,G,H,I,J]
        
    }

    private directedGraph(): WeightedGraphNode[] {
        //copied the undirected graph and made it directed
        const midW = this.$Svg.width/2 - 200
        const midH = this.$Svg.height/2 + 100

        const A = this.newNode("A")
        const B = this.newNode("B")
        const C = this.newNode("C")
        const D = this.newNode("D")
        const E = this.newNode("E")
        const F = this.newNode("F")
        const G = this.newNode("G")
        const H = this.newNode("H")
        const I = this.newNode("I")
        const J = this.newNode("J")

        this.graph = A
        A.setCenter(midW, midH)
        
        this.putAtDeg(B, A, 135)
        this.link(A, B, 1, "from")

        this.putAtDeg(C, A, 0)
        this.link(A, C, 6, "from")
        
        this.putAtDeg(D, B, 45)
        this.link(C, D, 30, "to")
        this.link(B, D, 4, "to")
        this.link(A, D, 3, "from")

        this.putAtDeg(E, A, 225)
        this.link(E, A, 5, "to")

        this.putAtDeg(F, C, 45)
        this.link(F, C, 2, "from")

        this.putAtDeg(G, C, -45)
        this.link(G, C, 1, "from")
        this.link(G, F, 5, "from")

        this.putAtDeg(H, D, 0)
        this.link(D, H, 7, "to")
        this.link(H, C, 0, "from")

        this.putAtDeg(I, D, 135)
        this.link(I, D, 3, "from")

        this.putAtDeg(J, G, 45)
        this.link(G, J, 8, "to")
        
        return [A,B,C,D,E,F,G,H,I,J]
    }

    private mixedGraph(): WeightedGraphNode[] {
        //Looks pretty ugly if you've got suggestions please tell me
        //or feel free to make them yourself
        const midW = this.$Svg.width/2 - 100
        const midH = this.$Svg.height/2 + 100

        const A = this.newNode("A")
        const B = this.newNode("B")
        const C = this.newNode("C")
        const D = this.newNode("D")
        const E = this.newNode("E")
        const F = this.newNode("F")
        const G = this.newNode("G")
        const H = this.newNode("H")
        const I = this.newNode("I")
        const J = this.newNode("J")

        this.graph = A
        A.setCenter(midW, midH)

        this.putAtDeg(B, A, -90)
        this.link(A, B, 3, "to")

        this.putAtDeg(C, A, -30, 100)
        this.link(C, A, 2, "both")
        this.link(C, B, 4, "both")

        this.putAtDeg(D, A, -150, 100)
        this.link(D, A, 9, "to")

        this.putAtDeg(E, A, 90, 200)
        this.link(E, A, 0, "to")
        this.link(E, A, 1, "from")

        this.putAtDeg(F, A, 30)
        this.link(C, F, 6, "to")
        this.link(F, E, 4, "to")

        this.putAtDeg(G, F, 60)
        this.link(F, G, 7, "both")
        this.link(G, E, 3, "to")

        this.putAtDeg(H, E, 190)
        this.link(H, E, 2, "from")
        this.link(H, E, 8, "to")

        this.putAtDeg(I, H, 170)
        this.link(H, I, 5, "both")

        this.putAtDeg(J, H, 220)
        this.link(I, J, 2, "to")
        this.link(I, J, 3, "from")
        this.link(J, D, 2, "from")
        this.link(J, A, 1, "from")
        this.link(D, B, 4, "from")
        return [A,B,C,D,E,F,G,H,I,J]
    }

    private treeGraph(): WeightedGraphNode[] {
        const midW = this.$Svg.width/2 - 100
        const midH = this.$Svg.height/2 - 200

        const A = this.newNode("A")
        const B = this.newNode("B")
        const C = this.newNode("C")
        const D = this.newNode("D")
        const E = this.newNode("E")
        const F = this.newNode("F")
        const G = this.newNode("G")
        const H = this.newNode("H")
        const I = this.newNode("I")
        const J = this.newNode("J")
        const K = this.newNode("K")
        const L = this.newNode("L")
        const M = this.newNode("M")
        const N = this.newNode("N")

        A.setCenter(midW, midH)
        this.graph = A

        this.putAtDeg(B, A, -20, 150)
        this.putAtDeg(C, A, -160, 150)
        this.link(A, B, 10, "to")
        this.link(A, C, 10, "to")

        this.putAtDeg(D, B, -135, 100)
        this.putAtDeg(E, B, -45, 100)
        this.link(B, D, 10, "to")
        this.link(B, E, 10, "to")

        this.putAtDeg(F, C, -135, 125)
        this.putAtDeg(G, C, -45, 100)
        this.link(C, F, 10, "to")
        this.link(C, G, 10, "to")

        this.putAtDeg(H, F, -135, 100)
        this.putAtDeg(I, F, -45, 100)
        this.link(F, H, 10, "to")
        this.link(F, I, 10, "to")

        this.putAtDeg(J, G, -45, 100)
        this.link(G, J, 10, "to")

        this.putAtDeg(K, I, -100, 100)
        this.link(I, K, 10, "to")

        this.putAtDeg(L, K, -135, 100)
        this.putAtDeg(M, K, -45, 100)
        this.link(K, L, 10, "to")
        this.link(K, M, 10, "to")

        this.putAtDeg(N, D, -90, 100)
        this.link(D, N, 10, "to")
        
        return [A,B,C,D,E,F,G,H,I,J,K,L,M,N]
    }

    private cyclicGraph(): WeightedGraphNode[] {
        //Neutered sign
        const midW = this.$Svg.width/2 + 100
        const midH = this.$Svg.height/2 - 25

        const A = this.newNode("A")
        const B = this.newNode("B")
        const C = this.newNode("C")
        const D = this.newNode("D")
        const E = this.newNode("E")
        const F = this.newNode("F")
        const G = this.newNode("G")
        const H = this.newNode("H")
        const I = this.newNode("I")
        const J = this.newNode("J")
        const K = this.newNode("K")

        this.graph = A
        A.setCenter(midW, midH)

        this.link(A, B, 1, "to")
        this.putAtDeg(B, A, 135)

        this.link(B, C, 2, "to")
        this.putAtDeg(C, B, 180)

        this.link(C, D, 3, "to")
        this.putAtDeg(D, C, 225)

        this.link(D, E, 4, "to")
        this.putAtDeg(E, D, 270)
        
        this.link(E, F, 5, "to")
        this.putAtDeg(F, E, 315)

        this.link(F, G, 6, "to")
        this.link(F, B, 14, "both")
        this.putAtDeg(G, F, 0)

        this.link(G, H, 7, "to")
        this.putAtDeg(H, G, 45)

        this.link(H, A, 8, "to")

        this.link(D, I, 9, "both")
        this.putAtDeg(I, D, 100)

        this.link(I, J, 10, "both")
        this.putAtDeg(J, I, 202)

        this.link(J, K, 11, "both")
        this.link(J, D, 12, "to")
        this.putAtDeg(K, D, 220)

        this.link(K, D, 13, "both")


        return [A,B,C,D,E,F,G,H,I,J,K]
    }

    private acyclicGraph(): WeightedGraphNode[] {
        //Somewhat basic
        const midW = this.$Svg.width/2 - 100
        const midH = this.$Svg.height/2 + 100

        const A = this.newNode("A")
        const B = this.newNode("B")
        const C = this.newNode("C")
        const D = this.newNode("D")
        const E = this.newNode("E")
        const F = this.newNode("F")
        const G = this.newNode("G")
        const H = this.newNode("H")

        this.graph = A
        A.setCenter(midW, midH)
        
        this.link(A, B, 4, "from")
        this.putAtDeg(B, A, 135)

        this.link(A, C, 7, "from")
        this.putAtDeg(C, A, 45)

        this.link(D, B, 6, "to")
        this.link(D, B, 3, "from")
        this.putAtDeg(D, B, 90)

        this.link(E, C, 5, "to")
        this.link(E, C, 7, "from")
        this.link(E, D, 2, "both")
        this.putAtDeg(E, C, 90)

        this.link(F, A, 9, "from")
        this.putAtDeg(F, A, -90)

        this.link(G, F, 1, "to")
        this.putAtDeg(G, F, 180)

        this.link(H, F, 1, "from")
        this.putAtDeg(H, F, 0)

        return [A,B,C,D,E,F,G,H]
    }

    private DAGraph(): WeightedGraphNode[] {
        const midW = this.$Svg.width/2 - 300
        const midH = this.$Svg.height/2 - 150

        const A = this.newNode("A")
        const B = this.newNode("B")
        const C = this.newNode("C")
        const D = this.newNode("D")
        const E = this.newNode("E")
        const F = this.newNode("F")
        const G = this.newNode("G")
        const H = this.newNode("H")

        this.graph = A
        A.setCenter(midW, midH)

        this.link(B, A, 2, "from")
        this.putAtDeg(B, A, -90)

        this.link(C, A, 2, "from")
        this.putAtDeg(C, A, -45)

        this.link(D, B, 8, "from")
        this.link(D, C, 4, "from")
        this.putAtDeg(D, C, -20)

        this.link(E, B, 5, "from")
        this.putAtDeg(E, B, -20)

        this.link(F, E, 2, "from")
        this.link(F, D, 4, "from")
        this.putAtDeg(F, D, -80)

        this.link(G, B, 3, "from")
        this.link(G, F, 6, "from")
        this.putAtDeg(G, B, -90, 140)

        this.link(H, F, 2, "from")
        this.link(H, G, 1, "to")
        this.putAtDeg(H, F, -150)

        return [A,B,C,D,E,F,G,H]
    }

    private weaklyConnectedGraph(): WeightedGraphNode[] {
        //Somewhat small but I thought it might be better to
        //focus on it being weakly connected
        const midW = this.$Svg.width/2 - 100
        const midH = this.$Svg.height/2 + 150

        const A = this.newNode("A")
        const B = this.newNode("B")
        const C = this.newNode("C")
        const D = this.newNode("D")
        const E = this.newNode("E")

        this.graph = A
        A.setCenter(midW, midH)

        this.link(B, A, 1, "to")
        this.putAtDeg(B, A, 80)

        this.link(C, B, 3, "to")
        this.putAtDeg(C, B, 110)

        this.link(D, A, 5, "from")
        this.link(D, B, 2, "from")
        this.putAtDeg(D, A, 20)

        this.link(E, C, 1, "from")
        this.link(E, A, 3, "to")
        this.putAtDeg(E, C, -120)

        return [A,B,C,D,E]
    }

    private stronglyConnectedGraph(): WeightedGraphNode[] {
        //Somewhat small but I thought it might be better to
        //focus on it being strongly connected
        const midW = this.$Svg.width/2 - 100
        const midH = this.$Svg.height/2 + 150

        const A = this.newNode("A")
        const B = this.newNode("B")
        const C = this.newNode("C")
        const D = this.newNode("D")
        const E = this.newNode("E")

        this.graph = A
        A.setCenter(midW, midH)

        this.link(B, A, 1, "from")
        this.putAtDeg(B, A, 80)

        this.link(C, B, 3, "to")
        this.putAtDeg(C, B, 110)

        this.link(D, A, 5, "from")
        this.link(D, B, 2, "from")
        this.putAtDeg(D, A, 20)

        this.link(E, C, 1, "from")
        this.link(E, A, 3, "to")
        this.putAtDeg(E, C, -120)

        return [A,B,C,D,E]
    }

    private eulerianGraph(): WeightedGraphNode[] {
        const midW = this.$Svg.width/2 - 100
        const midH = this.$Svg.height/2

        const A = this.newNode("A")
        const B = this.newNode("B")
        const C = this.newNode("C")
        const D = this.newNode("D")
        const E = this.newNode("E")
        const F = this.newNode("F")

        this.graph = A
        A.setCenter(midW, midH)

        this.link(B, A, 1, "from")
        this.putAtDeg(B, A, -120)

        this.link(C, A, 3, "from")
        this.link(C, B, 2, "to")
        this.link(C, B, 3, "from")
        this.putAtDeg(C, A, -60)

        this.putAtDeg(D, A, 90)

        this.link(E, C, 4, "from")
        this.link(E, D, 9, "from")
        this.link(E, D, 4, "to")
        this.link(E, A, 6, "to")
        this.putAtDeg(E, C, 45)

        this.link(F, B, 5, "from")
        this.link(F, D, 6, "from")
        this.link(F, D, 7, "to")
        this.link(F, A, 8, "to")
        this.putAtDeg(F, B, 135)

        return [A,B,C,D,E,F]
    }

    private hamiltonianGraph(): WeightedGraphNode[] {
        //Very simple could probably be expanded
        const midW = this.$Svg.width/2 - 150
        const midH = this.$Svg.height/2

        const A = this.newNode("A")
        const B = this.newNode("B")
        const C = this.newNode("C")
        const D = this.newNode("D")
        const E = this.newNode("E")

        this.graph = A
        A.setCenter(midW, midH)

        this.link(B, A, 1, "to")
        this.putAtDeg(B, A, 135)

        this.link(C, B, 5, "from")
        this.link(C, A, 1, "to")
        this.putAtDeg(C, A, 45)

        this.link(D, C, 3, "from")
        this.link(D, A, 1, "to")
        this.putAtDeg(D, A, -45)

        this.link(E, D, 9, "from")
        this.link(E, B, 8, "to")
        this.link(E, A, 1, "to")
        this.putAtDeg(E, A, -135)

        return [A,B,C,D,E]
    }

    private chordalGraph(): WeightedGraphNode[] {
        const midW = this.$Svg.width/2 - 200
        const midH = this.$Svg.height/2 + 50

        const A = this.newNode("A")
        const B = this.newNode("B")
        const C = this.newNode("C")
        const D = this.newNode("D")
        const E = this.newNode("E")
        const F = this.newNode("F")
        const G = this.newNode("G")
        const H = this.newNode("H")
        const I = this.newNode("I")
        const J = this.newNode("J")
        const K = this.newNode("K")
        const L = this.newNode("L")

        A.setCenter(midW, midH)
        this.graph = A

        this.link(B, A, 1, "both")
        this.putAtDeg(B, A, -10)

        this.link(C, A, 1, "both")
        this.link(C, B, 1, "both")
        this.putAtDeg(C, A, 50)

        this.link(D, A, 2, "from")
        this.putAtDeg(D, A, -90)

        this.link(E, D, 4, "from")
        this.link(E, A, 1, "from")
        this.putAtDeg(E, D, 170)

        this.link(F, E, 7, "from")
        this.link(F, A, 2, "from")
        this.putAtDeg(F, E, 120)

        this.link(G, F, 5, "from")
        this.link(G, A, 3, "to")
        this.putAtDeg(G, F, 60)

        this.link(H, B, 4, "from")
        this.putAtDeg(H, B, -80)

        this.link(I, H, 1, "from")
        this.link(I, B, 7, "from")
        this.putAtDeg(I, H, 45)

        this.link(J, I, 6, "from")
        this.link(J, B, 4, "to")
        this.putAtDeg(J, I, 110)

        this.link(K, C, 2, "from")
        this.putAtDeg(K, C, 70)

        this.link(L, K, 1, "from")
        this.link(L, C, 3, "to")
        this.putAtDeg(L, K, 190)

        return [A,B,C,D,E,F,G,H,I,J,K,L]
    }    
}