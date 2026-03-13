import { MessagesObject } from "~/engine";
import { Graph } from "~/graph";
import { WeightedGraphNode } from "~/objects/weightedgraph-node";
import { WeightedConnection } from "~/objects/weigted-connection";
import { GraphNode } from "~/objects/graph-node";
import { BaseGraph } from "./base-graph";

export const DepthMessages = {
    error: {
        nullGraph: "Please choose a graph first"
    }
    //the messages we put somewhere on the canvas
    //to be implemented I think this is in the form of json file
    //seems to be used when you put "this.pause(example.here)"
} as const satisfies MessagesObject

export class Depth extends BaseGraph implements Graph {
    messages: MessagesObject = DepthMessages;

    override async start() {
        if (!this.graph) {
            await this.pause("error.nullGraph")
            return
        }
        const result = this.searchGraph(this.graph)
        console.log(result)
        await this.nodeTraversalVisualisation(result)
    }


    async nodeTraversalVisualisation(graphTraversal:WeightedConnection<WeightedGraphNode>[]) {
        
        let currNode:WeightedGraphNode
        let lastNode:WeightedGraphNode | null = null
        const knownEdges:Set<WeightedConnection<WeightedGraphNode>> = new Set
        const visitedEdges:Set<WeightedConnection<WeightedGraphNode>> = new Set
    
        for (const edge of graphTraversal) {
            currNode = edge.$start
            currNode.setHighlight(true)

            for (const key in currNode.$outgoing) {
                const currEdge = currNode.$outgoing[key]
                
                if (!currEdge) continue
                if (!visitedEdges.has(currEdge)) {
                    knownEdges.add(currEdge)

                }
                
            }
            this.updateEdgeTable(knownEdges)
            await this.pause(`At node ${currNode.getText()}`)
            lastNode?.setHighlight(false)
            
            visitedEdges.add(edge)

            if (currNode === lastNode) { 
                //this skips the needs for extra userinput when you go from A->B B->C 
                lastNode = currNode
            }
            else {
                //Sets highlight to start of edge
                
                currNode.setHighlight(false)
            }

            //remove edge from edgetable
            knownEdges.delete(edge)
            this.updateEdgeTable(knownEdges)

            //Sets highlight to end of edge
            edge.setHighlight(true)
            currNode = edge.$end
            currNode.setHighlight(true)
            lastNode = currNode
        }

        await this.pause("Done!")
    }

 




    //search through the graph starting from "startNode". returns a list of chronological order of traversal
    searchGraph(startNode:WeightedGraphNode):WeightedConnection<WeightedGraphNode>[] {
        const visitedNodes: WeightedGraphNode[] = []
        const result:WeightedConnection<WeightedGraphNode>[] = []
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

    //Want the eventual algorithm to call this every it takes a "step"
    updateEdgeTable(knownEdges:Set<WeightedConnection<WeightedGraphNode>>) {
    

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
            cellHeight
        );
        k++
    }           

    this.Svg.add(this.edgeTable)
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

        this.edgeTable
            .rect(cellWidth, cellHeight)
            .move(x, y);

        this.edgeTable
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