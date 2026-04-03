import { MessagesObject } from "~/engine";
import { BaseGraph, BaseGraphMessages, tableInformation } from "./base-graph";
import { Graph } from "~/graph";
import { updateDefault } from "~/helpers";
import { WeightedConnection } from "~/objects/weigted-connection";
import { WeightedGraphNode } from "~/objects/weightedgraph-node";
import Queue from "~/basic/Queue"
import { HighlightCircle } from "~/objects/highlight-circle";
import { GraphNode } from "~/objects/graph-node";

export const BreadthMessages = {
    traversal: {
        chooseEdge: (value: string) => `Exploring all of ${value}'s edges`
    }
} as const satisfies MessagesObject

export class Breadth extends BaseGraph implements Graph {
    messages: MessagesObject = updateDefault(BreadthMessages, BaseGraphMessages)
    private graphTraversal: WeightedConnection<WeightedGraphNode>[] = [];

    override async start() {
        if (!this.graph) {
            await this.pause("error.nullGraph")
            return
        }
        this.graph.setHighlight(false)
        this.graphTraversal = this.breadthSearch()
        await this.nodeTraversalVisualisation()
        this.graph.setHighlight(true)
    }

    breadthSearch(): WeightedConnection<WeightedGraphNode>[] {
        const visitOrder: Queue<WeightedGraphNode> = new Queue();
        const edges: WeightedConnection<WeightedGraphNode>[] = [];
        const visitedNodes = new Set<WeightedGraphNode>()

        visitOrder.enqueue(this.graph!)

        while(visitOrder.size() > 0) {
            const currNode  = visitOrder.dequeue()
            const currEdges = currNode?.$outgoing
            visitedNodes.add(currNode!)

            if (!currEdges) continue

            for (const k of Object.values(currEdges)) {
                if (visitedNodes.has(k!.$end)) 
                    continue
                visitOrder.enqueue(k!.$end)
                edges[edges.length] = k!
                visitedNodes.add(k!.$end)
            }
        }
        return edges
    }



    async nodeTraversalVisualisation() {
        if(this.graphTraversal.length === 0) {
            await this.pause("traversal.start", this.graph!.getText())
            await this.pause("traversal.edgeUpdate", this.graph!.getText())
            await this.pause("traversal.complete")
            return
        }

        let lastNode: WeightedGraphNode | null = null

        const knownEdges = new Set<tableInformation>
        const visitedEdges = new Set<WeightedConnection<WeightedGraphNode>>()
        const visitedNodes = new Set<GraphNode>()

        let pointer: HighlightCircle | null = null

        const firstNode = this.graphTraversal[0].$start

        pointer = this.Svg.put(new HighlightCircle()).init(
                        firstNode.cx(),
                        firstNode.cy(),
                        this.getObjectSize(),
                        this.getStrokeWidth()
        )

        await this.pause("traversal.start", firstNode.getText())

        await this.pause("traversal.edgeUpdate", firstNode.getText())
        // discover outgoing edges
        for (const currEdge of Object.values(firstNode.$outgoing)) {
            if (currEdge && !visitedEdges.has(currEdge)
                && !visitedNodes.has(currEdge.$end)) {
                knownEdges.add({node:currEdge.$start,weight:currEdge.$weight,node2:currEdge.$end})
            }
        }

        for (let i = 0; i < this.graphTraversal.length;i++) {
            const edge = this.graphTraversal[i]
            const startNode = edge.$start
            visitedNodes.add(startNode)

            this.updateTable([...knownEdges])
            await this.pause("traversal.chooseEdge", startNode.getText())
            this.updateTable([...knownEdges], edge)
            await this.pause("traversal.move", startNode.getText())

            visitedNodes.add(edge.$end)
            if (lastNode !== startNode) {
                // animate pointer to node
                pointer.setCenter(
                    startNode.cx(),
                    startNode.cy(),
                    this.getAnimationSpeed()
                )

                await this.pause(`traversal.atNode`, startNode.getText())
            }

            visitedEdges.add(edge)

            // highlight the traversed edge
            edge.setHighlight(true)

            const endNode = edge.$end
            
            // animate pointer to next node
            pointer?.setCenter(
                endNode.cx(),
                endNode.cy(),
                this.getAnimationSpeed()
            )

            await this.pause("traversal.atNode", endNode.getText())

            // remove edge from known edges
            await this.pause("traversal.cleanUp", endNode.getText())
            for (const currEdge of knownEdges) {
                if (visitedNodes.has(currEdge.node2!)) {
                    knownEdges.delete(currEdge)
                }
            }
            this.updateTable([...knownEdges])
            
            // discover outgoing edges
            for (const currEdge of Object.values(endNode.$outgoing)) {
                    if (currEdge && !visitedEdges.has(currEdge)
                        && !visitedNodes.has(currEdge.$end)) {
                        knownEdges.add({node:currEdge.$start,weight:currEdge.$weight,node2:currEdge.$end})
                    }
                }

            await this.pause("traversal.edgeUpdate", endNode.getText())

            lastNode = endNode
        }

        pointer?.remove()

        this.edgeTable.clear()

        await this.pause("traversal.complete")
    }


    async updateTable(
        tableInformation:tableInformation[]
    , highlightEdge?:WeightedConnection<WeightedGraphNode>
    ) {
        const columns = ["From", "Weight", "To"];
        const edges = tableInformation
        
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
            const rowData = [currEdge.node.getText()
                            ,currEdge.weight.toString()
                            ,currEdge.node2!.getText()]


            //Check if this edge is the one that should be highlight
            let bool_highlight: boolean 
            if (highlightEdge?.$start === currEdge.node && highlightEdge.$end === currEdge.node2) bool_highlight = true
            else bool_highlight = false
        
            
            this.drawRow(
                rowData,
                k + 1,
                startX,
                startY,
                cellWidth,
                cellHeight,
                bool_highlight
            );
            k++
        }           

        this.Svg.add(this.edgeTable)
    }
}