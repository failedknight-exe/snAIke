import { CONFIG } from "./config.js";

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        this.canvas.width = CONFIG.GRID * CONFIG.CELL;
        this.canvas.height = CONFIG.GRID * CONFIG.CELL;

        this.cell = CONFIG.CELL;
    }

    draw(game) {
        const ctx = this.ctx;
        const size = this.cell;
        const boardSize = this.canvas.width;

        ctx.clearRect(0, 0, boardSize, boardSize);
        ctx.fillStyle = "#f4f4f4";
        ctx.fillRect(0, 0, boardSize, boardSize);

        ctx.strokeStyle = "#dddddd";
        ctx.lineWidth = 1;

        for (let i = 0; i <= CONFIG.GRID; i++) {
            const position = i * size;

            ctx.beginPath();
            ctx.moveTo(position, 0);
            ctx.lineTo(position, boardSize);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, position);
            ctx.lineTo(boardSize, position);
            ctx.stroke();
        }

        if (!game) return;

        if (game.food) {
            ctx.fillStyle = "#e53935"
            ctx.fillRect(
                game.food.x * size + 3,
                game.food.y * size + 3,
                size - 6,
                size - 6
            );
        }

        game.snake.forEach((part, index) => {
            ctx.fillStyle = index === 0 ? "#00013d" : "#3957a8";

            ctx.fillRect(
                part.x * size + 2,
                part.y * size + 2,
                size - 4,
                size - 4
            );
        });

        if (game.over) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
            ctx.fillRect(0, 0, boardSize, boardSize);

            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 22px Arial";
            ctx.textAlign = "center";
            ctx.fillText("Game Over", boardSize / 2, boardSize / 2);
        }
    }
}