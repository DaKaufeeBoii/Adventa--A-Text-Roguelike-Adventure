// New file: Service to manage ambient audio
const audioFiles: { [key: string]: string } = {
    dungeon: 'assets/sounds/dungeon.mp3',
    forest: 'assets/sounds/forest.mp3',
    battle: 'assets/sounds/battle.mp3',
    peaceful: 'assets/sounds/peaceful.mp3',
    default: 'assets/sounds/default.mp3',
};

class AudioService {
    private currentAudio: HTMLAudioElement | null = null;
    private targetVolume: number = 0.3;
    private isMuted: boolean = false;
    private hasStarted: boolean = false;

    constructor() {
        if (typeof window !== 'undefined') {
            this.currentAudio = new Audio();
            this.currentAudio.loop = true;
            this.currentAudio.volume = 0;
        }
    }

    public start() {
        if (this.hasStarted || !this.currentAudio) return;
        this.currentAudio.play().catch(e => console.error("Audio play failed:", e));
        this.hasStarted = true;
    }

    private determineSceneType(prompt: string): string {
        const lowerPrompt = prompt.toLowerCase();
        if (lowerPrompt.includes('battle') || lowerPrompt.includes('fight') || lowerPrompt.includes('monster') || lowerPrompt.includes('combat')) return 'battle';
        if (lowerPrompt.includes('dungeon') || lowerPrompt.includes('cavern') || lowerPrompt.includes('crypt') || lowerPrompt.includes('underground')) return 'dungeon';
        if (lowerPrompt.includes('forest') || lowerPrompt.includes('woods') || lowerPrompt.includes('jungle') || lowerPrompt.includes('swamp')) return 'forest';
        if (lowerPrompt.includes('village') || lowerPrompt.includes('tavern') || lowerPrompt.includes('town') || lowerPrompt.includes('peaceful')) return 'peaceful';
        return 'default';
    }

    private fade(target: number, duration: number): Promise<void> {
        return new Promise(resolve => {
            if (!this.currentAudio) return resolve();
            const startVolume = this.currentAudio.volume;
            const delta = target - startVolume;
            if (delta === 0) return resolve();
            
            const tickRate = 50;
            const ticks = Math.floor(duration / tickRate);
            let currentTick = 0;

            const timer = setInterval(() => {
                currentTick++;
                const newVolume = startVolume + (delta * (currentTick / ticks));
                if (this.currentAudio) {
                    this.currentAudio.volume = Math.max(0, Math.min(1, newVolume));
                }
                if (currentTick >= ticks) {
                    clearInterval(timer);
                    if (this.currentAudio) this.currentAudio.volume = target;
                    resolve();
                }
            }, tickRate);
        });
    }

    public async playAmbiance(prompt: string) {
        if (!this.hasStarted || !this.currentAudio) return;

        const sceneType = this.determineSceneType(prompt);
        const newSrc = audioFiles[sceneType];

        const fullUrl = new URL(newSrc, window.location.href).href;
        if (this.currentAudio.src === fullUrl && !this.currentAudio.paused) return;

        await this.fade(0, 500);
        
        if (this.currentAudio.src !== fullUrl) {
            this.currentAudio.src = newSrc;
            await this.currentAudio.load();
            await this.currentAudio.play().catch(e => console.error("Audio play failed:", e));
        }
        
        if (!this.isMuted) {
            await this.fade(this.targetVolume, 500);
        }
    }

    public async toggleMute() {
        if (!this.currentAudio) return;
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            await this.fade(0, 300);
        } else if (!this.currentAudio.paused) {
            await this.fade(this.targetVolume, 300);
        }
    }
}

export const audioService = new AudioService();
