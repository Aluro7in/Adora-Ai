# ADORA AI — VOICE & AUDIO ARCHITECTURE SPECIFICATION

**Document Version:** 1.0.0  
**Status:** Approved Architectural Baseline  
**Sensory Modalities:** Speech-to-Text, Text-to-Speech, Live Duplex Voice  

---

## 1. Voice Architecture Principles

Voice in Adora AI is designed to make personal reflection effortless and intimate while strictly respecting privacy and hardware constraints.

### 1.1 Non-Intrusive Permission Policy
- The application **must remain 100% functional without microphone permissions**.
- Microphone access is requested only when the user explicitly clicks the "Record Voice Reflection" or "Start Voice Conversation" buttons.
- If permission is denied, the UI gracefully falls back to text entry and explains how to re-enable permissions in browser settings.

---

## 2. Speech-to-Text Pipeline (Reflection Capture)

### 2.1 Workflow
```
[User Clicks Record] ──> [MediaRecorder captures Audio Buffer (WebM/WAV)]
                                    │
                                    ▼ (User Clicks Stop)
                          [Preview Waveform & Duration]
                                    │
                                    ▼ (Send to /api/v1/audio/transcribe)
                          [Server converts to Base64]
                                    │
                                    ▼
                [Gemini 3.5 Transcribe (Server-Side GenAI)]
                                    │
                                    ▼
                          [Return Transcript to Client]
                                    │
                                    ▼
                 [Inline Transcript Review & Edit Modal]
                                    │
                                    ▼
                    [Commit Approved Reflection to Firestore]
```

### 2.2 Server-Side Transcription Service (`voiceService.ts`)
```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});

export async function transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-3.5-transcribe',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: audioBuffer.toString('base64'),
          },
        },
        {
          text: 'Transcribe this spoken reflection verbatim. Preserve natural pauses, self-corrections, and emotional tone accurately without adding editorial commentary.',
        },
      ],
    },
  });

  return response.text || '';
}
```

---

## 3. Text-to-Speech Pipeline (Auditory Reflection)

### 3.1 TTS Engine (`gemini-3.8-flash-tts`)
- Enables Adora to read back synthesized reflections, weekly insight summaries, and strategic questions in a natural voice.
- Server-side synthesis via `@google/genai`.
- Audio returned as base64 PCM/WAV payload played via Web Audio API or HTML5 `<audio>` element.

---

## 4. Real-Time Duplex Voice Conversation (`gemini-3.8-live`)

### 4.1 Architecture
- For real-time hands-free reflective dialogue, Adora integrates `gemini-3.8-live`.
- Client captures 16kHz PCM audio stream and sends chunks over WebSocket connection to the server bridge.
- Server maintains live session with Google GenAI Live API and streams back 24kHz audio chunks for low-latency playback.
- Interruption handling: User speaking automatically pauses incoming audio playback.

---

## 5. Audio Storage & Retention Governance
- **Default Mode (Ephemeral)**: Audio buffers are transcribed in server memory and discarded immediately after transcription. No audio files saved.
- **Opt-in Audio Archival**: If the user enables "Keep Voice Recordings" in Settings, audio files are saved in Cloud Storage under `/users/{userId}/audio/{reflectionId}.webm` with cryptographic access tokens.
