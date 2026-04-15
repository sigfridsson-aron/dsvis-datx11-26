import { GraphNode } from "./graph-node";
import { WeightedConnection } from "./weigted-connection";

export class WeightedGraphNode extends GraphNode {
    $outgoing: Record<string, WeightedConnection<this> | null> = {};
    $incoming: Record<string, WeightedConnection<this> | null> = {};
    $weights: Record<string, number | null> = {};
    $dir: boolean = true;

    override getDirected(): boolean {
        return this.$dir
    }

    override setPredecessor(inKey: string
                          , outKey: string
                          , predecessor: this
                          , strokeWidth: number
                          , weight: number = 0): this {
        predecessor.setSuccessor(outKey, inKey, this, strokeWidth, weight);
        return this;
    }

    override setSuccessor(outKey: string
                        , inKey: string
                        , successor: this | null
                        , strokeWidth: number
                        , weight: number = 0): this {
        const outEdge = this.$outgoing[outKey];

        if (outEdge) {
            const oldSuccessor = outEdge.getEnd();
            const oldIncoming = oldSuccessor.$incoming;
            for (const k in oldIncoming) {
                if (oldIncoming[k] === outEdge) {
                    delete oldIncoming[k];
                }
            }
            outEdge.remove();
        }
        if (successor) {
            const inEdge = successor.$incoming[inKey];
            if (inEdge) {
                const oldPredecessor = inEdge.getStart();
                const oldOutgoing = oldPredecessor.$outgoing;
                for (const k in oldOutgoing) {
                    if (oldOutgoing[k] === inEdge) {
                        delete oldOutgoing[k];
                    }
                }
                inEdge.remove();
            }
            var bend = 0
            if(successor.$outgoing[inKey]) {
                bend = 0.2
                successor.$outgoing[inKey].$bend = bend
                successor.$outgoing[inKey].update(successor.$outgoing[inKey].$coords)
            }
            const edge = this.root()
                .put(new WeightedConnection(this, successor, weight))
                .init(
                    strokeWidth,
                    this.getBend(outKey) + bend,
                    this.getDirected()
                );

            this.$outgoing[outKey] = edge;
            this.$weights[outKey] = weight
            successor.$incoming[inKey] = edge;
        } else {
            delete this.$outgoing[outKey];
        }
        this._updateNullary();
        return this;
    }
}