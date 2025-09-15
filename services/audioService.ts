// New file: Service to manage ambient audio

// Using a silent, base64-encoded WAV to unlock audio context on user interaction.
// This is a minimal, universally supported audio file that prevents "no supported sources" errors.
const silentWav = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABgAAABkYXRhAgAAAAEA';

const audioFiles: { [key: string]: string } = {
    dungeon: silentWav,
    forest: silentWav,
    battle: silentWav,
    peaceful: silentWav,
    default: silentWav,
};

class AudioService {
    private audioCache: Map<string, HTMLAudioElement> = new Map();
    private currentAudio: HTMLAudioElement | null = null;
    private targetVolume: number = 0.3;
    private isMuted: boolean = false;
    private hasStarted: boolean = false;
    private isTransitioning: boolean = false;

    constructor() {
        if (typeof window !== 'undefined') {
            this.preloadAssets();
        }
    }

    private preloadAssets() {
        for (const key in audioFiles) {
            const audio = new Audio();
            audio.src = audioFiles[key];
            audio.loop = true;
            audio.preload = 'auto';
            audio.load();
            this.audioCache.set(key, audio);
        }
    }

    public start() {
        if (this.hasStarted) return;
        this.hasStarted = true;

        // "Unlock" all audio elements by playing and pausing them on the first user interaction.
        // This forces the browser to load the source and prepares them for future playback.
        this.audioCache.forEach(audio => {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    audio.pause();
                }).catch((error) => {
                    // This can fail if the user interacts again quickly or if the audio context is not yet allowed.
                    // We can safely ignore this, as the main goal is to attempt to unlock audio.
                    // Pausing ensures it's in a known state.
                    console.warn("Audio unlock failed for one element (safely ignored):", error);
                    audio.pause();
                });
            }
        });
    }

    private determineSceneType(prompt: string): string {
        const lowerPrompt = prompt.toLowerCase();
        if (lowerPrompt.includes('battle') || lowerPrompt.includes('fight') || lowerPrompt.includes('monster') || lowerPrompt.includes('combat')) return 'battle';
        if (lowerPrompt.includes('dungeon') || lowerPrompt.includes('cavern') || lowerPrompt.includes('crypt') || lowerPrompt.includes('underground')) return 'dungeon';
        if (lowerPrompt.includes('forest') || lowerPrompt.includes('woods') || lowerPrompt.includes('jungle') || lowerPrompt.includes('swamp')) return 'forest';
        if (lowerPrompt.includes('village') || lowerPrompt.includes('tavern') || lowerPrompt.includes('town') || lowerPrompt.includes('peaceful')) return 'peaceful';
        return 'default';
    }

    private fade(audio: HTMLAudioElement, target: number, duration: number): Promise<void> {
        return new Promise(resolve => {
            const startVolume = audio.volume;
            const delta = target - startVolume;
            if (delta === 0) return resolve();
            
            const tickRate = 50;
            const ticks = Math.floor(duration / tickRate);
            let currentTick = 0;

            const timer = setInterval(() => {
                currentTick++;
                const newVolume = startVolume + (delta * (currentTick / ticks));
                audio.volume = Math.max(0, Math.min(1, newVolume));
                if (currentTick >= ticks) {
                    clearInterval(timer);
                    audio.volume = target;
                    resolve();
                }
            }, tickRate);
        });
    }

    public async playAmbiance(prompt: string) {
        if (!this.hasStarted || this.isTransitioning) return;

        const sceneType = this.determineSceneType(prompt);
        const newAudio = this.audioCache.get(sceneType);

        if (!newAudio) {
            console.error(`Audio for scene type "${sceneType}" not found.`);
            return;
        }

        if (this.currentAudio === newAudio && !this.currentAudio.paused) {
            return;
        }

        this.isTransitioning = true;
        const oldAudio = this.currentAudio;

        try {
            this.currentAudio = newAudio;

            if (oldAudio && !oldAudio.paused && oldAudio.volume > 0) {
                await this.fade(oldAudio, 0, 500);
                oldAudio.pause();
            }
            
            if (this.currentAudio) {
                this.currentAudio.volume = 0; // Ensure it starts silently before fading in
                await this.currentAudio.play();
                if (!this.isMuted) {
                    await this.fade(this.currentAudio, this.targetVolume, 500);
                }
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error("Audio playback error:", error);
            }
        } finally {
            this.isTransitioning = false;
        }
    }

    public async toggleMute() {
        if (!this.currentAudio) return;
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            await this.fade(this.currentAudio, 0, 300);
        } else if (!this.currentAudio.paused) {
            await this.fade(this.currentAudio, this.targetVolume, 300);
        }
    }
}

export const audioService = new AudioService();