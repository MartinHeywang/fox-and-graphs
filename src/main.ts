import { loadGraph } from "./load";
import state from "./state/state";

const container = document.querySelector<HTMLDivElement>("#sigma-container")!;
loadGraph(container).then(({ sigma }) => {

    sigma.setCustomBBox(sigma.getBBox());

    const changeModeButton = document.querySelector("#mode-change")!;
    changeModeButton.addEventListener("click", () => state.toggleMode());

    // set the mode the first time
    state.changeMode("simulation");
});
