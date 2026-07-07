import request, { unwrapApiResponse, type ApiResponse } from './request'

export interface MatchResult {
  score: number
  strengths: string[]
  gaps: string[]
  suggestions: string[]
  resume_summary: string
}

export async function matchResume(resumeFile: File, jobDescription: string): Promise<MatchResult> {
  const form = new FormData()
  form.append('resume_pdf', resumeFile)
  form.append('job_description', jobDescription)
  const res = await request.post('/ai/resume-match', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  }) as unknown as ApiResponse<MatchResult>
  return unwrapApiResponse(res)
}
