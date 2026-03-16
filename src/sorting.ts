import { SortingAlgorithmControls } from "./algorithm-controls/sorting-algorithm-controls";
import { Engine, SubmitFunction } from "./engine";
import { initialiseEngine, querySelector, RecordOfEngines } from "./helpers";
import { InsertionSort } from "./sorting/InsertionSort";
import { MergeSort } from "./sorting/MergeSort";
import { QuickSort } from "./sorting/QuickSort";
import { SelectionSort } from "./sorting/SelectionSort";

let right: number = 0;
let down: number = 0;
let zoom: number = 1;
let scrollSpeed: number = 1;

export interface Sorter extends Engine {
    sort: SubmitFunction;
    insert: SubmitFunction;
}

const SORTING_CLASSES = {
    SelectionSort: SelectionSort,
    InsertionSort: InsertionSort,
    MergeSort: MergeSort,
    QuickSort: QuickSort,
} as const satisfies RecordOfEngines<Sorter>;

const { engine: SortEngine, isBaseEngine } = initialiseEngine<Sorter>(
    "#sortingContainer",
    SORTING_CLASSES
);

if (!isBaseEngine) {
    SortEngine.algorithmControls = new SortingAlgorithmControls(
        SortEngine.container,
        SortEngine
    );
}

