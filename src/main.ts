import { loadGraph } from "./load";
import state from "./state/state";

const container = document.querySelector<HTMLDivElement>("#sigma-container")!;
loadGraph(container).then(({ sigma }) => {
    
    // Disable the autoscale at the first down interaction
    sigma.getMouseCaptor().once("mousedown", () => {
        sigma.setCustomBBox(sigma.getBBox());
    });

    const changeModeButton = document.querySelector("#mode-change")!;
    changeModeButton.addEventListener("click", () => state.toggleMode());

    // set the mode the first time
    state.changeMode("simulation");
});

/*

TEMPORARILY HERE FOR REFERENCE

const camera = sigma.getCamera();
const zoomResetBtn = document.querySelector<HTMLButtonElement>("#zoom-reset")!;

zoomResetBtn.addEventListener("click", () => {
    camera.animatedReset({ duration: 600 });
});
*/
