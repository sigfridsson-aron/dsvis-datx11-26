import { MessagesObject } from "~/engine";
import { BaseGraph, BaseGraphMessages } from "./base-graph";
import { Graph } from "~/graph";
import { updateDefault } from "~/helpers";
import { WeightedConnection } from "~/objects/weigted-connection";
import { WeightedGraphNode } from "~/objects/weightedgraph-node";
import Queue from "~/basic/Queue"
import { HighlightCircle } from "~/objects/highlight-circle";

export const BreadthMessages = {
    traversal: {
        chooseEdge: (value: string) => `Exploring all of ${value}'s edges`
    }
} as const satisfies MessagesObject

export class Breadth extends BaseGraph implements Graph {
    messages: MessagesObject = updateDefault(BreadthMessages, BaseGraphMessages)
    private graphTraversal: WeightedConnection<WeightedGraphNode>[] = []

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
    let lastNode: WeightedGraphNode | null = null

    const knownEdges   = new Set<WeightedConnection<WeightedGraphNode>>()
    const visitedEdges = new Set<WeightedConnection<WeightedGraphNode>>()
    const visitedNodes = new Set<WeightedGraphNode>()

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
            knownEdges.add(currEdge)
        }
    }

    for (let i = 0; i < this.graphTraversal.length;i++) {
        const edge = this.graphTraversal[i]
        const startNode = edge.$start
        visitedNodes.add(startNode)

        this.updateEdgeTable(knownEdges)
        await this.pause("traversal.chooseEdge", startNode.getText())
        this.updateEdgeTable(knownEdges, edge)
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

        // if edge is undirected highlight the path back as well
        if (edge.$end.$outgoing[edge.$start.getText()]
         && edge.$end.$outgoing[edge.$start.getText()]?.$weight === edge.$weight)
            edge.$end.$outgoing[edge.$start.getText()]?.setHighlight(true)

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
            if (visitedNodes.has(currEdge.$end)) {
                knownEdges.delete(currEdge)
            }
        }
        this.updateEdgeTable(knownEdges)
        
        // discover outgoing edges
        for (const currEdge of Object.values(endNode.$outgoing)) {
                if (currEdge && !visitedEdges.has(currEdge)
                    && !visitedNodes.has(currEdge.$end)) {
                    knownEdges.add(currEdge)
                }
            }

        await this.pause("traversal.edgeUpdate", endNode.getText())

        lastNode = endNode
    }

    pointer?.remove()

    this.edgeTable.clear()

    await this.pause("traversal.complete")
}
}