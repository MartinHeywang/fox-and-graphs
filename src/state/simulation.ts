import { SigmaNodeEventPayload } from "sigma/sigma";
import { graph, sigma } from "../load";
import { exportPNG } from "../export";
import state from "./state";

type State = { mode: "simulation" } & Data;

type Data = {
    history: Map<string, boolean>[];
};

function updateDayHtml() {
    if (state.mode !== "simulation") return;

    const dayHtml = document.querySelector<HTMLDivElement>("#day")!;
    dayHtml.textContent = `Jour ${state.history.length}`;
}

function resetFoxPositions() {
    graph.nodes().forEach(node => {
        graph.setNodeAttribute(node, "possibleFox", true);
    });
}

function updateFoxPositions() {
    if (state.mode !== "simulation") return;
    if (state.history.length === 0) return resetFoxPositions();

    state.history.at(-1)!.forEach((possibleFox, node) => {
        graph.setNodeAttribute(node, "possibleFox", possibleFox);
    });
}

function simulateNextDay(payload: SigmaNodeEventPayload) {
    if (state.mode !== "simulation") return;

    const newStates = new Map<string, boolean>();
    state.history.push(newStates);
    updateDayHtml();

    graph.nodes().forEach(node => {
        const newPossibleFox = graph.neighbors(node).some(neighbor => {
            // the neighbor is the one we clicked,
            // then it is considered as if it could not contain the fox
            if (neighbor === payload.node) return false;
            return graph.getNodeAttribute(neighbor, "possibleFox");
        });

        newStates.set(node, newPossibleFox);
    });

    updateFoxPositions();
}

export function setup() {
    if (state.mode !== "simulation") return;

    const clickNodeFn: (payload: SigmaNodeEventPayload) => void = payload =>
        simulateNextDay(payload);

    sigma.on("clickNode", clickNodeFn);

    graph.nodes().forEach(node => {
        graph.setNodeAttribute(node, "possibleFox", true);
    });

    sigma.setSetting("nodeReducer", (node, data) => {
        const res = { ...data };

        res.color = "orange";

        if (graph.getNodeAttribute(node, "possibleFox") === false) {
            res.color = "red";
        }

        return res;
    });
    sigma.setSetting("edgeReducer", (_edge, data) => {
        return {
            ...data,
            size: 4,
            color: "#666"
        }
    })

    state.history = [];
    updateDayHtml();

    const backHtml = document.querySelector!("#back-button")!;
    const backFn = () => {
        if (state.mode !== "simulation") return;
        state.history.pop();
        updateFoxPositions();
        updateDayHtml();
    };
    backHtml.addEventListener("click", backFn);

    const resetHtml = document.querySelector!("#reset-button")!;
    const resetFn = () => {
        if (state.mode !== "simulation") return;

        state.history.splice(0);
        updateFoxPositions();
        updateDayHtml();
    };
    resetHtml.addEventListener("click", resetFn);

    const exportPNGHtml = document.querySelector<HTMLButtonElement>("#export-png")!;
    const exportPNGFn = () => {
        exportPNG(sigma);
    };
    exportPNGHtml.addEventListener("click", exportPNGFn);

    return () => {
        sigma.off("clickNode", clickNodeFn);

        graph.nodes().forEach(node => {
            graph.removeNodeAttribute(node, "possibleFox");
        });

        sigma.setSetting("nodeReducer", (_node, data) => data);
        sigma.setSetting("edgeReducer", (_edge, data) => data);

        backHtml.removeEventListener("click", backFn);
        resetHtml.removeEventListener("click", resetFn);
        exportPNGHtml.removeEventListener("click", exportPNGFn);
    };
}

export type { State };
