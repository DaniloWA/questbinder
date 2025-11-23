
class AudioService {
    private musicPlayer1: HTMLAudioElement;
    private musicPlayer2: HTMLAudioElement;
    private sfxPlayers: Set<HTMLAudioElement> = new Set();
    private loopingSfx: Map<string, HTMLAudioElement> = new Map(); // For toggleable SFX
    private activePlayer: HTMLAudioElement;
    private musicVolume: number = 0.3;
    private sfxVolume: number = 0.5;
    private volumeOverride: number | null = null;
    private fadeInterval: number | null = null;
    private isMusicPaused: boolean = false;
    private onError: ((error: { type: string, message: string, audioName: string }) => void) | null = null;

    constructor() {
        this.musicPlayer1 = new Audio();
        this.musicPlayer2 = new Audio();
        // Default loop is true, but we'll control it per-track
        this.musicPlayer1.loop = true;
        this.musicPlayer2.loop = true;
        this.musicPlayer1.volume = 0;
        this.musicPlayer2.volume = 0;
        this.activePlayer = this.musicPlayer1;
        this.musicPlayer1.onerror = (e) => this.handleError(e, this.musicPlayer1.src);
        this.musicPlayer2.onerror = (e) => this.handleError(e, this.musicPlayer2.src);
    }

    public setOnError(callback: (error: { type: string, message: string, audioName: string }) => void) {
        this.onError = callback;
    }

    private handleError(event: Event | string, url: string) {
        let message = 'Erro desconhecido.';
        let type = 'GENERIC';

        if (typeof event === 'object' && 'type' in event && event.type === 'error') {
            const target = event.target as HTMLAudioElement;
            if (target.error) {
                switch (target.error.code) {
                    case target.error.MEDIA_ERR_ABORTED: message = 'A reprodução foi abortada.'; type = 'ABORTED'; break;
                    case target.error.MEDIA_ERR_NETWORK: message = 'Erro de rede.'; type = 'NETWORK'; break;
                    case target.error.MEDIA_ERR_DECODE: message = 'Erro ao decodificar.'; type = 'DECODE'; break;
                    case target.error.MEDIA_ERR_SRC_NOT_SUPPORTED: message = 'Fonte de áudio não suportada ou URL inválida.'; type = 'SRC_NOT_SUPPORTED'; break;
                    default: message = 'Ocorreu um erro inesperado.';
                }
            }
        } else if (typeof event === 'string') {
            message = event;
        } else if (event instanceof Error) {
            message = event.message;
            type = event.name;
        }

        // Ignore empty source errors (happens when stopping music)
        if (!url || url === window.location.href) return;

        if (this.onError) {
            const audioName = url ? decodeURI(url.split('/').pop() || 'Áudio') : 'Áudio Desconhecido';
            // Debounce error to prevent spam
            this.onError({ type, message, audioName });
        }
        console.error(`Audio Error (${type}): ${message}`, url);
    }

    private fadeIn(player: HTMLAudioElement) {
        let currentStep = 0;
        const steps = 20;
        const duration = 1000;
        
        // Ensure volume starts at 0
        player.volume = 0;
        
        const targetVolume = this.volumeOverride ?? this.musicVolume;

        const interval = window.setInterval(() => {
            currentStep++;
            // Check if player still exists/valid
            if (!player) { clearInterval(interval); return; }
            
            const newVol = Math.min(targetVolume, (currentStep / steps) * targetVolume);
            if (isFinite(newVol)) player.volume = newVol;

            if (currentStep >= steps) {
                clearInterval(interval);
            }
        }, duration / steps);
        return interval;
    }

