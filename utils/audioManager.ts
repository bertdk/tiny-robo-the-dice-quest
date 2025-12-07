
export class AudioManager {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private isMuted: boolean = false;
    private musicInterval: number | null = null;
    private isMusicPlaying: boolean = false;
    private volume: number = 0.3;
    
    private rollingSource: AudioBufferSourceNode | null = null;
    private rollingGain: GainNode | null = null;

    constructor() {
        // Context is initialized on first user interaction to satisfy browser policies
    }

    init() {
        if (this.ctx) return;
        
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx!.createGain();
        this.masterGain.gain.value = this.volume; // Main volume
        this.masterGain.connect(this.ctx!.destination);
    }

    setVolume(value: number) {
        this.volume = Math.max(0, Math.min(1, value));
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        }
    }

    getVolume(): number {
        return this.volume;
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playJump() {
        if (!this.ctx || this.isMuted) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Playful "Bloop" / Cartoon Jump
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.linearRampToValueAtTime(500, t + 0.1); 

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(t);
        osc.stop(t + 0.15);
    }

    playLand() {
        if (!this.ctx || this.isMuted) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.1);

        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(t);
        osc.stop(t + 0.1);
    }

    playBuild() {
        if (!this.ctx || this.isMuted) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.linearRampToValueAtTime(1200, t + 0.1);

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(t);
        osc.stop(t + 0.1);
    }
    
    playDeconstruct() {
        if (!this.ctx || this.isMuted) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200, t);
        osc.frequency.exponentialRampToValueAtTime(400, t + 0.1); // Pitch down

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(t);
        osc.stop(t + 0.1);
    }

    playStep() {
        if (!this.ctx || this.isMuted) return;
        const t = this.ctx.currentTime;
        // Simple noise burst for step
        const bufferSize = this.ctx.sampleRate * 0.05; // 50ms
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.ctx.createGain();
        
        // Filter out high frequencies for a duller "thud"
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain!);
        noise.start(t);
    }

    playDie() {
        if (!this.ctx || this.isMuted) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Cartoon falling whistle
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.linearRampToValueAtTime(200, t + 0.6); 
        
        // Tremolo effect
        const vibrato = this.ctx.createOscillator();
        vibrato.frequency.value = 15;
        const vibratoGain = this.ctx.createGain();
        vibratoGain.gain.value = 50;
        vibrato.connect(vibratoGain);
        vibratoGain.connect(osc.frequency);
        vibrato.start(t);

        gain.gain.setValueAtTime(0.4, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.6);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(t);
        osc.stop(t + 0.6);
        vibrato.stop(t + 0.6);
    }
    
    playRolling() {
        if (!this.ctx || this.isMuted || this.rollingSource) return;
        const bufferSize = this.ctx.sampleRate * 2.0;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1);
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 300;

        const gain = this.ctx.createGain();
        gain.gain.value = 0.3;

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain!);
        noise.start();

        this.rollingSource = noise;
        this.rollingGain = gain;
    }

    stopRolling() {
        if (this.rollingSource) {
            this.rollingSource.stop();
            this.rollingSource.disconnect();
            this.rollingSource = null;
            this.rollingGain = null;
        }
    }

    playDiceRoll() {
        if (!this.ctx) this.init(); // Ensure init
        this.resume(); // Ensure context is running
        
        if (!this.ctx || this.isMuted) return;
        const t = this.ctx.currentTime;
        
        // Realistic Dice Tumble: Sequence of rapid dry impacts
        // Start fast, slow down, end with a decisive stop
        const impacts = [
            0,      // Start
            0.06,   // Clack
            0.11,   // Clack
            0.15,   // Clack
            0.20,   // Clack
            0.26,   // Clack...
            0.33,   // ...clack
            0.45    // ...Tok (stop)
        ];
        
        impacts.forEach((offset, i) => {
             const osc = this.ctx!.createOscillator();
             const gain = this.ctx!.createGain();
             
             // Short wood/plastic click
             // Use a square wave with low pass or triangle for a 'hard' surface sound
             osc.type = 'triangle';
             
             // Vary pitch slightly to simulate different sides hitting
             const baseFreq = 1800;
             const randomFreq = Math.random() * 600 - 300;
             osc.frequency.setValueAtTime(baseFreq + randomFreq, t + offset);
             // Quick pitch drop for percussive effect
             osc.frequency.exponentialRampToValueAtTime(100, t + offset + 0.03);
             
             // Volume decay
             const isLast = i === impacts.length - 1;
             const vol = isLast ? 0.6 : (0.5 - (i * 0.05)); // Fade out, but last hit is noticeable
             
             gain.gain.setValueAtTime(vol, t + offset);
             gain.gain.exponentialRampToValueAtTime(0.01, t + offset + 0.03);
             
             osc.connect(gain);
             gain.connect(this.masterGain!);
             osc.start(t + offset);
             osc.stop(t + offset + 0.03);
        });
    }
    
    playDash() {
        if (!this.ctx || this.isMuted) return;
        const t = this.ctx.currentTime;
        
        // Whoosh sound using noise sweep
        const bufferSize = this.ctx.sampleRate * 0.3; // 300ms duration
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        // Start low, sweep high (acceleration)
        filter.frequency.setValueAtTime(200, t);
        filter.frequency.exponentialRampToValueAtTime(3000, t + 0.2); 

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.3);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain!);
        noise.start(t);
    }

    playLaser() {
        if (!this.ctx || this.isMuted) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.exponentialRampToValueAtTime(110, t + 0.2);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(t);
        osc.stop(t + 0.2);
    }
    
    playDing() {
        if (!this.ctx || this.isMuted) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, t);
        
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(t);
        osc.stop(t + 0.5);
    }

    startMusic() {
        if (!this.ctx || this.isMusicPlaying || this.isMuted) return;
        this.isMusicPlaying = true;
        
        // Simple bassline sequence
        const notes = [220, 0, 220, 0, 164, 0, 196, 0]; // A3, pause, A3, pause, E3, pause, G3, pause
        let noteIndex = 0;
        const tempo = 250; // ms per beat

        const playNote = () => {
            if (!this.isMusicPlaying || !this.ctx) return;
            const freq = notes[noteIndex];
            if (freq > 0) {
                const t = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq / 2, t); // Lower octave bass
                
                gain.gain.setValueAtTime(0.15, t);
                gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
                
                osc.connect(gain);
                gain.connect(this.masterGain!);
                osc.start(t);
                osc.stop(t + 0.3);
            }
            noteIndex = (noteIndex + 1) % notes.length;
        };

        this.musicInterval = window.setInterval(playNote, tempo);
    }

    stopMusic() {
        this.isMusicPlaying = false;
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
    }
}

export const audioManager = new AudioManager();
