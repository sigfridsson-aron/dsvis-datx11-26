import { MessagesObject } from "~/engine";
import { BaseGraph, BaseGraphMessages } from "./base-graph";
import { Graph } from "~/graph";
import { updateDefault } from "~/helpers";
import { WeightedGraphNode } from "~/objects/weightedgraph-node";
import { WeightedConnection } from "~/objects/weigted-connection";

export const FloydWarshallMessages = {
    floydWarshall: {
        start: `This algorithm considers the whole graph
        and does not start in a specific node`
    }
    //if you want to change messages that already exist in
    //BaseGraph you can define something like
    // error: {
    //    nullGraph: "you are man"
    // }
    //and it will overwrite the BaseGraph's error.nullGraph
    //message
} as const satisfies MessagesObject

export class FloydWarshall extends BaseGraph implements Graph {
    messages: MessagesObject = updateDefault(FloydWarshallMessages, BaseGraphMessages)

    override async start() {
        if (!this.graph) {
            await this.pause("error.nullGraph")
            return
        }
        this.graph.setHighlight(false)

        await this.floydWarshallSearch()

        this.graph.setHighlight(true)
    }

    async floydWarshallSearch(): Promise<
            Record<string, 
                   Record<string, 
                          WeightedConnection<WeightedGraphNode>[]>>
            > {
        // Creates a preliminary matrix for vertixes, structured
        // as matrix[startVertix][endVertix] = weight of path
        // from startVertix to endVertix
        // since it is preliminary it only has the weight of
        // paths that are immediatly connected
        const weights: Record<string, Record<string, number>> = {}
        const paths: Record<string, 
                            Record<string, 
                                   WeightedConnection<WeightedGraphNode>[]>> = {}

        await this.pause("floydWarshall.start")
        
        for (const nodeFrom of this.createdNodes) {
            const tempWeights: Record<string, number> = {}
            const tempPaths: Record<string,
                                    WeightedConnection<WeightedGraphNode>[]> = {}
            const out: WeightedGraphNode[] = [];
            for (const edge of Object.values(nodeFrom.$outgoing)) {
                out[out.length] = edge!.$end
            }
            const nodeFromT = nodeFrom.getText()
            for (const nodeTo of this.createdNodes) {
                const nodeToT   = nodeTo.getText()
                const path: WeightedConnection<WeightedGraphNode>[] = []
                var weight: number;
                if (nodeFrom === nodeTo) {
                    weight = 0
                } else if (out.includes(nodeTo)) {
                    weight = nodeFrom.$outgoing[nodeToT]!.$weight
                    path[0] = nodeFrom.$outgoing[nodeToT]!
                } else {
                    weight = Infinity
                }

                tempPaths[nodeToT] = path
                paths[nodeFromT] = tempPaths

                tempWeights[nodeToT] = weight
                weights[nodeFromT] = tempWeights
            }
        }
        
        for (const kNode of this.createdNodes) {
            const k = kNode.getText()
            for (const iNode of this.createdNodes) {
                const i = iNode.getText()
                for (const jNode of this.createdNodes) {
                    const j = jNode.getText()
                    if (weights[i][j] > weights[i][k] + weights[k][j]) {
                        weights[i][j] = weights[i][k] + weights[k][j]
                        const path  = paths[i][k].concat(paths[k][j])
                        paths[i][j] = path
                    }
                }
            }
        }
        return paths
    }
}