    private fadeOut(player: HTMLAudioElement, shouldPause: boolean) {
        if (player.paused) return null;

        let currentStep = 0;
        const steps = 20;
        const duration = 1000;
        const startVolume = player.volume;

        const interval = window.setInterval(() => {
            currentStep++;
            // Check if player still exists/valid
            if (!player) { clearInterval(interval); return; }

            const newVol = Math.max(0, startVolume * (1 - (currentStep / steps)));
            if (isFinite(newVol)) player.volume = newVol;

            if (currentStep >= steps) {
                clearInterval(interval);
                if (shouldPause) {
                    player.pause();
                } else {
                    player.pause();
                    player.src = ''; // Detach source to stop buffering
                }
            }
        }, duration / steps);
        return interval;
    }

    private crossfade(newUrl: string, loop: boolean, volume?: number) {
        if (this.fadeInterval) clearInterval(this.fadeInterval);

        const inactivePlayer = this.activePlayer === this.musicPlayer1 ? this.musicPlayer2 : this.musicPlayer1;
        const oldPlayer = this.activePlayer;

        this.volumeOverride = volume ?? null;
        const targetVolume = this.volumeOverride ?? this.musicVolume;

        // Setup new player
        inactivePlayer.src = newUrl;
        inactivePlayer.loop = loop;
        inactivePlayer.volume = 0;
        
        const playPromise = inactivePlayer.play();
        if (playPromise !== undefined) {
            playPromise.catch(e => this.handleError(e, newUrl));
        }

        this.activePlayer = inactivePlayer;

        let currentStep = 0;
        const steps = 30;
        const duration = 1500;
        const oldVolume = oldPlayer.volume;

        this.fadeInterval = window.setInterval(() => {
            currentStep++;
            const progress = currentStep / steps;
            
            const oldVol = Math.max(0, (1 - progress) * oldVolume);
            if (isFinite(oldVol)) oldPlayer.volume = oldVol;
            
            const newVol = Math.min(targetVolume, progress * targetVolume);
            if (isFinite(newVol)) inactivePlayer.volume = newVol;

            if (currentStep >= steps) {
                if(this.fadeInterval) clearInterval(this.fadeInterval);
                this.fadeInterval = null;
                oldPlayer.pause();
                // Don't clear src immediately to avoid network errors if we switch back quickly, 
                // but usually it's safer to clear to stop buffering.
                oldPlayer.src = ''; 
            }
        }, duration / steps);
    }
    
    playMusic(url: string | null, loop: boolean = true, volume?: number) {
        this.isMusicPaused = false;
        
        if (!url) {
            this.volumeOverride = null;
            return this.stopMusic();
        }
        
        // Robust URL comparison logic
        const currentSrc = this.activePlayer.src ? decodeURI(this.activePlayer.src) : '';
        // Handle potential relative/absolute mismatches and encoding
        const targetSrc = decodeURI(url);
        
        // Check if we are essentially playing the same track
        const isSameTrack = (currentSrc && targetSrc && (currentSrc === targetSrc || currentSrc.endsWith(targetSrc) || targetSrc.endsWith(currentSrc)));
        
        if (isSameTrack) {
            if (this.activePlayer.paused) {
                this.resumeMusic();
            }
            
            // Handle Volume Change smoothly or instantly
            const targetVol = volume ?? this.musicVolume;
            if (this.volumeOverride !== volume || Math.abs(this.activePlayer.volume - targetVol) > 0.05) {
                this.volumeOverride = volume ?? null;
                // Smooth volume adjustment could be added here, but direct set is more responsive for zones
                this.activePlayer.volume = targetVol;
            }

            // Update loop setting if changed
            if (this.activePlayer.loop !== loop) {
                this.activePlayer.loop = loop;
            }
            return;
        }

        if (this.activePlayer.paused && !this.activePlayer.src) {
            // Clean start
            if (this.fadeInterval) clearInterval(this.fadeInterval);
            this.volumeOverride = volume ?? null;
            this.activePlayer.src = url;
            this.activePlayer.loop = loop;
            
            const playPromise = this.activePlayer.play();
            if (playPromise !== undefined) {
                playPromise.catch(e => this.handleError(e, url));
            }
            
            this.fadeInterval = this.fadeIn(this.activePlayer);
        } else {
            // Crossfade
            this.crossfade(url, loop, volume);
        }
    }

