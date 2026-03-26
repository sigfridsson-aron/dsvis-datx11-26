import { MessagesObject } from "~/engine";
import { Graph } from "~/graph";
import { WeightedGraphNode } from "~/objects/weightedgraph-node";
import { WeightedConnection } from "~/objects/weigted-connection";
import { GraphNode } from "~/objects/graph-node";
import { BaseGraph, BaseGraphMessages } from "./base-graph";
import { updateDefault } from "~/helpers";
import { HighlightCircle } from "~/objects/highlight-circle";

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
    private graphTraversal: WeightedConnection<WeightedGraphNode>[] = []

    override async start() {
        if (!this.graph) {
            await this.pause("error.nullGraph")
            return
        }
        this.graph.setHighlight(false)
        this.graphTraversal = this.searchGraph(this.graph)
       
        await this.nodeTraversalVisualisation()
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

    async nodeTraversalVisualisation(
) {
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