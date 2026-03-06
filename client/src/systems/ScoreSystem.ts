export interface ScoreEntry {
  name: string;
  score: number;
  level: number;
}

export class ScoreSystem {
  private highScores: ScoreEntry[] = [];

  constructor() {
    this.loadHighScores();
  }

  private loadHighScores(): void {
    try {
      const data = localStorage.getItem('openclaw_highscores');
      if (data) {
        this.highScores = JSON.parse(data);
      }
    } catch {
      this.highScores = [];
    }
  }

  saveHighScore(entry: ScoreEntry): void {
    this.highScores.push(entry);
    this.highScores.sort((a, b) => b.score - a.score);
    this.highScores = this.highScores.slice(0, 10);
    localStorage.setItem('openclaw_highscores', JSON.stringify(this.highScores));
  }

  getHighScores(): ScoreEntry[] {
    return [...this.highScores];
  }

  isHighScore(score: number): boolean {
    return this.highScores.length < 10 || score > (this.highScores[this.highScores.length - 1]?.score ?? 0);
  }
}