    updateCurrentMusicLoop(loop: boolean) {
        if (this.activePlayer) {
            this.activePlayer.loop = loop;
        }
    }

    pauseMusic() {
        if (this.isMusicPaused || this.activePlayer.paused) return;
        this.isMusicPaused = true;
        if (this.fadeInterval) clearInterval(this.fadeInterval);
        this.fadeInterval = this.fadeOut(this.activePlayer, true);
    }

    resumeMusic() {
        if (!this.isMusicPaused || !this.activePlayer.src) return;
        this.isMusicPaused = false;
        const playPromise = this.activePlayer.play();
        if (playPromise !== undefined) {
            playPromise.catch(e => this.handleError(e, this.activePlayer.src));
        }
        if (this.fadeInterval) clearInterval(this.fadeInterval);
        this.fadeInterval = this.fadeIn(this.activePlayer);
    }
    
    stopMusic() {
        this.isMusicPaused = false;
        this.volumeOverride = null;
        if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
            this.fadeInterval = null;
        }
        this.fadeOut(this.musicPlayer1, false);
        this.fadeOut(this.musicPlayer2, false);

        // Also stop all looping SFX
        this.loopingSfx.forEach(sfx => {
            this.fadeOut(sfx, false); // Fade out SFX instead of hard cut
            setTimeout(() => sfx.remove(), 1000);
        });
        this.loopingSfx.clear();
    }

    playSound(url: string) {
        const sfx = new Audio(url);
        sfx.volume = this.sfxVolume;
        sfx.onerror = (e) => this.handleError(e, url);
        sfx.play().catch(e => this.handleError(e, url));
        this.sfxPlayers.add(sfx);
        sfx.onended = () => {
            this.sfxPlayers.delete(sfx);
        };
    }

    toggleSfxLoop(url: string) {
        if (this.loopingSfx.has(url)) {
            const sfx = this.loopingSfx.get(url);
            if (sfx) {
                // Fade out removal
                let vol = sfx.volume;
                const fade = setInterval(() => {
                    vol = Math.max(0, vol - 0.1);
                    sfx.volume = vol;
                    if (vol <= 0) {
                        clearInterval(fade);
                        sfx.pause();
                        this.sfxPlayers.delete(sfx);
                        sfx.remove();
                    }
                }, 50);
                this.loopingSfx.delete(url);
            }
        } else {
            const sfx = new Audio(url);
            sfx.volume = this.sfxVolume;
            sfx.loop = true;
            sfx.onerror = (e) => this.handleError(e, url);
            sfx.play().catch(e => this.handleError(e, url));
            this.loopingSfx.set(url, sfx);
            this.sfxPlayers.add(sfx);
        }
    }
    
    setMusicVolume(volume: number) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        // Only update active player if we are NOT in a specific volume override zone
        // OR if we want master volume to scale everything (complex, keeping simple for now)
        // Currently: If override is active (Zone), master slider doesn't change current volume immediately, 
        // but will affect next tracks.
        if (this.volumeOverride === null && !this.activePlayer.paused && !this.fadeInterval) {
            this.activePlayer.volume = this.musicVolume;
        }
    }

    setSfxVolume(volume: number) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        this.sfxPlayers.forEach(sfx => {
            sfx.volume = this.sfxVolume;
        });
        this.loopingSfx.forEach(sfx => {
            sfx.volume = this.sfxVolume;
        });
    }

    // --- EXPOSED STATE GETTERS ---
    
    getMusicVolume(): number { return this.musicVolume; }
    getSfxVolume(): number { return this.sfxVolume; }
    getCurrentMusicUrl(): string | null { return this.activePlayer.src || null; }
    getIsMusicPaused(): boolean { return this.isMusicPaused || this.activePlayer.paused; }
    getLoopingSfx(): Set<string> { return new Set(this.loopingSfx.keys()); }
}

export const audioService = new AudioService();
