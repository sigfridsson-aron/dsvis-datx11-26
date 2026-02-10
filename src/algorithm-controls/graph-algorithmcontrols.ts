import { Graph } from "~/graph";
import { EngineAlgorithmControl } from "./engine-algorithm-controls";
import { querySelector } from "~/helpers";


export class GraphAlgorithmControl extends EngineAlgorithmControl {
    start: HTMLInputElement;
    engine: Graph;
    
    constructor(container: HTMLElement, engine: Graph) {
        super(container);

        this.engine = engine

        this.start = querySelector<HTMLInputElement> (
            "input.start",
            container
        )
    }

    initialize() {
        this.start.addEventListener("click", () => 
            this.engine.submit(this.engine.start, null)
        )
    }
}