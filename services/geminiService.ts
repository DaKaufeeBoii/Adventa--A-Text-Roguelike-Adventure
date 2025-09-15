// Fix: Implemented Gemini API service for game logic
import { GoogleGenAI, Type } from "@google/genai";
import { PlayerStats, StoryChoice, EnemyStats, CombatTurnResult } from '../types';

// Per guidelines, API key is from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const textModel = 'gemini-2.5-flash';
const imageModel = 'imagen-4.0-generate-001';

const playerStatsSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        characterClass: { type: Type.STRING },
        hp: { type: Type.INTEGER },
        maxHp: { type: Type.INTEGER },
        attack: { type: Type.INTEGER },
        defense: { type: Type.INTEGER },
        inventory: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "The name of the item." },
                    description: { type: Type.STRING, description: "A one or two sentence description of the item's appearance and lore." },
                    iconPrompt: { type: Type.STRING, description: "A simple, clear prompt for generating a square icon. E.g., 'A glowing blue potion in a glass vial, fantasy icon'." }
                },
                required: ["name", "description", "iconPrompt"]
            }
        },
    },
    required: ["name", "characterClass", "hp", "maxHp", "attack", "defense", "inventory"]
};

const enemyStatsSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        hp: { type: Type.INTEGER },
        maxHp: { type: Type.INTEGER },
        attack: { type: Type.INTEGER },
        defense: { type: Type.INTEGER },
        description: { type: Type.STRING, description: "A brief, one-sentence description of the enemy's appearance and demeanor." }
    },
    required: ["name", "hp", "maxHp", "attack", "defense", "description"]
};

// Per guidelines, define a response schema for JSON output.
const storyChoiceSchema = {
    type: Type.OBJECT,
    properties: {
        story: {
            type: Type.STRING,
            description: "A detailed, engaging, and creative paragraph of the story in a dark fantasy style. Describe what happens next, the environment, and any characters. Keep it to about 100-150 words."
        },
        playerStats: playerStatsSchema,
        possibleActions: {
            type: Type.ARRAY,
            description: "A list of 3-4 concise, creative, and relevant actions the player can take next. Examples: 'Inspect the glowing altar', 'Try to decipher the runes on the wall', 'Listen for sounds in the darkness', 'Drink the mysterious potion'.",
            items: { type: Type.STRING }
        },
        isGameOver: {
            type: Type.BOOLEAN,
            description: "Set to true if the player has died or the adventure has reached a definitive end. Otherwise, set to false."
        },
        imagePrompt: {
            type: Type.STRING,
            description: "A concise, descriptive prompt for an image generation model to create a scene image. Focus on the environment, characters, and mood. Example: 'A lone knight stands in a vast, dark cavern, illuminating ancient glowing runes on the walls with a torch, fantasy art, cinematic lighting'."
        },
        isEncounter: {
            type: Type.BOOLEAN,
            description: "Set to true if a combat encounter is starting. Otherwise, false."
        },
        enemy: {
            ...enemyStatsSchema,
            description: "If isEncounter is true, provide the stats for the enemy here. Otherwise, this can be omitted."
        },
    },
    required: ["story", "playerStats", "possibleActions", "isGameOver", "imagePrompt", "isEncounter"]
};

const combatTurnSchema = {
    type: Type.OBJECT,
    properties: {
        combatLog: {
            type: Type.STRING,
            description: "A dramatic, turn-based description of the combat round. Describe the player's action and the enemy's counter-attack. About 50-75 words."
        },
        playerStats: playerStatsSchema,
        enemyStats: enemyStatsSchema,
        isCombatOver: {
            type: Type.BOOLEAN,
            description: "Set to true if the combat has ended (player won, lost, or fled)."
        },
        outcome: {
            type: Type.STRING,
            description: "The result of the turn. Can be 'player_win', 'player_lose', 'fled', or 'ongoing'."
        }
    },
    required: ["combatLog", "playerStats", "enemyStats", "isCombatOver", "outcome"]
};

const systemInstruction = `You are the Dungeon Master for a text-based roglike adventure game called 'Adventa'. Your goal is to create a captivating, challenging, and immersive experience. Respond in a dark fantasy style. Be descriptive and engaging. Pay strict attention to correct spelling and grammar. The player's health (hp) should decrease when they take damage and can be restored with items or events. A player dies if their hp reaches 0. Ensure the player's stats change logically based on events. When giving a player an item, add it to their inventory array with a name, a detailed description, and a simple prompt for generating its icon. Occasionally (about a 25% chance), you will trigger a random enemy encounter based on the player's action and location. If an encounter occurs, set 'isEncounter' to true, describe the enemy in the 'story' field, provide its stats in the 'enemy' field, and the 'possibleActions' should be combat-oriented like 'Fight', 'Attempt to flee', 'Try to negotiate'. Always adhere to the JSON schema.`;

