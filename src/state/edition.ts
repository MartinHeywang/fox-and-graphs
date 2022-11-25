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

function createNode(vx: number, vy: number) {
    if (state.mode !== "edition") return;

    let { x, y } = sigma.viewportToGraph({ x: vx, y: vy });
    x = Math.round(x);
    y = Math.round(y);

    const node = {
        x,
        y,
        size: 30,
    };

    // if there is already a node on these coordinates, don't create
    if (
        graph
            .nodes()
            .some(
                node =>
                    graph.getNodeAttribute(node, "x") === x &&
                    graph.getNodeAttribute(node, "y") === y
            )
    )
        return;

    const id = uuid();
    graph.addNode(id, node);

    selectNode(id);
}

function resetSelection() {
    if (state.mode !== "edition") return;
    state.selection = null;
}

function selectNode(node: string) {
    if (state.mode !== "edition") return;

    resetSelection();
    state.selection = { type: "node", key: node };
}

function selectEdge(edge: string) {
    if (state.mode !== "edition") return;
    resetSelection();

    state.selection = { key: edge, type: "edge" };
}

function createEdge(targetNode: string) {
    if (state.mode !== "edition") return;

    // selection must be a node
    // and not the one the user just clicked on
    if (state.selection == null) return;
    if (state.selection.type !== "node") return;
    if (targetNode === state.selection.key) return;

    graph.addEdge(state.selection.key, targetNode);
}

function deleteSelection() {
    if (state.mode !== "edition") return;
    if (state.selection === null) return;

    if (state.selection.type === "node") graph.dropNode(state.selection.key);
    if (state.selection.type === "edge") graph.dropEdge(state.selection.key);
    state.selection = null;
}

function startDragging(node: string) {
    if (state.mode !== "edition") return;

    state.drag.isDragging = true;
    state.drag.draggedNode = node;
    selectNode(node);
}

// !! only works if a drag gesture is initiated
function dragNode(vx: number, vy: number) {
    if (state.mode !== "edition") return;
    if (!state.drag.isDragging || !state.drag.draggedNode) return;

    let { x, y } = sigma.viewportToGraph({ x: vx, y: vy });

    // rounding the coordinates
    // so the nodes only move on integer coordinates
    x = Math.round(x);
    y = Math.round(y);

    // if there is already a node on these coordinates, don't move
    if (
        graph
            .nodes()
            .some(
                node =>
                    graph.getNodeAttribute(node, "x") === x &&
                    graph.getNodeAttribute(node, "y") === y
            )
    )
        return;

    graph.setNodeAttribute(state.drag.draggedNode, "x", x);
    graph.setNodeAttribute(state.drag.draggedNode, "y", y);
}

function stopDragging() {
    if (state.mode !== "edition") return;

    state.drag.isDragging = false;
    state.drag.draggedNode = null;
}

export function setup() {
    if (state.mode !== "edition") return;

    state.drag = { isDragging: false, draggedNode: null };
    state.selection = null;
    state.edgeCreation = { tempNode: null };

    const doubleClickStageFn: (payload: SigmaStageEventPayload) => void = payload => {
        payload.preventSigmaDefault();

        const { event } = payload;
        createNode(event.x, event.y);
    };

    const clickNodeFn: (payload: SigmaNodeEventPayload) => void = payload => {
        payload.preventSigmaDefault();

        // info: where you left off
        // - keep editing the methods like this (prevent defaults)
        //      then test that everything works like before
        // - work on the option "add star - flocon ..."
        // - tackle the "state not initialized problem"
        selectNode(payload.node);
    };

    const clickEdgeFn: (payload: SigmaEdgeEventPayload) => void = payload => {
        payload.preventSigmaDefault();

        selectEdge(payload.edge);
    };

    const clickStageFn: (payload: SigmaStageEventPayload) => void = payload => {
        payload.preventSigmaDefault();

        resetSelection();
    };

    const rightClickNodeFn: (payload: SigmaNodeEventPayload) => void = payload => {
        payload.preventSigmaDefault();
        payload.event.original.preventDefault();

        createEdge(payload.node);
    };

    const downNodeFn: (payload: SigmaNodeEventPayload) => void = payload => {
        payload.preventSigmaDefault();

        // only the main button count
        // usually left click
        if (payload.event.original.button !== 0) return;

        startDragging(payload.node);
    };
    const mousemoveFn: (coords: MouseCoords) => void = coords => {
        if (state.mode !== "edition") return;

        // prevent sigma default (= move whole graph)
        // if we're dragging
        if (state.drag.isDragging) {
            coords.preventSigmaDefault();
            dragNode(coords.x, coords.y);
        }
    };
    const mouseupFn: (coords: MouseCoords) => void = coords => {
        coords.preventSigmaDefault();
        stopDragging();
    };
    const keydownFn: (e: KeyboardEvent) => void = event => {
        if (event.key !== "Delete") return;

        event.preventDefault();
        deleteSelection();
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

        res.color = "#888"

        if (state.selection?.type === "node" && node === state.selection?.key) {
            res.color = "dodgerblue";
        }

        return res;
    });

    sigma.setSetting("edgeReducer", (edge, data) => {
        if (state.mode !== "edition") return data;

        const res = { ...data };
        res.size = 4
        res.color = "#666";

        if (state.selection?.type === "edge" && edge === state.selection?.key) {
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
        sigma.setSetting("edgeReducer", (_edge, data) => data);
    };
}

export type { State };
