export class SpeechService {
  private static synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static recognition: any = null;

  public static initRecognition(
    onResult: (text: string) => void,
    onEnd: () => void,
    onError: (err: any) => void
  ) {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onError('Speech Recognition is not supported in this browser.');
      return null;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      onResult(transcript);
    };

    rec.onend = () => {
      onEnd();
    };

    rec.onerror = (event: any) => {
      onError(event.error);
    };

    this.recognition = rec;
    return rec;
  }

  public static speak(
    text: string,
    voiceName?: string,
    rate: number = 1.0,
    onStart?: () => void,
    onEnd?: () => void
  ) {
    if (!this.synth) return;

    this.synth.cancel(); // Stop current speech

    // Clean markdown symbols for cleaner speech readout
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*#_~]/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = rate;

    const voices = this.synth.getVoices();
    if (voiceName) {
      const selectedVoice = voices.find(v => v.name === voiceName);
      if (selectedVoice) utterance.voice = selectedVoice;
    }

    if (onStart) utterance.onstart = onStart;
    if (onEnd) utterance.onend = onEnd;
    utterance.onerror = () => onEnd?.();

    this.synth.speak(utterance);
  }

  public static stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  public static getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }
}
