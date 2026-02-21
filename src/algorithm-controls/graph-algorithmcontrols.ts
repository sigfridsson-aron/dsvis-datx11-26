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
            "input.start", //this needs to be the input.(name of class in HTML doc)
            container
        );

        this.initialize();
    }

    initialize() {
        //this.engine.(name of SubmitFunction) needs a defined function in
        //the implementation of your engine with the same name as SubmitFunction
        this.start.addEventListener("click", () => {
            this.engine.submit(this.engine.start, null)
        });
    }
}