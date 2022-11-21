import * as edition from "./edition";
import * as simulation from "./simulation";

type State = (simulation.State | edition.State) & {
    changeMode: (newMode: Modes) => void;
    toggleMode: () => void;
};

type Modes = State["mode"];
type StateData = simulation.State | edition.State;

const modeNameHtml = document.querySelector<HTMLSpanElement>("#mode-name")!;

let modeCleanupFn: (() => void) | null | undefined;

const changeMode = (newMode: Modes) => {
    if(modeCleanupFn) modeCleanupFn();

    state.mode = newMode;

    const modeMap = {
        simulation: { name: "Simulation", initFn: simulation.setup },
        edition: { name: "Modification", initFn: edition.setup },
    };

    modeNameHtml.textContent = modeMap[newMode].name;

    // makes some markup element only visible in one specific mode
    document.body.className = newMode;

    modeCleanupFn = modeMap[newMode].initFn();
};


let state = {
    mode: "simulation",

    changeMode,
    toggleMode: () => {
        changeMode(state.mode === "simulation" ? "edition" : "simulation");
    },
} as State;

type Export = {
    mode: Modes;

    changeMode: (newMode: Modes) => void;
    toggleMode: () => void;
} & StateData;

export default state as Export;
