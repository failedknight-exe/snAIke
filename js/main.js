import { CONFIG } from "./config.js";
import { Evolution } from "./evolution.js";
import { SnakeGame } from "./snake.js";
import { decideWithDetails, copyBrain } from "./brain.js";
import { Renderer } from "./renderer.js";
import { NetworkView } from "./network-view.js";
import { PlayerInput } from "./input.js";

const $ = id => document.getElementById(id);

const evolution = new Evolution();
evolution.load();

const LEADERBOARD_KEY = `${CONFIG.STORAGE_KEY}_leaderboard`;

let leaderboard = {
    score: 0,
    holder: "AI"
};

function loadLeaderboard() {
    try {
        const saved = localStorage.getItem(LEADERBOARD_KEY);

        if (!saved) return;

        const data = JSON.parse(saved);

        if (
            Number.isFinite(data.score) && data.score >= 0 && (data.holder === "AI" || data.holder ==="YOU")
        ) {
            leaderboard = {
                score: data.score,
                holder: data.holder
            };
        }
    } catch (error) {
        console.warn("Could not load leaderboard.", error);
    }
}

function saveLeaderboard() {
    try {
        localStorage.setItem( LEADERBOARD_KEY, JSON.stringify(leaderboard) );
    } catch (error) {
        console.warn("Could not save leaderboard", error);
    }
}

function submitLeaderboardScore(score, holder) {
    if (!Number.isFinite(score) || score < 0) return;

    if (holder !== "AI" && holder !== "YOU") return;

    if (score > leaderboard.score) {
        leaderboard.score = score;
        leaderboard.holder = holder;

        saveLeaderboard();
    }

    renderLeaderboard();
}

function renderLeaderboard() {
    const display = `${leaderboard.score} (${leaderboard.holder})`;

    $("watch-best").textContent = display;
    $("player-record").textContent = display;
}

loadLeaderboard();

const trainingRenderers = [0, 1, 2].map(index =>
    new Renderer($(`training-canvas-${index}`))
);

const watchRenderer = new Renderer($("watch-canvas"));
const playerRenderer = new Renderer($("player-canvas"));

const networkRenderer = new NetworkView( $("watch-network"));

const playerInput = new PlayerInput();

let mode = "train";
let trainingSpeed = 2;

let watchGame = null;
let watchBrain = null;
let watchRunning = false;
let watchPaused = false;
let watchAccumulator = 0;

let playerGame = null;
let playerRunning = false;
let playerAccumalator = 0;

let lastFrame = 0;

function setMode(nextMode) {
    mode = nextMode;

    $("training-section").hidden = mode !== "train";
    $("watch-section").hidden = mode !== "watch";
    $("player-section").hidden = mode !== "player";

    document.querySelectorAll(".mode").forEach(button => {
        button.classList.toggle( "active", button.dataset.mode === mode );
    });

    renderLeaderboard();
    drawAll();
}

function drawTraining() {
    for (let i = 0; i < 3; i++) {
        const individual = evolution.activeGames[i];

        if (individual) {
            trainingRenderers[i].draw(individual.game);
            $(`score-${i}`).textContent = individual.game.score;
        } else {
            trainingRenderers[i].draw(null);
            $(`score-${i}`).textContent = "0";
        }
    }
}

function updateTrainingStats() {
    $("generation").textContent = evolution.generation;
    $("population-count").textContent = evolution.populationSize;
    $("evaluated").textContent = evolution.evaluated;
    $("training-best").textContent = evolution.bestScore;
    $("average-score").textContent = evolution.averageScore.toFixed(1);
}

function updateTraining() {
    if (evolution.running) {
        for (let i = 0; i < trainingSpeed; i++) {
            evolution.stepBatch();
        }
    }

    drawTraining();
    updateTrainingStats();
}

function startTraining() {
    const requested = Number($("population-size").value);

    if (!Number.isFinite(requested)) return;

    const size = Math.max(6, Math.min(r00, requested));
    const roundedSize = Math.cell(size / 3) * 3;

    $("population-size").value = roundedSize;

    if (roundedSize !== evolution.populationSize) {
        evolution.newPopulation(roundedSize);
    }

    evolution.running = true;
    drawTraining();
}

