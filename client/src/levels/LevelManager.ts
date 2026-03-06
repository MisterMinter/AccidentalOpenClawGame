export interface LevelDef {
  id: number;
  name: string;
  world: string;
  tilemapKey: string;
  tilesetKey: string;
  tilesetImage: string;
  bgColor: string;
  musicKey: string;
  enemyTypes: string[];
  bossId?: string;
  nextLevel?: number;
}

export const LEVELS: LevelDef[] = [
  { id: 1, name: 'La Roca', world: 'Prison', tilemapKey: 'map_level1', tilesetKey: 'tiles_prison', tilesetImage: 'tiles/prison.png', bgColor: '#1a1a2e', musicKey: 'music_prison', enemyTypes: ['officer', 'soldier', 'rat'] },
  { id: 2, name: 'The Battlements', world: 'Prison', tilemapKey: 'map_level2', tilesetKey: 'tiles_prison', tilesetImage: 'tiles/prison.png', bgColor: '#1a1a3e', musicKey: 'music_prison', enemyTypes: ['officer', 'soldier'], bossId: 'le_rauxe', nextLevel: 3 },
  { id: 3, name: 'The Footpath', world: 'Woods', tilemapKey: 'map_level3', tilesetKey: 'tiles_woods', tilesetImage: 'tiles/woods.png', bgColor: '#0d2b1a', musicKey: 'music_woods', enemyTypes: ['cutthroat', 'robber_thief', 'rat'] },
  { id: 4, name: 'Dark Woods', world: 'Woods', tilemapKey: 'map_level4', tilesetKey: 'tiles_woods', tilesetImage: 'tiles/woods.png', bgColor: '#0a1f14', musicKey: 'music_woods', enemyTypes: ['cutthroat', 'robber_thief'], bossId: 'katherine', nextLevel: 5 },
  { id: 5, name: 'The Township', world: 'Town', tilemapKey: 'map_level5', tilesetKey: 'tiles_town', tilesetImage: 'tiles/town.png', bgColor: '#2b1d0e', musicKey: 'music_town', enemyTypes: ['town_guard', 'seagull', 'guard_dog'] },
  { id: 6, name: 'Puerto Lobos', world: 'Town', tilemapKey: 'map_level6', tilesetKey: 'tiles_town', tilesetImage: 'tiles/town.png', bgColor: '#3b2d1e', musicKey: 'music_town', enemyTypes: ['town_guard', 'guard_dog'], bossId: 'wolvington', nextLevel: 7 },
  { id: 7, name: 'The Docks', world: 'Docks', tilemapKey: 'map_level7', tilesetKey: 'tiles_docks', tilesetImage: 'tiles/docks.png', bgColor: '#1a2a3e', musicKey: 'music_docks', enemyTypes: ['bear_sailor', 'red_tail_pirate', 'crab'] },
  { id: 8, name: 'The Shipyard', world: 'Docks', tilemapKey: 'map_level8', tilesetKey: 'tiles_docks', tilesetImage: 'tiles/docks.png', bgColor: '#1a2a4e', musicKey: 'music_docks', enemyTypes: ['bear_sailor', 'red_tail_pirate'], bossId: 'gabriel', nextLevel: 9 },
  { id: 9, name: "Pirate's Cove", world: 'Cliffs', tilemapKey: 'map_level9', tilesetKey: 'tiles_cliffs', tilesetImage: 'tiles/cliffs.png', bgColor: '#2e1a1a', musicKey: 'music_cliffs', enemyTypes: ['peg_leg', 'crazy_hook'] },
  { id: 10, name: 'The Cliffs', world: 'Cliffs', tilemapKey: 'map_level10', tilesetKey: 'tiles_cliffs', tilesetImage: 'tiles/cliffs.png', bgColor: '#3e2a1a', musicKey: 'music_cliffs', enemyTypes: ['peg_leg', 'crazy_hook'], bossId: 'marrow', nextLevel: 11 },
  { id: 11, name: 'The Caverns', world: 'Caves', tilemapKey: 'map_level11', tilesetKey: 'tiles_caves', tilesetImage: 'tiles/caves.png', bgColor: '#0a1a2e', musicKey: 'music_caves', enemyTypes: ['mercat', 'siren'] },
  { id: 12, name: 'The Undersea Caves', world: 'Caves', tilemapKey: 'map_level12', tilesetKey: 'tiles_caves', tilesetImage: 'tiles/caves.png', bgColor: '#0a0a2e', musicKey: 'music_caves', enemyTypes: ['mercat', 'siren'], bossId: 'aquatis', nextLevel: 13 },
  { id: 13, name: 'Tiger Island', world: 'Temple', tilemapKey: 'map_level13', tilesetKey: 'tiles_temple', tilesetImage: 'tiles/temple.png', bgColor: '#2e2a0a', musicKey: 'music_temple', enemyTypes: ['tiger_guard', 'bear_sailor'] },
  { id: 14, name: 'The Temple', world: 'Temple', tilemapKey: 'map_level14', tilesetKey: 'tiles_temple', tilesetImage: 'tiles/temple.png', bgColor: '#3e3a1a', musicKey: 'music_temple', enemyTypes: ['tiger_guard'], bossId: 'omar' },
];

export class LevelManager {
  private currentLevel = 1;
  private unlockedLevels = 1;

  constructor() {
    this.loadProgress();
  }

  getCurrentLevel(): LevelDef {
    return LEVELS[this.currentLevel - 1];
  }

  getLevelById(id: number): LevelDef | undefined {
    return LEVELS.find(l => l.id === id);
  }

  setLevel(id: number): void {
    this.currentLevel = id;
  }

  completeLevel(): number | null {
    const level = this.getCurrentLevel();
    if (level.nextLevel) {
      this.unlockedLevels = Math.max(this.unlockedLevels, level.nextLevel);
      this.currentLevel = level.nextLevel;
      this.saveProgress();
      return level.nextLevel;
    }
    if (this.currentLevel < LEVELS.length) {
      const next = this.currentLevel + 1;
      this.unlockedLevels = Math.max(this.unlockedLevels, next);
      this.currentLevel = next;
      this.saveProgress();
      return next;
    }
    return null;
  }

  getUnlockedLevels(): number {
    return this.unlockedLevels;
  }

  private saveProgress(): void {
    localStorage.setItem('openclaw_progress', JSON.stringify({
      unlocked: this.unlockedLevels,
      current: this.currentLevel,
    }));
  }

  private loadProgress(): void {
    try {
      const data = localStorage.getItem('openclaw_progress');
      if (data) {
        const parsed = JSON.parse(data);
        this.unlockedLevels = parsed.unlocked ?? 1;
        this.currentLevel = parsed.current ?? 1;
      }
    } catch {
      // start fresh
    }
  }
}
