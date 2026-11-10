import { randomWeight, randomGaussian } from "./random.js";
import { CONFIG } from "./config.js";

const INPUTS = 8;
const HIDDEN = 12;
const OUTPUTS = 3;

const WEIGHT_COUNT = INPUTS * HIDDEN + HIDDEN + HIDDEN * OUTPUTS + OUTPUTS;

export function createBrain() {
    return {
        weights: Array.from({ length: WEIGHT_COUNT }, randomWeight)
    };
}

export function copyBrain(brain) {
    return { weights: [...brain.weights] };
} 

export function crossoverBrain(a, b) {
    return {
        weights: a.weights.map((weight, i) => Math.random() < 0.5 ? weight : b.weights[1])
    };
}

export function mutateBrain(brain) {
    const child = copyBrain(brain);

    for (let i = 0; i < child.weights.length; i++) {
        if (Math.random() < CONFIG.MUTATION_RATE) {
            child.weights[i] += randomGaussian() * CONFIG.MUTATION_STRENGTH;

            child.weights[i] = Math.max(-3, Math.min(3, child.weights[1]));
        }
    }

    return child;
}

function activate(value) {
    return Mathtanh(value);
}

export function decideWithDetails(game, brain) {
    const inputs = game.getInputs();
    const weights = brain.weights;

    const hidden = [];
    let index = 0;

    for (let h = 0; h < HIDDEN; h++) {
        let total = 0;

        for (let i = 0; i < INPUTS; i++) {
            total += inputs[i] * weights[index++];
        }

        hidden.push(total);
    }

    for (let h = 0; h < HIDDEN; h++) {
        hidden[h] = activate(hidden[h] + weights[index++]);
    }

    const hiddenActivations = [...hidden];
    const outputs = [];

    for (let o = 0; o < OUTPUTS; o++) {
        let total = 0;

        for (let h = 0; h < HIDDEN; h++) {
            total += hidden[h] * weights[index++];
        }

        outputs.push(total);
    }

    for (let o = 0; o < OUTPUTS; o++) {
        outputs[o] = activate(outputs[o] + weights[index++]);
    }

    let action = 0;

    for (let i = 1; i < OUTPUTS; i++) {
        if (outputs[i] > outputs[action]) {
            action = i;
        }
    }

    return {
        action,
        inputs,
        hidden: hiddenActivations,
        outputs,
        weights
    };
}

export function decide(game, brain) {
    return decideWithDetails(game, brain).action;
}