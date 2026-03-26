import { Graph } from "~/graph";
import { BaseGraph } from "./base-graph";
import { GraphNode } from "~/objects/graph-node";
import { WeightedConnection } from "~/objects/weigted-connection";
import { WeightedGraphNode } from "~/objects/weightedgraph-node";
import { MinPriorityStack } from "~/basic/MinPriorityStack";





export class Dijkstras_algorithm extends BaseGraph implements Graph {
    

  
    private distanceMap:Map<WeightedGraphNode, number> = new Map
   
    override async start() {
        if (!this.graph) {
            await this.pause("error.nullGraph")
            return
        }
        this.graph.setHighlight(false)
        this.searchGraph(this.graph)
        console.log(this.distanceMap)

        
        
    }   
    

    nodeTraversalVisualisation(): void {
            throw new Error("Method not implemented.");
        }
    searchGraph(startNode:WeightedGraphNode) {

   
    const visited = new Set<WeightedGraphNode>();
    type path = {node:WeightedGraphNode,weight:number,parent:WeightedGraphNode | null}
    const minStack = new MinPriorityStack<path>
  

    this.distanceMap.set(startNode, 0);
    
    minStack.push({node:startNode,weight:0,parent:null})

    while (minStack.size > 0) {
        const current = minStack.pop()
        if (!current) break


        const { node, weight: currentDist,parent} = current;

        if (visited.has(node)) continue;
        visited.add(node);

        for (const key in node.$outgoing) {
            const newDist = currentDist + node.$weights[key]!;



            if (!node.$outgoing[key]) continue
            const connectedNode = node.$outgoing[key].$end



            const oldDist =  this.distanceMap.get(connectedNode);
            if (oldDist === undefined || newDist < oldDist) {
                this.distanceMap.set(connectedNode, newDist);
                minStack.push({node:connectedNode, weight:newDist,parent:node});
            }
        }
    }

    return  this.distanceMap;



}

}