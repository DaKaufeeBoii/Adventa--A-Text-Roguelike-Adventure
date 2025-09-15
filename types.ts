// Fix: Defining types for the application
export interface PlayerStats {
  name: string;
  characterClass: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  inventory: string[];
}

export interface StoryChoice {
  story: string;
  playerStats: PlayerStats;
  possibleActions: string[];
  isGameOver: boolean;
  imagePrompt: string;
}
