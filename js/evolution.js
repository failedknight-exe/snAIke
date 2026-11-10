import { CONFIG } from "./config.js";

import { createBrain, copyBrain, crossoverBrain, mutateBrain, decide } from "./brain.js";

import { SnakeGame } from "./snake.js";
import { calculateFitness } from "./fitness.js";

export class Evolution {
    constructor() {
        this.populationSize = CONFIG.POPULATION;
        this.population = [];

        this.generation = 0;
        this.evaluated = 0;

        this.champion = null;
        this.bestFitness = -Infinity;
        this.bestScore = 0;
        this.averageScore = 0;

        this.activeGames = [];
        this.results = [];
        this.running = false;

        this.newPopulation(this.populationSize);
    }

    newPopulation(size) {
        this.populationSize = size;

        this.population = Array.from( { length: size}, () => createBrain() );

        this.generation = 0;
        this.evaluated = 0;
        this.champion = null;
        this.bestFitness = -Infinity;
        this.bestScore = 0;
        this.averageScore = 0;
        this.results = [];

        this.loadBatch();
    }

    loadBatch() {
        this.activeGames = [];

        const end = Math.min( this.evaluated + 3, this.populationSize );

        for (let i = this.evaluated; i < end; i++) {
            this.activeGames.push({ brain: this.population[i], game: new SnakeGame({ trainingMode: true}), finished: false, fitness: 0 });
        }
    }

    stepBatch() {
        if (!this.running) return;

        for (const individual of this.activeGames) {
            if (individual.finished) continue;

            const action = decide( individual.game, individual.brain );

            individual.game.step(action);

            if (individual.game.over) {
                this.finishIndividual(individual);
            }
        }

        if (this.activeGames.every(item => item.finished)) {
            this.evaluated += this.activeGames.length;

            if (this.evaluated >= this.populationSize) {
                this.finishGeneration();
            } else {
                this.loadBatch();
            }
        }
    }

    finishIndividual(individual) {
        individual.finished = true;
        individual.fitness = calculateFitness(individual.game);
        this.bestScore = Math.max(this.bestScore, individual.game.score);

        this.results.push({
            brain: individual.brain,
            fitness: individual.fitness,
            score: individual.game.score,
            steps: individual.game.steps
        });

        if (individual.fitness > this.bestFitness) {
            this.bestFitness = individual.fitness;
            this.champion = copyBrain(individual.brain);
        }
    }

    finishGeneration() {
        this.results.sort( (a, b) => b.fitness - a.fitness );

        const totalScore = this.results.reduce( (sum, result) => sum + result.score, 0 );

        this.averageScore = 
            this.results.length > 0
                ? totalScore / this.results.length
                : 0;
        
        this.generation++;

        this.save();

        this.population = this.makeNextGeneration();

        this.evaluated = 0;
        this.results = [];

        this.loadBatch();
    }

    makeNextGeneration() {
        const next = [];

        const eliteCount = Math.min( CONFIG.ELITE_COUNT, this.results.length );

        for (let i = 0; i < eliteCount; i++) {
            next.push(copyBrain(this.results[i].brain));
        }

        const parentPool = this.results.slice(0, Math.min(CONFIG.PARENT_POOL, this.results.length));

        while (next.length < this.populationSize) {
            const a = parentPool[
                Math.floor(Math.random() * parentPool.length)
            ];

            const b = parentPool[
                Math.floor(Math.random() * parentPool.length)
            ];

            const child = crossoverBrain(a.brain, b.brain);

            next.push(mutateBrain(child));
        }

        return next;
    }

    save() {
        if (!this.champion) return;

        try {
            localStorage.setItem(
                CONFIG.STORAGE_KEY,
                JSON.stringify({
                    champion: this.champion,
                    bestFitness: this.bestFitness,
                    bestScore: this.bestScore,
                    generation: this.generation
                })
            );
        } catch (error) {
            console.warn("Could not save AI.", error);
        }
    }

    load() {
        try {
            const saved = localStorage.getItem(CONFIG.STORAGE_KEY);

            if(!saved) return false;

            const data = JSON.parse(saved);

            if ( !Array.isArray(data.champion?.weights) || data.champion?.weights.length !== 147) {
                return false;
            }

            this.champion = copyBrain(data.champion);
            this.bestFitness = data.bestFitness ?? -Infinity;
            this.bestScore = data.bestScore ?? 0;
            this.generation = data.generation ?? 0;

            return true;
        } catch {
            return false;
        }
    }
}