const generateStoryContent = async (prompt: string): Promise<StoryChoice> => {
    const response = await ai.models.generateContent({
        model: textModel,
        contents: prompt,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: storyChoiceSchema,
            temperature: 0.8,
            topP: 0.95,
        },
    });
    
    // Per guidelines, use response.text to get the text output
    const jsonString = response.text.trim();
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("Failed to parse JSON response:", jsonString);
        throw new Error("The Dungeon Master seems to be confused. The story took an unexpected turn.");
    }
};


export const startGame = async (name: string, characterClass: string): Promise<StoryChoice> => {
    const prompt = `Create the opening scene for a new adventure. The hero's name is ${name}, a ${characterClass}. They are just starting their journey into a dark, mysterious world. Generate their initial stats. A ${characterClass} should have stats appropriate for their class (e.g., Warrior: high HP/attack, Mage: low HP but potential for magic, Rogue: balanced with higher defense/dexterity). MaxHP should be between 15 and 30.`;
    return generateStoryContent(prompt);
};

export const processPlayerAction = async (currentStats: PlayerStats, history: string[], action: string): Promise<StoryChoice> => {
    const prompt = `The player, ${currentStats.name} the ${currentStats.characterClass}, decides to '${action}'.
    
    Current Player Stats:
    ${JSON.stringify(currentStats, null, 2)}

    Recent story events:
    ${history.slice(-5).join('\n')}

    Based on this action, describe what happens next. Update the player's stats and inventory as needed. Provide new actions. Remember to be challenging but fair.`;
    return generateStoryContent(prompt);
};

export const processCombatAction = async (playerStats: PlayerStats, enemyStats: EnemyStats, action: string): Promise<CombatTurnResult> => {
    const prompt = `COMBAT TURN:
    The player, ${playerStats.name} (${playerStats.hp}/${playerStats.maxHp} HP), is fighting a ${enemyStats.name} (${enemyStats.hp}/${enemyStats.maxHp} HP).
    
    Player's Current Stats: ${JSON.stringify(playerStats)}
    Enemy's Current Stats: ${JSON.stringify(enemyStats)}

    The player chooses to '${action}'.

    Describe the outcome of this turn. Incorporate critical hits and misses for both the player and the enemy.
    - Critical Hit: A small chance (e.g., 10%) to deal double damage. Describe it vividly in the combatLog (e.g., "A critical strike!", "A devastating blow!").
    - Miss: A small chance (e.g., 10%) to deal no damage. Describe this clearly in the combatLog (e.g., "You swing wildly and miss!", "The creature's attack goes wide!").
    - Normal Hit: Calculate damage based on attack and defense stats (e.g., damage = attacker.attack - defender.defense, with a minimum of 1 damage).
    
    Update both player and enemy HP based on the outcome. Determine if the combat is over. If the player tries to flee, there should be a chance of failure.`;
    
    const response = await ai.models.generateContent({
        model: textModel,
        contents: prompt,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: combatTurnSchema,
            temperature: 0.7,
        },
    });

    const jsonString = response.text.trim();
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("Failed to parse JSON response for combat:", jsonString);
        throw new Error("The fury of battle is disorienting. The turn's outcome is unclear.");
    }
};

export const generateSceneImage = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateImages({
        model: imageModel,
        prompt: `${prompt}, dark fantasy, epic, cinematic, detailed`,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '16:9',
        },
    });

    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};

export const generateItemIcon = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateImages({
        model: imageModel,
        prompt: `${prompt}, fantasy item, game icon, simple, on a plain background`,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png', // Use PNG for potential transparency
          aspectRatio: '1:1',
        },
    });

    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return `data:image/png;base64,${base64ImageBytes}`;
};

export const getItemUsefulness = async (itemName: string, itemDescription: string, context: string): Promise<string> => {
    const prompt = `The player is looking at an item in their inventory.
    Item Name: ${itemName}
    Item Description: ${itemDescription}
    
    Current Situation: "${context}"
    
    Briefly, in one or two sentences, describe how this item might be useful in the current situation or for upcoming challenges. If it has no obvious use, suggest that its purpose is not yet clear. Be creative and hint at possibilities without giving everything away.`;

    const response = await ai.models.generateContent({
        model: textModel,
        contents: prompt,
        config: {
            temperature: 0.6,
        },
    });

    return response.text.trim();
};