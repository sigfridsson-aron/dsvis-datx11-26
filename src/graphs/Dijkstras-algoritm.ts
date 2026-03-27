import { Graph } from "~/graph";
import { BaseGraph, tableInformation } from "./base-graph";
import { GraphNode } from "~/objects/graph-node";
import { WeightedConnection } from "~/objects/weigted-connection";
import { WeightedGraphNode } from "~/objects/weightedgraph-node";
import { MinPriorityStack } from "~/basic/MinPriorityStack";





export class Dijkstras_algorithm extends BaseGraph implements Graph {
    

  
    private distanceMap:Map<WeightedGraphNode, number> = new Map
    private start_Node:WeightedGraphNode | undefined


    override async start() {
        if (!this.graph) {
            await this.pause("error.nullGraph")
            return
        }
        this.graph.setHighlight(false)
    
        console.log(this.distanceMap)
        this.start_Node = this.graph
        await this.nodeTraversalVisualisation()
        
    }   
    

    async nodeTraversalVisualisation() {

    if (this.start_Node === undefined) return

    const visited = new Set<WeightedGraphNode>();
    type path = {node:WeightedGraphNode,weight:number,parent:WeightedGraphNode | null}
    const minStack = new MinPriorityStack<path>
  

    this.start_Node.setHighlight(true)
    await this.pause("Add start node to min stack")

    this.distanceMap.set(this.start_Node, 0);
    
    
    minStack.push({node:this.start_Node,weight:0,parent:null})

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

    
            
        }

    async updateTable(
    tableInformation: tableInformation[]
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

