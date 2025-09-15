
import { GoogleGenAI, Type } from "@google/genai";
import type { GameStep } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const textModel = "gemini-2.5-flash";
const imageModel = "imagen-4.0-generate-001";

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        description: {
            type: Type.STRING,
            description: "A vivid, atmospheric description of the current scene, event, or outcome of the player's action. Should be 2-4 sentences."
        },
        health: {
            type: Type.INTEGER,
            description: "The player's current health points. This should be a number between 0 and 100. It can decrease from damage or increase from potions/rest."
        },
        inventory: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "An array of strings representing the player's inventory items. Add or remove items based on the action."
        },
        possibleActions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of 3-5 suggested actions the player can take next, like 'Go north through the crumbling archway' or 'Inspect the glowing runes'."
        },
        imagePrompt: {
            type: Type.STRING,
            description: "A concise, descriptive prompt (max 15 words) for an AI image generator. Example: 'Dark, crumbling castle throne room, single beam of light, epic fantasy art'."
        },
        enemy: {
            type: Type.OBJECT,
            nullable: true,
            properties: {
                name: { type: Type.STRING, description: "The name of the enemy in the scene." },
                health: { type: Type.INTEGER, description: "The enemy's current health." }
            },
            description: "An object representing the enemy if one is present, otherwise null."
        }
    },
    required: ["description", "health", "inventory", "possibleActions", "imagePrompt", "enemy"]
};

const getSystemInstruction = (history: string[], inventory: string[], health: number) => {
    return `You are the Dungeon Master for a text-based roguelike action fantasy adventure game. Your goal is to create a dynamic, challenging, and immersive world.
- The theme is dark action fantasy. Descriptions should be atmospheric and engaging.
- Player health is ${health}/100.
- Player inventory: ${inventory.join(', ') || 'empty'}.
- Game History (for context): ${history.slice(-5).join('\n')}.
- Based on the player's last action, generate the next step of the adventure.
- If the player fights, calculate damage and update health for both player and enemy. Be creative with combat descriptions.
- If the player explores, describe the new location or discovery.
- The game ends if player health reaches 0.
- Respond ONLY with a valid JSON object that adheres to the provided schema. Do not add any other text or markdown formatting.`;
};


export const generateAdventureStep = async (history: string[], playerAction: string, inventory: string[], health: number): Promise<GameStep> => {
    try {
        const result = await ai.models.generateContent({
            model: textModel,
            contents: playerAction,
            config: {
                systemInstruction: getSystemInstruction(history, inventory, health),
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
        const jsonText = result.text.trim();
        const parsedResponse = JSON.parse(jsonText) as GameStep;
        return parsedResponse;
    } catch (error) {
        console.error("Error generating adventure step:", error);
        throw new Error("The Dungeon Master is bewildered and cannot respond. Please try another action.");
    }
};

export const generateSceneImage = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateImages({
            model: imageModel,
            prompt: `Masterpiece, award-winning fantasy art, cinematic lighting, ${prompt}`,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '16:9',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        }
        throw new Error("No image was generated.");
    } catch (error) {
        console.error("Error generating scene image:", error);
        // Return a placeholder or default image on failure
        return `https://picsum.photos/1024/576?random=${Date.now()}`;
    }
};
