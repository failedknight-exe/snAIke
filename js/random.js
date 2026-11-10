export function randomNumber(min, max) {
    return Math.random() * (max - min) + min;
}

export function randomInt(min, max) {
    return Math.floor(randomNumber(min, max + 1));
}

export function randomWeight() {
    return randomNumber(-1, 1);
}

export function randomGaussian() {
    const a = Math.max(Math.random(), 0.00001);
    const b = Math.random();

    return Math.sqrt(-2 * Math.log(a)) *  Math.cos(2 * Math.PI * b);
}

export function pickRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
}