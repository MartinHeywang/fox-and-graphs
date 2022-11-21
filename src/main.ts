import { loadGraph } from "./load";
import state from "./state/state";

const container = document.querySelector<HTMLDivElement>("#sigma-container")!;
const { graph, sigma } = await loadGraph(container);
export { graph, sigma };

// Disable the autoscale at the first down interaction
sigma.getMouseCaptor().once("mousedown", () => {
    sigma.setCustomBBox(sigma.getBBox());
});

const changeModeButton = document.querySelector("#mode-change")!;
changeModeButton.addEventListener("click", () => state.toggleMode());

// set the mode the first time
state.changeMode("simulation");

// todo: simulation
/*
    - get all nodes
    - create a Map<key, state> and fill it with (key, new state) pairs
    - apply all the entries to graphology
    - refresh Sigma
*/

// todo: state bar
/*
    - displays the current mode (edit, simulate)
    - shows current state
*/

/*

const camera = sigma.getCamera();

const zoomInBtn = document.querySelector<HTMLButtonElement>("#zoom-in")!;
const zoomOutBtn = document.querySelector<HTMLButtonElement>("#zoom-out")!;
const zoomResetBtn = document.querySelector<HTMLButtonElement>("#zoom-reset")!;
const labelsThresholdRange = document.querySelector<HTMLInputElement>("#labels-threshold")!;

// Bind zoom manipulation buttons
zoomInBtn.addEventListener("click", () => {
    camera.animatedZoom({ duration: 600 });
});
zoomOutBtn.addEventListener("click", () => {
    camera.animatedUnzoom({ duration: 600 });
});
zoomResetBtn.addEventListener("click", () => {
    camera.animatedReset({ duration: 600 });
});

// Bind labels threshold to range input
labelsThresholdRange.addEventListener("input", () => {
    sigma.setSetting(
        "labelRenderedSizeThreshold",
        +labelsThresholdRange.value
    );
});

// Set proper range initial value:
labelsThresholdRange.value =
    sigma.getSetting("labelRenderedSizeThreshold") + "";
*/
