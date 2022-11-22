import {
    SigmaEdgeEventPayload,
    SigmaNodeEventPayload,
    SigmaStageEventPayload,
} from "sigma/sigma";
import { MouseCoords } from "sigma/types";

import { v4 as uuid } from "uuid";

import state from "./state";
import { graph, sigma } from "../load";

type State = { mode: "edition" } & Data;

type Data = {
    selection: {
        key: unknown;
        type: "node" | "edge";
    } | null;

    drag: {
        isDragging: boolean;
        draggedNode: unknown | null;
    };

    edgeCreation: {
        tempNode: unknown | null;
    };
};

// still to be done in this file
// - change the action method to take only needed information, not event payloads
// - so they can be called internally, w/o events

function createNode(event: MouseCoords) {
    if (state.mode !== "edition") return;
    event.preventSigmaDefault();

    const coordForGraph = sigma.viewportToGraph({ x: event.x, y: event.y });

    const node = {
        ...coordForGraph,
        size: 30,
    };

    const id = uuid();
    graph.addNode(id, node);
}

function resetSelection() {
    if (state.mode !== "edition") return;
    state.selection = null;
}

function selectNode(event: SigmaNodeEventPayload) {
    if (state.mode !== "edition") return;
    resetSelection();

    const { node } = event;
    state.selection = { type: "node", key: node };
}

function selectEdge(event: SigmaEdgeEventPayload) {
    if (state.mode !== "edition") return;
    resetSelection();

    const { edge } = event;

    state.selection = { key: edge, type: "edge" };
}

function createEdge(event: MouseCoords, node: string) {
    if (state.mode !== "edition") return;
    if(state.selection === null) return;
    if(state.selection.type !== "node") return;

    event.preventSigmaDefault();
    event.original.preventDefault();

    if (node === state.selection.key) return;
    graph.addEdge(state.selection.key, node);
}

function deleteSelection() {
    if (state.mode !== "edition") return;
    if (state.selection === null) return;

    if (state.selection.type === "node") graph.dropNode(state.selection.key);
    if (state.selection.type === "edge") graph.dropEdge(state.selection.key);
    state.selection = null;
}

function startDragging(event: SigmaNodeEventPayload) {
    if (state.mode !== "edition") return;
    event.preventSigmaDefault();

    // only the main button counts
    if (event.event.original.button !== 0) return;

    state.drag.isDragging = true;
    state.drag.draggedNode = event.node;
}

function moveNode(event: MouseCoords) {
    if (state.mode !== "edition") return;
    if (!state.drag.isDragging || !state.drag.draggedNode) return;

    event.preventSigmaDefault();
    event.original.preventDefault();

    const pos = sigma.viewportToGraph(event);

    graph.setNodeAttribute(state.drag.draggedNode, "x", pos.x);
    graph.setNodeAttribute(state.drag.draggedNode, "y", pos.y);
}

function stopDragging(event: MouseCoords) {
    if (state.mode !== "edition") return;
    event.preventSigmaDefault();

    state.drag.isDragging = false;
    state.drag.draggedNode = null;
}

export function setup() {
    if (state.mode !== "edition") return;

    state.drag = { isDragging: false, draggedNode: null };
    state.selection = null;
    state.edgeCreation = { tempNode: null };

    const doubleClickStageFn: (payload: SigmaStageEventPayload) => void = ({ event }) =>
        createNode(event);
    const clickNodeFn: (payload: SigmaNodeEventPayload) => void = event =>
        {selectNode(event); console.log("left click node fn")};
    const clickEdgeFn: (payload: SigmaEdgeEventPayload) => void = event =>
        selectEdge(event);
    const clickStageFn: (payload: SigmaStageEventPayload) => void = () =>
        resetSelection();
    const rightClickNodeFn: (payload: SigmaNodeEventPayload) => void = ({
        event,
        node,
    }) => {createEdge(event, node); console.log("right click node fn")}

    const downNodeFn: (payload: SigmaNodeEventPayload) => void = event =>
        startDragging(event);
    const mousemoveFn: (coords: MouseCoords) => void = coords => moveNode(coords);
    const mouseupFn: (coords: MouseCoords) => void = coords => stopDragging(coords);
    const keydownFn: (e: KeyboardEvent) => void = event => {
        if (event.key === "Delete") deleteSelection();
    };

    sigma.on("doubleClickStage", doubleClickStageFn);
    sigma.on("clickNode", clickNodeFn);
    sigma.on("clickEdge", clickEdgeFn);
    sigma.on("clickStage", clickStageFn);
    sigma.on("rightClickNode", rightClickNodeFn);
    sigma.on("downNode", downNodeFn);
    sigma.getMouseCaptor().on("mousemove", mousemoveFn);
    sigma.getMouseCaptor().on("mouseup", mouseupFn);
    window.addEventListener("keydown", keydownFn);

    sigma.setSetting("nodeReducer", (node, data) => {
        if (state.mode !== "edition") return data;

        const res = { ...data };
        if (node === state.selection?.key) {
            res.color = "dodgerblue";
        }

        return res;
    });

    // cleanup function
    return () => {
        sigma.off("doubleClickStage", doubleClickStageFn);
        sigma.off("clickNode", clickNodeFn);
        sigma.off("clickEdge", clickEdgeFn);
        sigma.off("clickStage", clickStageFn);
        sigma.off("rightClickNode", rightClickNodeFn);
        sigma.off("downNode", downNodeFn);
        sigma.getMouseCaptor().off("mousemove", mousemoveFn);
        sigma.getMouseCaptor().off("mouseup", mouseupFn);
        window.removeEventListener("keydown", keydownFn);

        sigma.setSetting("nodeReducer", (_node, data) => data);
    };
}

export type { State };
