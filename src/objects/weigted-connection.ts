import { Marker, Text } from "@svgdotjs/svg.js";
import { LinkedNode } from "./basic-structure-objects/linked-node";
import { BTreeNode } from "./btree-node";
import { Connection } from "./connection";
import { GraphNode } from "./graph-node";

export class WeightedConnection<T extends GraphNode | BTreeNode | LinkedNode> extends Connection<T> {
    $weight: number
    private $textObj!: Text

    constructor(start: T, end: T, weight: number) {
        super(start, end)
        
        this.$weight = weight
    }

    // for the overridden functions i only added _createWeight and _redrawWeight
    override update(
        newCoords: Partial<{ x1: number; y1: number; x2: number; y2: number; r2: number; }>, 
        animationDuration: number = 0
    ): this {
        Object.assign(this.$coords, newCoords);
        (this.engine().animate(this, animationDuration > 0) as this).plot(
            this._getPath()
        );
        this._redrawWeight(newCoords, animationDuration)
        if (this.isDirected()) {
            this._redrawArrow(animationDuration);
        }
        return this;
    }

    override init(
        strokeWidth: number,
        bend: number = 0,
        directed: boolean = false
    ): this {
        this.stroke({ width: strokeWidth });
        this.back();
        this.setBend(bend);
        if (directed) {
            this._createArrow();
        }
        this._createWeight();
        this.update(this.$coords);
        return this;
    }

    // Creates a text object that contains the weight value
    // of this connection
    _createWeight(): void {
        this.$textObj = this.root()
        .text(this.$weight.toString())
        .font({ size: 25 })
        .fill("#000000")
        .stroke({ color: "#b01a1a", width: 1 })
        .center(
            (this.$coords.x1 + this.$coords.x2) / 2 + 5,
            (this.$coords.y1 + this.$coords.y2) / 2 + 5
        );
    }

    // When update gets called this animates the text object
    // so it stays in the middle of the connection
    _redrawWeight(newCoords: Partial<{ x1: number; 
                                       y1: number; 
                                       x2: number; 
                                       y2: number; 
                                       r2: number; 
                                    }>,
                  animationDuration: number = 0): void {

        const x1 = newCoords.x1 ? newCoords.x1 : this.$coords.x1
        const x2 = newCoords.x2 ? newCoords.x2 : this.$coords.x2
        const y1 = newCoords.y1 ? newCoords.y1 : this.$coords.y1
        const y2 = newCoords.y2 ? newCoords.y2 : this.$coords.y2

        this.$textObj.engine().animate(this.$textObj, animationDuration > 0)
        .center(
            (x1 + x2)/2,
            (y1 + y2)/2
        )
    }
}