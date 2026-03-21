import { MessagesObject } from "~/engine";
import { BaseGraph, BaseGraphMessages } from "./base-graph";
import { Graph } from "~/graph";
import { updateDefault } from "~/helpers";
import { WeightedConnection } from "~/objects/weigted-connection";
import { WeightedGraphNode } from "~/objects/weightedgraph-node";
import Queue from "~/basic/Queue"
import { HighlightCircle } from "~/objects/highlight-circle";

export const BreadthMessages = {
    //if you want to change messages that already exist in
    //BaseGraph you can define something like
    // error: {
    //    nullGraph: "you are man"
    // }
    //and it will overwrite the BaseGraph's error.nullGraph
    //message
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
        this.graph.setHighlight(false)
    }

    breadthSearch(): WeightedConnection<WeightedGraphNode>[] {
        const visitOrder: Queue<WeightedGraphNode> = new Queue();
        const edges: WeightedConnection<WeightedGraphNode>[] = [];
        const visitedNodes: WeightedGraphNode[] = []
        const toVisit: WeightedGraphNode[] = []

        visitOrder.enqueue(this.graph!)

        while(visitOrder.size() > 0) {
            const currNode  = visitOrder.dequeue()
            const currEdges = currNode?.$outgoing
            visitedNodes.push(currNode!)

            if (!currEdges) continue

            for (const k of Object.values(currEdges)) {
                if (toVisit.includes(k!.$end) || visitedNodes.includes(k!.$end)) 
                    continue
                visitOrder.enqueue(k!.$end)
                edges[edges.length] = k!
                toVisit.push(k!.$end)
            }
        }
        return edges
    }
}