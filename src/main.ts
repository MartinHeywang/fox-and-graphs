import go from "gojs";

// has to be a function so it creates a new object each time it's called
const defaultNodeData = () => ({ status: "fox" });

const FOX_COLOR = "#E67300";
const EMPTY_COLOR = "#CC1400";
const LINK_COLOR = "white";
const FOX_FIGURE = "Ellipse";
const EMPTY_FIGURE = "RoundedRectangle"

const graphElement = document.querySelector("#graph")!;
const dayElement = document.querySelector("#day")!;

const graph = new go.Diagram(graphElement, {
    "undoManager.isEnabled": true, // activate undo-redo's
    "clickCreatingTool.archetypeNodeData": defaultNodeData(), // activate user node creation
});

graph.nodeTemplate = new go.Node("Auto").add(
    new go.Shape(FOX_FIGURE, {
        width: 100,
        height: 100,

        strokeWidth: 0,
        fill: FOX_COLOR,

        // activate user linking
        portId: "",
        fromLinkable: true,
        toLinkable: true,
    })
        .bind("figure", "figure")
        .bind("fill", "color"),
    new go.Shape("Ellipse", {
        width: 65,
        height: 65,

        strokeWidth: 1,
        fill: "rgba(255, 255, 255, .2)",
        cursor: "pointer",

        click: (_event, obj) => {
            simulateNextDay(obj.part as go.Node);
        },
    }),
    new go.TextBlock("default value", { font: "18px sans-serif" }).bind(
        "text",
        "key",
        val => {
            // for some reason, auto-generated keys are negative numbers (e.g -1, -2, -3, -4...)
            // but I want the text of the nodes to be 1, 2, 3, ...etc
            return val.toString().substring(1);
        }
    )
);

// link template: a 2px-wide white stroke w/o arrowheads
graph.linkTemplate = new go.Link({
    relinkableFrom: true,
    relinkableTo: true,
}).add(new go.Shape({ strokeWidth: 2, stroke: LINK_COLOR }));

// define here default nodes and links
graph.model = new go.GraphLinksModel(
    [defaultNodeData(), defaultNodeData()], // nodes
    [{ from: "-1", to: "-2" }] // link
);

// ============================================================================
// day counter initialisation

graph.model.startTransaction("init");
graph.addModelChangedListener(event => {
    const day = event.model?.modelData.day;
    if (day == undefined) return;

    dayElement.textContent = `Jour ${day}`;
});
graph.model.setDataProperty(graph.model.modelData, "day", 1);
graph.model.commitTransaction("init");

// ============================================================================
// days simulator

function simulateNextDay(node: go.Node) {
    const TRANSACTION_NAME = "day simulation";
    graph.model.startTransaction(TRANSACTION_NAME);

    // the node that we click on acts just like an empty one
    // so we need to mark it with a special status so it will we properly handled
    graph.model.setDataProperty(node.data, "status", "checked");

    // info: 2 steps are required to avoid references error

    /*
        - "fox" = the fox might be found in this node
        - "empty" = the fox cannot be in this node
        (- "checked" = the node that looked in the past day)
    */
    const statusMap = new Map<go.Key, "fox" | "empty">();

    // first step: compute the new status of each node and store the results in the map
    for (const allNodesIterator = graph.nodes; allNodesIterator.next(); ) {
        const node = allNodesIterator.value;

        // a node is empty if all connected nodes were themselves empty the past day
        const isEmpty = node.findNodesConnected().all(n => n.data.status !== "fox");

        statusMap.set(node.key, isEmpty ? "empty" : "fox");
    }

    // second step: apply the computed states to the node to make visible changes
    statusMap.forEach((value, key) => {
        const status = value;
        const color = value === "fox" ? FOX_COLOR : EMPTY_COLOR;
        const figure = value === "fox" ? FOX_FIGURE : EMPTY_FIGURE;

        const data = graph.model.findNodeDataForKey(key)!;

        graph.model.setDataProperty(data, "status", status);
        graph.model.setDataProperty(data, "color", color);
        graph.model.setDataProperty(data, "figure", figure);
    });

    graph.model.setDataProperty(graph.model.modelData, "day", graph.model.modelData.day + 1);

    graph.model.commitTransaction(TRANSACTION_NAME);
}
