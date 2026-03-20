import { MessagesObject } from "~/engine";
import { Graph } from "~/graph";
import { WeightedGraphNode } from "~/objects/weightedgraph-node";
import { WeightedConnection } from "~/objects/weigted-connection";
import { GraphNode } from "~/objects/graph-node";
import { BaseGraph, BaseGraphMessages } from "./base-graph";
import { updateDefault } from "~/helpers";

export const DepthMessages = {
    //if you want to change messages that already exist in
    //BaseGraph you can define something like
    // error: {
    //    nullGraph: "you are man"
    // }
    //and it will overwrite the BaseGraph's error.nullGraph
    //message
} as const satisfies MessagesObject

export class Depth extends BaseGraph implements Graph {
    messages: MessagesObject = updateDefault(DepthMessages, BaseGraphMessages);

    override async start() {
        if (!this.graph) {
            await this.pause("error.nullGraph")
            return
        }
        this.graph.setHighlight(false)
        const result = this.searchGraph(this.graph)
        console.log(result)
        await this.nodeTraversalVisualisation(result)
        this.graph.setHighlight(true)
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
}