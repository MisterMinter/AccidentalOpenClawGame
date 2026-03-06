export interface Checkpoint {
  x: number;
  y: number;
  id: string;
  activated: boolean;
}

export class CheckpointSystem {
  private checkpoints: Checkpoint[] = [];
  private lastCheckpoint: Checkpoint | null = null;

  addCheckpoint(x: number, y: number, id: string): void {
    this.checkpoints.push({ x, y, id, activated: false });
  }

  activateCheckpoint(id: string): boolean {
    const cp = this.checkpoints.find(c => c.id === id);
    if (!cp || cp.activated) return false;
    cp.activated = true;
    this.lastCheckpoint = cp;
    return true;
  }

  getSpawnPoint(): { x: number; y: number } {
    if (this.lastCheckpoint) {
      return { x: this.lastCheckpoint.x, y: this.lastCheckpoint.y };
    }
    return this.checkpoints.length > 0
      ? { x: this.checkpoints[0].x, y: this.checkpoints[0].y }
      : { x: 100, y: 200 };
  }

  reset(): void {
    this.checkpoints.forEach(cp => cp.activated = false);
    this.lastCheckpoint = null;
  }
}
