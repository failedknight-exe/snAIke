import { CONFIG } from "./config.js";
import { Evolution } from ".evolution.js";
import { SnakeGame } from "./snake.js";
import { decideWIthDetails, copyBrain } from "./brain.js";
import { Renderer } from "./renderer.js";
import { NetworkView } from "./network-view.js";
import { PlayeInput } from "./input.js";

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

const trainingRenderers = [0, 1, 2].map(index => new Renderer($(`training-canvas-$(index)`)));

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