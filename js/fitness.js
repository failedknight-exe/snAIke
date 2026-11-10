import { CONFIG } from "./config.js";

export function calculateFitness(game) {
    return (game.score * CONFIG.FOOD_REWARD + game.steps * CONFIG.SURVIVAL_REWARD);
}