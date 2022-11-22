import Graph from "graphology";
import Sigma from "sigma";
import { parse } from "graphology-gexf/browser";

// @ts-ignore
// TS can't seem to recognize this as an asset
import gexfUri from "./graph.gexf";

let graph: Graph;
let sigma: Sigma;

export async function loadGraph(container: HTMLElement) {
    const gexf = await fetch(gexfUri).then(res => res.text());

    graph = parse(Graph, gexf);
    sigma = new Sigma(graph, container, {
        minCameraRatio: 0.1,
        maxCameraRatio: 10,
    });

    return { graph, sigma };
}

export { graph, sigma };
