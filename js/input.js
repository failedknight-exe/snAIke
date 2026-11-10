const KEYS = {
    ArroeUp: 0,
    w: 0,
    W: 0,

    ArrowRight: 1,
    d: 1,
    D: 1,

    ArrowDown: 2,
    s: 2,
    S: 2,

    ArrowLeft: 3,
    a: 3,
    A: 3,
};

export class PlayerInput {
    constructor() {
        this.direction = 1;
        this.nextDirection = 1;
        this.paused = false;

        window.addEventListener("keydown", (event) => {
            if (event.code === "Space") {
                event.preventDefault();
                this.paused = !this.paused;
                return;
            }

            const direction = KEYS[event.key];

            if (direction === undefined) return;

            event.preventDefault();

            if ((direction + 2) % 4 === this.direction) return;

            this.nextDirection = direction;
        });
    }

    reset() {
        this.direction = 1;
        this.nextDirection = 1;
        this.paused = false;
    }

    getAction() {
        const direction = this.nextDirection;
        const action = (direction - this.direction + 4) % 4;

        this.direction = direction;

        if (action === 3) return 1;
        if (action === 1) return 2;

        return 0;
    }
}