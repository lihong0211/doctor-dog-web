import request from './request'

export interface SpeechAnalysis {
  structure_score: number
  language_score: number
  pace_assessment: string
  strengths: string[]
  improvements: string[]
  suggestions: string[]
  overall_feedback: string
  filler_words: string[]
  content_summary: string
}

export interface SpeechResult {
  transcript: string
  word_count: number
  duration: number
  words_per_minute: number
  analysis: SpeechAnalysis
}

export async function analyzeSpeech(audioFile: File): Promise<SpeechResult> {
  const form = new FormData()
  form.append('audio', audioFile)
  const res = await request.post('/ai/speech-trainer/analyze', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  })
  return res.data
}
