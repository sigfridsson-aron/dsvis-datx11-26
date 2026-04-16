import { Graph } from "~/graph";
import { BaseGraph, BaseGraphMessages, rowHighlight } from "./base-graph";
import { WeightedGraphNode } from "~/objects/weightedgraph-node";
import { MessagesObject } from "~/engine";
import { updateDefault } from "~/helpers";
import { WeightedConnection } from "~/objects/weigted-connection";
import { MinPriorityStack } from "~/basic/MinPriorityStack";

export const PrimMessages = {
    Prim: {
          start: (value: string, cost: number) => 
            `Initialize search with your start node ${value} -> ${value}: costing ${cost}`
        , lookup: `Lookup edge with minimum weight`
        , add: (value: string) => 
            `Add the edges leading to ${value}'s unvisited neighbours`
        , visited: (value: string) => 
            `Add ${value} to visited nodes`
        , remove: (value: string) =>
            `Remove all edges that go to ${value}`
    }
    
} as const satisfies MessagesObject

type path = { path: WeightedConnection<WeightedGraphNode>
            , weight: number
            , incoming: boolean}

type tableInformation = { node: WeightedGraphNode
                        , node2?: WeightedGraphNode
                        , weight: number
                        , incoming?: boolean }

export class Prim extends BaseGraph implements Graph {
    messages: MessagesObject = updateDefault(PrimMessages, BaseGraphMessages);

    async start(): Promise<void> {
        this.graph?.setHighlight(false)
        await this.primsAlg()
        this.edgeTable.clear()
        for (const node of this.createdNodes) {
            node.setSize(this.getObjectSize())
        }
        this.graph?.setHighlight(true)
        await this.pause(`done`)
    }

    async primsAlg() {
        const visited = new Set<WeightedGraphNode>
        const unVisited = new MinPriorityStack<path>
        
        const start = this.graph!
        const startConnect = new WeightedConnection(start, start, 0);

        await this.pause(`Prim.start`, start.getText(), 0)
        unVisited.push({ path: startConnect, weight: 0, incoming: false})
        let tableInf = this.tableInf(unVisited)

        await this.updateTable(tableInf)
        await this.pause(`Prim.start`, start.getText(), 0)

        while(unVisited.size > 0) {
            await this.pause(`Prim.lookup`)
            tableInf = this.tableInf(unVisited)
            const currPath = unVisited.pop()

            let currNode: WeightedGraphNode;
            if (currPath.incoming) {
                currNode = currPath.path.$start
            } else { 
                currNode = currPath.path.$end
            }

            this.updateTable(tableInf, { node: currPath.path.$start
                                       , node2: currPath.path.$end
                                       , weight: currPath.path.$weight })
            currPath.path.setHighlightColor(true, `highlight-blue`)
            await this.pause(`Prim.lookup`)
            tableInf = this.tableInf(unVisited)
            this.updateTable(tableInf)
            currPath.path.setHighlightColor(false)
            
            
            currPath.path.setHighlightColor(true, `highlight`)
            await this.pause(`Prim.visited`, currNode.getText())
            visited.add(currNode)
            currNode.setSize(this.getObjectSize() - this.getObjectSize()/5)

            await this.pause(`Prim.remove`, currNode)
            const temp = []
            while (unVisited.size > 0) {
                const path = unVisited.pop()
                if (path.incoming && !visited.has(path.path.$start) ||
                   !path.incoming && !visited.has(path.path.$end)) {
                    temp.push(path)
                }
            }
            for (const path of temp) {
                unVisited.push(path)
            }

            tableInf = this.tableInf(unVisited)
            this.updateTable(tableInf)
            
            await this.pause(`Prim.add`, currNode.getText())
            for (const path of Object.values(currNode.$outgoing)) {
                if (!path || visited.has(path.$end)) continue
                unVisited.push(
                    { path: path, weight: path.$weight, incoming: false }
                )
            }
            for (const path of Object.values(currNode.$incoming)) {
                if (!path || visited.has(path.$start)) continue
                unVisited.push(
                    { path: path, weight: path.$weight, incoming: true }
                )
            }
            tableInf = this.tableInf(unVisited)
            this.updateTable(tableInf)
        }
    }

    tableInf(queue: MinPriorityStack<path>): tableInformation[] {
        const tableInf = []

        for (let i = queue.size-1; i >= 0;i--) {
            const path = queue.get(i)
            let Inf: tableInformation;
            tableInf.push({ node: path.path.$start
                          , node2: path.path.$end
                          , weight: path.path.$weight
                          , incoming: path.incoming })
        }
        return tableInf
    }

    async nodeTraversalVisualisation(): Promise<void> {}

    async updateTable( tableInformation: tableInformation[]
                     , rowHighlight?: rowHighlight): Promise<void> {
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
            edge

            let rowData;
            if (edge.incoming) {
                rowData = [edge.node2!.getText()
                          ,edge.weight.toString()
                          ,edge.node.getText()]
            } else {
                rowData = [edge.node.getText()
                          ,edge.weight.toString()
                          ,edge.node2!.getText()]
            }


            //Check if this edge is the one that should be highlight
            let bool_highlight: boolean 
            if (rowHighlight?.node === edge.node && rowHighlight.node2 === edge.node2) bool_highlight = true
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

    override newNode(text: string): WeightedGraphNode {
        const node = super.newNode(text)
        node.$dir = false
        return node
    }
}