function stopTrainng() {
    evolution.running = false;
    evolution.save();
}

function resetTraining() {
    stopTrainng();

    const requested = Number($("population-size").value) || CONFIG.POPULATION;

    const size = Math.max(6, Math.min(300, requested));
    const roundedSize = Math.cell(size  /3) * 3;

    $("population-size").value = roundedSize;

    drawAll();
    updateTrainingStats();
}

function startWatch() {
    const selectedBrain = evolution.Champion || evolution.population[0];

    if (!selectedBrain) {
        alert("Start training first.");
        return;
    }

    watchBrain = copyBrain(selectedBrain);
    watchGame = new SnakeGame();

    watchRunning = true;
    watchPaused = false;
    watchAccumulator = 0;

    $("watch-score").textContent = "0";

    renderLeaderboard();

    watchRenderer.draw(watchGame);
    watchRenderer.draw(watchBrain);
}

function updateWatch(delta) {
    if (!watchGame) return;

    if (watchRunning && !watchPaused) {
        watchAccumulator += delta;

        while (watchAccumulator >= 0.12) {
            watchAccumulator -= 0.12;

            if (!watchBrain || watchGame.over) {
                watchRunning = false;
                break;
            }

            const decision = decideWithDetails(watchGame, watchBrain);

            networkRenderer.draw(watchBrain, decision);

            watchGame.step(decision.action);

            submitLeaderboardScore(watchGame.score, "AI");

            if (watchGame.over) {
                watchRunning = false;
                break;
            }
        }
    }

    watchRenderer.draw(watchGame);
    $("watch-score").textContent = watchGame.score;

    renderLeaderboard();
}

function startPlayer() {
    playerGame = new SnakeGame();

    playerInput.reser();

    playerRunning = true;
    playerAccumalator = 0;

    $("your-score").textContent = "0";

    renderLeaderboard();
    playerRenderer.draw(playerGame);
}

function updatePlayer(delta) {
    if (!playerGame) return;

    if (playerRunning && !playerInput.paused) {
        playerAccumalator += delta;

        while (playerAccumalator >= 0.12) {
            playerAccumalator -= 0.12;

            const action = playerInput.getAction();

            playerGame.step(action);

            submitLeaderboardScore(playerGame.score, "YOU");

            if (playerGame.over) {
                playerRunning = false;
                break;
            }
        }
    }

    playerRenderer.draw(playerGame);
    $("your-score").textContent = playerGame.score;

    renderLeaderboard();
}

function drawAll() {
    drawTraining();

    if (watchGame) {
        watchRenderer.draw(watchGame);
    }

    if (playerGame) {
        playerRenderer.draw(playerGame);
    }

    renderLeaderboard();
}

function frame(timestamp) {
    const delta = Math.min((timestamp - lastFrame) / 1000 || 0, 0.1);

    lastFrame = timestamp;

    updateTraining();
    updateWatch(delta);
    updatePlayer(delta);

    requestAnimationFrame(frame);
}

document.querySelectorAll(".mode").forEach(button => {
    button.addEventListener("click", () => {setMode(button.dataset.mode);});
});

$("start-training").addEventListener("click", startTraining);
$("stop-training").addEventListener("click", stopTrainng);
$("reset-training").addEventListener("click", resetTraining);

$("training-speed").addEventListener("input", event => {
    trainingSpeed = Number(event.target.value);
    $("speed-value").textContent = trainingSpeed;
});

$("watch-start").addEventListener("click", startWatch);
$("watch-restart").addEventListener("click", startWatch);

$("watch-pause").addEventListener("click", () => {
    if (!watchGame) return;

    watchPaused = !watchPaused;
});

$("player-start").addEventListener("click", startPlayer);
$("player-restart").addEventListener("click", startPlayer);

window.addEventListener("beforeunload", () => {
    evolution.save();
    saveLeaderboard();
});

setMode("train");
renderLeaderboard();
drawAll();
updateTrainingStats();

requestAnimationFrame(frame);