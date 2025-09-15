
export interface GameStep {
  description: string;
  health: number;
  inventory: string[];
  possibleActions: string[];
  imagePrompt: string;
  enemy: {
    name: string;
    health: number;
  } | null;
}

export interface PlayerState {
  health: number;
  inventory: string[];
}
