export class SeededRNG {
  constructor(seed) {
    this.seed = seed >>> 0;
  }
  
  next() {
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }
  
  nextInt(max) {
    return Math.floor(this.next() * max);
  }
  
  nextFloat(min, max) {
    return min + this.next() * (max - min);
  }
}
