import { findBestMatch, type FuzzyMatchResult } from './fuzzyMatch'

/**
 * Voice recognition utility using Web Speech API
 * Provides speech-to-text with fuzzy matching against expected answers
 */

// Browser compatibility check
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

export interface VoiceRecognitionResult {
  transcript: string
  confidence: number
  bestMatch: FuzzyMatchResult | null
}

export interface VoiceRecognitionError {
  code: 'not-supported' | 'permission-denied' | 'no-speech' | 'network-error' | 'aborted' | 'unknown'
  message: string
}

export interface VoiceRecognitionOptions {
  language?: string
  continuous?: boolean
  interimResults?: boolean
  maxAlternatives?: number
}

/**
 * Check if voice recognition is supported in the current browser
 */
export function isVoiceRecognitionSupported(): boolean {
  return typeof SpeechRecognition !== 'undefined'
}

/**
 * Request microphone permission
 * Returns true if permission is granted
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
    return result.state === 'granted' || result.state === 'prompt'
  } catch (error) {
    // Fallback: Try to access media devices
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      return true
    } catch {
      return false
    }
  }
}

/**
 * Create a voice recognition instance
 */
export class VoiceRecognizer {
  private recognition: any
  private isListening: boolean = false

  constructor(options: VoiceRecognitionOptions = {}) {
    if (!isVoiceRecognitionSupported()) {
      throw new Error('Speech recognition is not supported in this browser')
    }

    this.recognition = new SpeechRecognition()
    this.recognition.lang = options.language || 'en-US'
    this.recognition.continuous = options.continuous || false
    this.recognition.interimResults = options.interimResults || false
    this.recognition.maxAlternatives = options.maxAlternatives || 1
  }

  /**
   * Start listening for speech
   * Returns a promise that resolves with the recognized text
   */
  async listen(): Promise<string> {
    if (this.isListening) {
      throw new Error('Already listening')
    }

    return new Promise((resolve, reject) => {
      this.isListening = true

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        this.isListening = false
        resolve(transcript)
      }

      this.recognition.onerror = (event: any) => {
        this.isListening = false
        const error: VoiceRecognitionError = {
          code: this.mapErrorCode(event.error),
          message: this.getErrorMessage(event.error),
        }
        reject(error)
      }

      this.recognition.onend = () => {
        this.isListening = false
      }

      try {
        this.recognition.start()
      } catch (error) {
        this.isListening = false
        reject({
          code: 'unknown' as const,
          message: 'Failed to start voice recognition',
        })
      }
    })
  }

  /**
   * Stop listening
   */
  stop(): void {
    if (this.isListening) {
      this.recognition.stop()
      this.isListening = false
    }
  }

  /**
   * Abort the current recognition
   */
  abort(): void {
    if (this.isListening) {
      this.recognition.abort()
      this.isListening = false
    }
  }

  private mapErrorCode(error: string): VoiceRecognitionError['code'] {
    const errorMap: Record<string, VoiceRecognitionError['code']> = {
      'not-allowed': 'permission-denied',
      'no-speech': 'no-speech',
      'network': 'network-error',
      'aborted': 'aborted',
    }
    return errorMap[error] || 'unknown'
  }

  private getErrorMessage(error: string): string {
    const messages: Record<string, string> = {
      'not-allowed': 'Microphone permission denied. Please allow microphone access to use voice input.',
      'no-speech': 'No speech detected. Please try again.',
      'network': 'Network error. Please check your connection and try again.',
      'aborted': 'Voice recognition was cancelled.',
    }
    return messages[error] || 'An error occurred during voice recognition. Please try again.'
  }
}

/**
 * Recognize speech and match against possible answers
 * High-level function that combines speech recognition with fuzzy matching
 */
export async function recognizeAndMatch(
  possibleAnswers: string[],
  options: VoiceRecognitionOptions = {}
): Promise<VoiceRecognitionResult> {
  const recognizer = new VoiceRecognizer(options)

  try {
    const transcript = await recognizer.listen()

    // Find best match from possible answers
    const bestMatch = findBestMatch(transcript, possibleAnswers, 0.4)

    return {
      transcript,
      confidence: bestMatch?.confidence || 0,
      bestMatch,
    }
  } catch (error) {
    throw error
  } finally {
    recognizer.stop()
  }
}
