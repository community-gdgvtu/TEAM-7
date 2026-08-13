import type { Language } from '../types';

/**
 * Voice Mode — Speech Recognition & Text-to-Speech Engine
 * Multi-language support (English, Hindi, Kannada, Urdu)
 */
export interface VoiceListenerOptions {
  language: Language;
  onResult: (text: string) => void;
  onError: (error: string) => void;
  onEnd: () => void;
}

export class VoiceEngine {
  private recognition: any = null;
  private isListening: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
      }
    }
  }

  public getLangCode(lang: Language): string {
    switch (lang) {
      case 'hi': return 'hi-IN';
      case 'kn': return 'kn-IN';
      case 'ur': return 'ur-PK';
      default: return 'en-IN';
    }
  }

  public startListening(options: VoiceListenerOptions) {
    if (this.isListening) this.stopListening();

    if (this.recognition) {
      try {
        this.recognition.lang = this.getLangCode(options.language);
        
        this.recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          options.onResult(transcript);
        };

        this.recognition.onerror = (event: any) => {
          options.onError(event.error || 'Voice error occurred');
          this.isListening = false;
        };

        this.recognition.onend = () => {
          this.isListening = false;
          options.onEnd();
        };

        this.recognition.start();
        this.isListening = true;
      } catch (err: any) {
        options.onError(err.message || 'Speech recognition initialization failed');
        options.onEnd();
      }
    } else {
      // Fallback simulation for browsers/environments without native SpeechRecognition API
      this.isListening = true;
      const simPrompts: Record<Language, string> = {
        en: 'I need a laptop for coding under 60,000 rupees',
        hi: 'Mujhe ek Samsung Galaxy phone chahiye 18,000 ke andar',
        kn: 'ನನಗೆ 400 ರೂಪಾಯಿ ಒಳಗೆ 5 ಕೆಜಿ ಅಕ್ಕಿ ಬೇಕು',
        ur: 'Mujhe 500W drill machine 2500 rupay tak chahiye'
      };

      setTimeout(() => {
        options.onResult(simPrompts[options.language]);
        options.onEnd();
        this.isListening = false;
      }, 2500);
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
    }
    this.isListening = false;
  }

  public speak(text: string, lang: Language = 'en') {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.getLangCode(lang);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }
}

export const voiceEngine = new VoiceEngine();
