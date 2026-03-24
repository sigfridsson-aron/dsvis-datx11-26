import { MessagesObject } from "~/engine";
import { BaseGraph, BaseGraphMessages } from "./base-graph";
import { Graph } from "~/graph";
import { updateDefault } from "~/helpers";
import { WeightedConnection } from "~/objects/weigted-connection";
import { WeightedGraphNode } from "~/objects/weightedgraph-node";
import Queue from "~/basic/Queue"

export const BreadthMessages = {
    traversal: {
        chooseEdge: (value: string) => `Exploring all of ${value}'s edges`
    }
} as const satisfies MessagesObject

export class Breadth extends BaseGraph implements Graph {
    messages: MessagesObject = updateDefault(BreadthMessages, BaseGraphMessages)

    override async start() {
        if (!this.graph) {
            await this.pause("error.nullGraph")
            return
        }
        this.graph.setHighlight(false)
        const result = this.breadthSearch()
        await this.nodeTraversalVisualisation(result)
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
}