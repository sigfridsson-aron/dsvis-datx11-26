import { MessagesObject } from "~/engine";
import { BaseGraph, BaseGraphMessages } from "./base-graph";
import { Graph } from "~/graph";
import { updateDefault } from "~/helpers";
import { WeightedConnection } from "~/objects/weigted-connection";
import { WeightedGraphNode } from "~/objects/weightedgraph-node";

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
    }

    breadthSearch(): WeightedConnection<WeightedGraphNode>[] {
        const visitOrder: WeightedConnection<WeightedGraphNode>[] = [];

        return []
    }
}