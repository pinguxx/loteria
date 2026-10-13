// Web Audio API Synthesizer for Authentic Loteria Sounds
// Zero external audio files required!

class LoteriaAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.speechEnabled = true;
    this.spanishVoice = null;

    // Initialize speech synthesis voices
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        this.spanishVoice = voices.find(v => v.lang.startsWith('es') || v.lang.includes('ES') || v.lang.includes('MX')) || null;
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Sound of placing a bean (frijolito clack/pop)
  playBeanPop() {
    if (!this.enabled) return;
    this.init();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.08);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  // Sound of removing a bean (lighter click)
  playBeanRemove() {
    if (!this.enabled) return;
    this.init();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.exponentialRampToValueAtTime(250, t + 0.05);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  // Card drawn chime (bell chime)
  playCardChime() {
    if (!this.enabled) return;
    this.init();
    const t = this.ctx.currentTime;

    const notes = [523.25, 659.25]; // C5, E5
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.06);

      gain.gain.setValueAtTime(0.25, t + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + i * 0.06);
      osc.stop(t + i * 0.06 + 0.4);
    });
  }

  // False loteria buzz (friendly penalty buzzer)
  playBuzzer() {
    if (!this.enabled) return;
    this.init();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.linearRampToValueAtTime(110, t + 0.35);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.35);
  }

  // Trumpet victory fanfare when someone wins ¡LOTERÍA!
  playFanfare() {
    if (!this.enabled) return;
    this.init();
    const t = this.ctx.currentTime;

    // Triumphant fanfare notes: G4, C5, E5, G5, long E5-G5
    const fanfareNotes = [
      { f: 392.00, start: 0.00, dur: 0.12 },
      { f: 523.25, start: 0.14, dur: 0.12 },
      { f: 659.25, start: 0.28, dur: 0.14 },
      { f: 783.99, start: 0.44, dur: 0.35 },
      { f: 659.25, start: 0.82, dur: 0.14 },
      { f: 783.99, start: 0.98, dur: 0.60 }
    ];

    fanfareNotes.forEach(({ f, start, dur }) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t + start);

      gain.gain.setValueAtTime(0.35, t + start);
      gain.gain.exponentialRampToValueAtTime(0.01, t + start + dur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + start);
      osc.stop(t + start + dur);
    });
  }

  // Speech synthesis: "El Cantor" chanting the card name and rhyme
  speakCard(name, verse, nameEn = null, verseEn = null, preferEnglish = false) {
    if (!this.speechEnabled || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // Stop prior speech
    
    let textToSpeak = '';
    let lang = 'es-MX';
    let voice = this.spanishVoice;

    if (preferEnglish && nameEn) {
      // English pronunciation
      textToSpeak = verseEn ? `${nameEn}! ${verseEn}` : `${nameEn}!`;
      lang = 'en-US';
      const voices = window.speechSynthesis.getVoices();
      voice = voices.find(v => v.lang.startsWith('en')) || null;
    } else {
      // Traditional authentic Spanish chant
      textToSpeak = verse ? `¡${name}! ${verse}` : `¡${name}!`;
      lang = 'es-MX';
      voice = this.spanishVoice;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = lang;
    utterance.rate = 0.95; // Calm, clear pacing so phrases never sound rushed
    utterance.pitch = 1.05;

    if (voice) {
      utterance.voice = voice;
    }

    window.speechSynthesis.speak(utterance);
  }
}

window.loteriaAudio = new LoteriaAudio();
