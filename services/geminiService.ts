// Fix: Implemented Gemini API service for game logic
import { GoogleGenAI, Type } from "@google/genai";
import { PlayerStats, StoryChoice } from '../types';

// Per guidelines, API key is from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const textModel = 'gemini-2.5-flash';
const imageModel = 'imagen-4.0-generate-001';

// Per guidelines, define a response schema for JSON output.
const storyChoiceSchema = {
    type: Type.OBJECT,
    properties: {
        story: {
            type: Type.STRING,
            description: "A detailed, engaging, and creative paragraph of the story in a dark fantasy style. Describe what happens next, the environment, and any characters. Keep it to about 100-150 words."
        },
        playerStats: {
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
                    items: { type: Type.STRING }
                },
            },
            required: ["name", "characterClass", "hp", "maxHp", "attack", "defense", "inventory"]
        },
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
        }
    },
    required: ["story", "playerStats", "possibleActions", "isGameOver", "imagePrompt"]
};

const systemInstruction = `You are the Dungeon Master for a text-based roguelike adventure game called 'Adventa'. Your goal is to create a captivating, challenging, and immersive experience. Respond in a dark fantasy style. Be descriptive and engaging. The player's health (hp) should decrease when they take damage and can be restored with items or events. A player dies if their hp reaches 0. Ensure the player's stats change logically based on events. Always adhere to the JSON schema.`;

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

    // Per guidelines, get the base64 image string from generatedImages
    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};
