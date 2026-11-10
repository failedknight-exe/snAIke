import { CONFIG } from "./config.js";

export const DIRECTIONS = [
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 }
];

export function turnDirection(direction, action) {
    if (action === 1) return (direction + 3) % 4;
    if (action === 2) return (direction + 1) % 4;

    return direction;
}

export class SnakeGame {
    constructor(options = {}) {
        this.trainingMode = options.trainingMode ?? false;
        this.reset();
    }

    reset() {
        this.snake = [
            { x: 7, y: 7 },
            { x: 6, y: 7 },
            { x: 5, y: 7 }
        ];

        this.direction = 1;
        this.score = 0;
        this.steps = 0;
        this.over = false;
        this.food = null;

        this.visits = new Map();
        this.visits.set("7,7", 1);

        this.spawnFood();
    }

    spawnFood() {
        const empty = [];

        for (let y = 0; y < CONFIG.GRID; y++) {
            for (let x = 0; x < CONFIG.GRID; x++) {
                const occupied =this.snake.some(part => part.x === x && part.y === y);

                if (!occupied) {
                    empty.push({ x, y });
                }
            }
        }

        if (empty.length === 0) {
            this.over = true;
            this.food = null;
            return;
        }

        const index = Math.floor(Math.random() * empty.length);
        this.food = empty[index];
    }

    getNextPosition(direction) {
        const head = this.snake[0];
        const vector = DIRECTIONS[direction];

        return {
            x: head.x + vector.x,
            y: head.y + vector.y 
        };
    }

    isWall(position) {
        return (position.x < 0 || position.y < 0 || position.x >= CONFIG.GRID || position.y >= CONFIG.GRID);
    }

    isDanger(direction) {
        if (this.over) return 1;

        const next = this.getNextPosition(direction);

        if (this.isWall(next)) return 1;

        const eating = this.food !== null && next.x === this.food.x && next.y === this.food.y;

        const body = eating ? this.snake : this.snake.slice(0, -1);

        return body.some(part => part.x === next.x && part.y === next.y) ? 1 : 0;
    }

    getInputs() {
        const head = this.snake[0];

        const left = (this.direction + 3) % 4;
        const right = (this.direction + 1) % 4;

        const forwardVector = DIRECTIONS[this.direction];
        const rightVector = DIRECTIONS[right];

        if (!this.food) {
            return [0, 0, 0, 0, 0, 0, 0, 1];
        }

        const dx = this.food.x - head.x;
        const dy = this.food.y - head.y;

        const distance = Math.max(1, Math.sqrt(dx * dx + dy * dy));

        return [
            this.isDanger(this.direction),
            this.isDanger(left),
            this.isDanger(right),

            (dx * forwardVector.x + dy * forwardVector.y) / distance,
            (dx * rightVector.x + dy * rightVector.y) / distance,

            head.x / (CONFIG.GRID - 1),
            head.y / (CONFIG.GRID - 1),

            1
        ];
    }

    step(action) {
        if (this.over) return;

        const nextDirection = turnDirection(this.direction, action);

        const next = this.getNextPosition(nextDirection);

        if (this.isWall(next)) {
            this.direction = nextDirection;
            this.over = true;
            return;
        }

        const eating = this.food !== null && next.x === this.food.x && next.y === this.food.y;

        const body = eating ? this.snake : this.snake.slice(0, -1);

        const hitBody = body.some(part => part.x === next.x && part.y === next.y);

        if (hitBody) {
            this.direction = nextDirection;
            this.over = true;
            return;
        }

        this.direction = nextDirection;
        this.snake.unshift(next);

        if (eating) {
            this.score++;
            this.spawnFood();
        } else {
            this.snake.pop();
        }

        const key = `${next.x},${next.y}`;

        this.visits.set(key, (this.visits.get(key) || 0) + 1);

        this.steps++;

        if (this.trainingMode && this.steps >= CONFIG.MAX_STEPS) {
            this.over = true;
        }
    }
}