
export class NetworkView {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        this.width = 1050;
        this.height = 1050;

        this.canvas.width = 1050;
        this.canvas.height = 1050;

        this.canvas.style.setProperty("width", "450px", "important");
        this.canvas.style.setProperty("height", "450px", "important");
        this.canvas.style.setProperty("max-width", "none", "important");
        this.canvas.style.setProperty("display", "block");

        this.inputNames = [
            "Danger Front",
            "Danger Left",
            "Danger Right",
            "Food Front",
            "Food Right",
            "Head X",
            "Head Y",
            "Bias"
        ];

        this.outputNames = [
            "Straight",
            "Left",
            "Right"
        ];

        this.draw();
    }

    resize() {
        this.width = 1050;
        this.height = 1050;

        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.draw();
    }

    draw(brain = null, decision = null) {
        const ctx = this.ctx;

        ctx.clearRect(0, 0, this.width, this.height);

        ctx.fillStyle = "#f5f6f8";
        ctx.fillRect(0, 0, this.width, this.height);

        const inputs = decision?.inputs || Array(8).fill(0);
        const hidden = decision?.hidden || Array(12).fill(0);
        const outputs = decision?.outputs || Array(3).fill(0);

        const weights =
            decision?.weights ||
            brain?.weights ||
            Array(147).fill(0);

        const inputNodes = this.createLayer(190, 8, 230, 820);
        const hiddenNodes = this.createLayer(525, 12, 150, 900);
        const outputNodes = this.createLayer(860, 3, 390, 660);

        this.drawConnections(inputNodes, hiddenNodes, weights, 0, inputs);
        this.drawConnections(hiddenNodes, outputNodes, weights, 96, hidden);

        this.drawNodes(inputNodes, inputs);
        this.drawNodes(hiddenNodes, hidden);
        this.drawNodes(outputNodes, outputs);

        this.drawLabels(inputNodes, this.inputNames);
        this.drawLabels(outputNodes, this.outputNames);

        this.drawLayerTitle(190, "INPUTS");
        this.drawLayerTitle(525, "HIDDEN LAYER");
        this.drawLayerTitle(860, "OUTPUTS");

        this.drawFooter(decision);
    }

    createLayer(x, count, top, bottom) {
        const nodes = [];

        for (let i = 0; i < count; i++) {
            const y = top + (bottom - top) * (i / (count - 1));
            nodes.push({ x, y });
        }

        return nodes;
    }

    drawConnections(fromNodes, toNodes, weights, offset, activations) {
        const ctx = this.ctx;
        let index = offset;

        for (let i = 0; i < fromNodes.length; i++) {
            const activation = activations[i] ?? 0;
            const active = Math.abs(activation) > 0.01;

            for (let j = 0; j < toNodes.length; j++) {
                const weight = weights[index] ?? 0;
                const start = fromNodes[i];
                const end = toNodes[j];

                ctx.beginPath();
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(end.x, end.y);

                if (!active) {
                    ctx.strokeStyle = "rgba(0, 0, 0, 0)";
                    ctx.lineWidth = 1;
                } else {
                    const strength = Math.min(Math.abs(activation * weight), 1);

                    ctx.strokeStyle = weight >= 0
                        ? `rgba(25, 160, 85, ${0.25 + strength * 0.75})`
                        : `rgba(220, 65, 65, ${0.25 + strength * 0.75})`;

                    ctx.lineWidth = 1 + strength * 2;
                }

                ctx.stroke();
                index++;
            }
        }
    }

    drawNodes(nodes, values) {
        const ctx = this.ctx;

        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const value = values[i] ?? 0;
            const strength = Math.min(Math.abs(value), 1);

            ctx.beginPath();
            ctx.arc(node.x, node.y, 19, 0, Math.PI * 2);

            ctx.fillStyle = value >= 0
                ? `rgba(35, 180, 100, ${0.2 + strength * 0.8})`
                : `rgba(220, 75, 75, ${0.2 + strength * 0.8})`;

            ctx.fill();

            ctx.lineWidth = 2;
            ctx.strokeStyle = "#555d66";
            ctx.stroke();

            ctx.fillStyle = "#17202a";
            ctx.font = "14px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(value.toFixed(2), node.x, node.y);
        }
    }

    drawLabels(nodes, names) {
        const ctx = this.ctx;

        ctx.font = "19px Arial";
        ctx.fillStyle = "#343b44";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";

        for (let i = 0; i < nodes.length; i++) {
            ctx.fillText(names[i], nodes[i].x - 32, nodes[i].y);
        }
    }

    drawLayerTitle(x, title) {
        const ctx = this.ctx;

        ctx.fillStyle = "#202832";
        ctx.font = "bold 25px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText(title, x, 90);
    }

    drawFooter(decision) {
        const ctx = this.ctx;

        const actionNames = ["STRAIGHT", "LEFT", "RIGHT"];
        const action = decision?.action;

        ctx.fillStyle = "#202832";
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "center";

        const label = actionNames[action] ?? "WAITING FOR AI";

        ctx.fillText(
            `SELECTED ACTION: ${label}`,
            this.width / 2,
            990
        );
    }
}
