// Fix: Defining types for the application

export interface InventoryItem {
  name: string;
  description: string;
  iconPrompt: string;
  iconUrl?: string; // Will be generated on the client
}

export interface PlayerStats {
  name: string;
  characterClass: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  inventory: InventoryItem[];
}

export interface EnemyStats {
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  description: string;
}

export interface StoryChoice {
  story: string;
  playerStats: PlayerStats;
  possibleActions: string[];
  isGameOver: boolean;
  imagePrompt: string;
  isEncounter?: boolean;
  enemy?: EnemyStats;
}

export interface CombatTurnResult {
    combatLog: string;
    playerStats: PlayerStats;
    enemyStats: EnemyStats;
    isCombatOver: boolean;
    outcome: 'player_win' | 'player_lose' | 'ongoing' | 'fled';
}

export interface SaveState {
  playerStats: PlayerStats;
  dialogue: string;
  possibleActions: string[];
  imageUrl: string | null;
  history: string[];
  currentImagePrompt: string;
  appState: 'CHARACTER_CREATION' | 'LOADING' | 'GAME' | 'GAME_OVER' | 'COMBAT';
  enemyStats: EnemyStats | null;
}