import { useState, useRef, useEffect, useCallback } from 'react'
import {
  CustomerServiceOutlined, CheckCircleOutlined, CloseCircleOutlined,
  UploadOutlined, AudioOutlined, DeleteOutlined,
} from '@ant-design/icons'
import { getMossTTSStatus, mossTTSSynthesize, type MossTTSStatus } from '../service/moss-tts'

// ── WAV encoder ───────────────────────────────────────────────────────────────
function audioBufferToWav(buf: AudioBuffer): ArrayBuffer {
  const nCh = buf.numberOfChannels
  const sr = buf.sampleRate
  const len = buf.length
  const data = new ArrayBuffer(44 + len * nCh * 2)
  const v = new DataView(data)
  const str = (off: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i)) }
  str(0, 'RIFF'); v.setUint32(4, 36 + len * nCh * 2, true); str(8, 'WAVE')
  str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true)
  v.setUint16(22, nCh, true); v.setUint32(24, sr, true)
  v.setUint32(28, sr * nCh * 2, true); v.setUint16(32, nCh * 2, true); v.setUint16(34, 16, true)
  str(36, 'data'); v.setUint32(40, len * nCh * 2, true)
  let off = 44
  for (let i = 0; i < len; i++) {
    for (let c = 0; c < nCh; c++) {
      const s = Math.max(-1, Math.min(1, buf.getChannelData(c)[i]))
      v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true); off += 2
    }
  }
  return data
}

async function blobToWavFile(blob: Blob): Promise<File> {
  const ab = await blob.arrayBuffer()
  const ctx = new AudioContext()
  const audioBuf = await ctx.decodeAudioData(ab)
  await ctx.close()
  const wav = audioBufferToWav(audioBuf)
  return new File([wav], 'recording.wav', { type: 'audio/wav' })
}

// ── Types ─────────────────────────────────────────────────────────────────────
type SourceMode = 'record' | 'upload' | 'builtin'
type RecordState = 'idle' | 'recording' | 'done'

const BUILTIN_VOICES = [
  { value: 'zh_1', label: '中文示例 1' },
  { value: 'zh_2', label: '中文示例 2' },
  { value: 'en_1', label: '英文示例 1' },
]

// ── Recording hook ────────────────────────────────────────────────────────────
function useRecorder() {
  const [state, setState] = useState<RecordState>('idle')
  const [seconds, setSeconds] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [wavFile, setWavFile] = useState<File | null>(null)
  const [permError, setPermError] = useState<string | null>(null)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevPreviewUrl = useRef<string | null>(null)

  const revokePreview = () => {
    if (prevPreviewUrl.current) { URL.revokeObjectURL(prevPreviewUrl.current); prevPreviewUrl.current = null }
  }
  useEffect(() => () => { revokePreview(); if (timerRef.current) clearInterval(timerRef.current) }, [])

  const start = useCallback(async () => {
    setPermError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []
      const mr = new MediaRecorder(stream)
      mediaRef.current = mr
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: mr.mimeType })
        revokePreview()
        const url = URL.createObjectURL(blob)
        prevPreviewUrl.current = url
        setPreviewUrl(url)
        try {
          const f = await blobToWavFile(blob)
          setWavFile(f)
        } catch {
          // AudioContext decode failed — send raw blob as fallback
          const fallback = new File([blob], 'recording.wav', { type: 'audio/wav' })
          setWavFile(fallback)
        }
        setState('done')
      }
      mr.start(100)
      setState('recording')
      setSeconds(0)
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
    } catch (e) {
      setPermError(e instanceof Error ? e.message : '麦克风权限被拒绝')
    }
  }, [])

  const stop = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    mediaRef.current?.stop()
  }, [])

  const reset = useCallback(() => {
    revokePreview(); setPreviewUrl(null); setWavFile(null)
    setState('idle'); setSeconds(0); setPermError(null)
  }, [])

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return { state, seconds, previewUrl, wavFile, permError, start, stop, reset, fmt }
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MossTTS() {
  const [status, setStatus] = useState<MossTTSStatus | null>(null)
  const [text, setText] = useState('')
  const [sourceMode, setSourceMode] = useState<SourceMode>('record')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [builtinVoice, setBuiltinVoice] = useState('zh_1')
  const [loading, setLoading] = useState(false)
  const [outputUrl, setOutputUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const prevOutputUrl = useRef<string | null>(null)
  const rec = useRecorder()

  useEffect(() => { getMossTTSStatus().then(setStatus) }, [])
  useEffect(() => () => { if (prevOutputUrl.current) URL.revokeObjectURL(prevOutputUrl.current) }, [])

  const handleGenerate = useCallback(async () => {
    if (!text.trim()) { setError('请输入要合成的文字'); return }
    if (sourceMode === 'record' && !rec.wavFile) { setError('请先录制参考音频'); return }
    if (sourceMode === 'upload' && !uploadFile) { setError('请上传参考音频文件'); return }
    setError(null); setLoading(true)
    if (prevOutputUrl.current) { URL.revokeObjectURL(prevOutputUrl.current); prevOutputUrl.current = null }
    setOutputUrl(null)
    try {
      const promptFile = sourceMode === 'record' ? rec.wavFile : sourceMode === 'upload' ? uploadFile : null
      const demoId = sourceMode === 'builtin' ? builtinVoice : undefined
      const url = await mossTTSSynthesize(text.trim(), promptFile, demoId)
      prevOutputUrl.current = url
      setOutputUrl(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [text, sourceMode, rec.wavFile, uploadFile, builtinVoice])

  const isOnline = status?.online ?? null

  const TAB: SourceMode[] = ['record', 'upload', 'builtin']
  const TAB_LABEL: Record<SourceMode, string> = { record: '🎙 录音', upload: '📁 上传文件', builtin: '🔊 内置音色' }

  return (
    <div style={{ height: '100%', overflow: 'auto', background: '#080E1C', padding: '24px 28px', fontFamily: '"Space Grotesk", -apple-system, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        .moss-textarea { background: #0C1526 !important; color: #C8DDF0 !important; border: 1px solid rgba(0,229,200,0.2) !important; border-radius: 8px !important; padding: 12px !important; font-size: 14px !important; font-family: inherit !important; resize: vertical; outline: none; width: 100%; box-sizing: border-box; transition: border-color 0.2s; }
        .moss-textarea::placeholder { color: #3D5A80; }
        .moss-textarea:focus { border-color: rgba(0,229,200,0.5) !important; box-shadow: 0 0 0 2px rgba(0,229,200,0.08) !important; }
        .moss-select { background: #0C1526; color: #C8DDF0; border: 1px solid rgba(0,229,200,0.2); border-radius: 8px; padding: 8px 12px; font-size: 13px; font-family: inherit; outline: none; width: 100%; cursor: pointer; }
        .moss-select option { background: #0C1526; }
        .moss-btn { border: none; border-radius: 8px; padding: 10px 24px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.15s; letter-spacing: 0.02em; }
        .moss-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        @keyframes pulse-ring { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.4)} 50%{box-shadow:0 0 0 12px rgba(239,68,68,0)} }
        .rec-pulse { animation: pulse-ring 1.2s ease-in-out infinite; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .rec-dot { animation: blink 1s ease-in-out infinite; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: '#00E5C8', letterSpacing: '0.14em', marginBottom: 6, textTransform: 'uppercase' }}>
          MOSS-TTS-NANO / 声音克隆
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <CustomerServiceOutlined style={{ fontSize: 26, color: '#F97316' }} />
          <h1 style={{ margin: 0, color: '#C8DDF0', fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>MOSS TTS Nano</h1>
        </div>
        <p style={{ margin: '6px 0 0', color: '#3D5A80', fontSize: 12, lineHeight: 1.6 }}>
          0.1B 轻量 TTS · 20 种语言 · 录音即可克隆声音 · 纯 CPU 运行
        </p>
      </div>

      {/* Status bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8, marginBottom: 20,
        background: isOnline === null ? 'rgba(61,90,128,0.1)' : isOnline ? 'rgba(12,240,122,0.05)' : 'rgba(239,68,68,0.07)',
        border: `1px solid ${isOnline === null ? 'rgba(61,90,128,0.25)' : isOnline ? 'rgba(12,240,122,0.2)' : 'rgba(239,68,68,0.2)'}`,
      }}>
        {isOnline === null
          ? <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 11, color: '#3D5A80' }}>● 检测中…</span>
          : isOnline
            ? <><CheckCircleOutlined style={{ color: '#0CF07A', fontSize: 13 }} /><span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 11, color: '#0CF07A' }}>服务在线 · 模型就绪</span></>
            : <><CloseCircleOutlined style={{ color: '#EF4444', fontSize: 13 }} /><span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 11, color: '#EF4444' }}>服务未启动</span></>
        }
        <button onClick={() => getMossTTSStatus().then(setStatus)} style={{ marginLeft: 'auto', background: 'transparent', border: '1px solid rgba(0,229,200,0.15)', borderRadius: 6, color: '#3D5A80', fontSize: 10, padding: '2px 8px', cursor: 'pointer', fontFamily: '"JetBrains Mono",monospace' }}>刷新</button>
      </div>

      <div style={{ display: 'grid', gap: 16, maxWidth: 720 }}>

        {/* Text input */}
        <div>
          <label style={{ display: 'block', color: '#526E8F', fontSize: 12, marginBottom: 6, fontWeight: 500 }}>
            合成文字 <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <textarea className="moss-textarea" rows={4} placeholder="输入要合成的文字，支持中文、英文等 20 种语言…" value={text} onChange={e => setText(e.target.value)} />
        </div>

        {/* Reference audio source */}
        <div style={{ background: '#0C1526', border: '1px solid rgba(0,229,200,0.12)', borderRadius: 10, overflow: 'hidden' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(0,229,200,0.1)' }}>
            {TAB.map(mode => (
              <button key={mode} onClick={() => setSourceMode(mode)} style={{
                flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                background: sourceMode === mode ? 'rgba(249,115,22,0.1)' : 'transparent',
                color: sourceMode === mode ? '#F97316' : '#3D5A80',
                borderBottom: sourceMode === mode ? '2px solid #F97316' : '2px solid transparent',
              }}>
                {TAB_LABEL[mode]}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ padding: '18px 16px' }}>

            {/* ── 录音 ── */}
            {sourceMode === 'record' && (
              <div>
                {rec.permError && (
                  <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 12, padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 6, border: '1px solid rgba(239,68,68,0.2)' }}>
                    {rec.permError}
                  </div>
                )}

                {rec.state === 'idle' && (
                  <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
                    <button onClick={rec.start} style={{
                      width: 72, height: 72, borderRadius: '50%', border: 'none', cursor: 'pointer',
                      background: 'rgba(239,68,68,0.15)', color: '#EF4444', fontSize: 28,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.25)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)' }}
                    >
                      <AudioOutlined />
                    </button>
                    <div style={{ color: '#3D5A80', fontSize: 12, marginTop: 10 }}>点击开始录音（建议 5-10 秒清晰人声）</div>
                  </div>
                )}

                {rec.state === 'recording' && (
                  <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
                    <button onClick={rec.stop} className="rec-pulse" style={{
                      width: 72, height: 72, borderRadius: '50%', border: 'none', cursor: 'pointer',
                      background: '#EF4444', color: '#fff', fontSize: 22,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      ■
                    </button>
                    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <span className="rec-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
                      <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 18, color: '#C8DDF0', letterSpacing: '0.05em' }}>{rec.fmt(rec.seconds)}</span>
                    </div>
                    <div style={{ color: '#3D5A80', fontSize: 12, marginTop: 6 }}>录制中… 点击停止</div>
                  </div>
                )}

                {rec.state === 'done' && (
                  <div>
                    <div style={{ color: '#526E8F', fontSize: 11, fontFamily: '"JetBrains Mono",monospace', marginBottom: 8, letterSpacing: '0.06em' }}>
                      参考音频预览 · {rec.fmt(rec.seconds)}
                    </div>
                    {rec.previewUrl && <audio controls src={rec.previewUrl} style={{ width: '100%', marginBottom: 10 }} />}
                    <button onClick={rec.reset} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: 'transparent', border: '1px solid rgba(239,68,68,0.3)',
                      color: '#EF4444', borderRadius: 6, padding: '5px 12px',
                      fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                      <DeleteOutlined style={{ fontSize: 11 }} /> 重新录制
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── 上传文件 ── */}
            {sourceMode === 'upload' && (
              <div>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `1px dashed ${uploadFile ? 'rgba(0,229,200,0.5)' : 'rgba(0,229,200,0.2)'}`,
                    borderRadius: 8, padding: '20px 16px', cursor: 'pointer', textAlign: 'center',
                    background: uploadFile ? 'rgba(0,229,200,0.04)' : 'transparent', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { if (!uploadFile) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,229,200,0.4)' }}
                  onMouseLeave={e => { if (!uploadFile) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,229,200,0.2)' }}
                >
                  <UploadOutlined style={{ fontSize: 22, color: uploadFile ? '#00E5C8' : '#3D5A80', marginBottom: 8, display: 'block' }} />
                  <div style={{ color: uploadFile ? '#00E5C8' : '#3D5A80', fontSize: 13 }}>
                    {uploadFile ? uploadFile.name : '点击上传 WAV / MP3 参考音频'}
                  </div>
                  {!uploadFile && <div style={{ color: '#2A3A52', fontSize: 11, marginTop: 4 }}>建议 3-10 秒清晰人声</div>}
                </div>
                <input ref={fileInputRef} type="file" accept=".wav,.mp3,audio/*" style={{ display: 'none' }}
                  onChange={e => setUploadFile(e.target.files?.[0] ?? null)} />
                {uploadFile && (
                  <button onClick={() => { setUploadFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }} style={{
                    marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: 'transparent', border: '1px solid rgba(239,68,68,0.3)',
                    color: '#EF4444', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    <DeleteOutlined style={{ fontSize: 11 }} /> 移除
                  </button>
                )}
              </div>
            )}

            {/* ── 内置音色 ── */}
            {sourceMode === 'builtin' && (
              <div>
                <div style={{ color: '#526E8F', fontSize: 12, marginBottom: 8 }}>选择内置示例音色</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {BUILTIN_VOICES.map(v => (
                    <button key={v.value} onClick={() => setBuiltinVoice(v.value)} style={{
                      padding: '8px 16px', borderRadius: 8, border: `1px solid ${builtinVoice === v.value ? 'rgba(249,115,22,0.5)' : 'rgba(0,229,200,0.15)'}`,
                      background: builtinVoice === v.value ? 'rgba(249,115,22,0.12)' : 'transparent',
                      color: builtinVoice === v.value ? '#F97316' : '#526E8F',
                      fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: builtinVoice === v.value ? 600 : 400,
                      transition: 'all 0.15s',
                    }}>
                      {v.label}
                    </button>
                  ))}
                </div>
                <div style={{ color: '#2A3A52', fontSize: 11, marginTop: 10 }}>内置音色为模型预设，无需上传参考音频</div>
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ color: '#EF4444', fontSize: 13, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px' }}>
            {error}
          </div>
        )}

        {/* Generate */}
        <button className="moss-btn" disabled={loading || !isOnline} onClick={handleGenerate}
          style={{ background: loading ? 'rgba(249,115,22,0.3)' : '#F97316', color: '#fff', width: '100%', padding: '12px 0' }}>
          {loading ? '⏳ 生成中… 约需 5-15 秒' : '▶ 生成语音'}
        </button>

        {/* Output */}
        {outputUrl && (
          <div style={{ background: '#0C1526', border: '1px solid rgba(249,115,22,0.25)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ color: '#526E8F', fontSize: 10, marginBottom: 10, fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.08em' }}>
              OUTPUT / 48kHz STEREO WAV
            </div>
            <audio controls src={outputUrl} style={{ width: '100%' }} />
            <a href={outputUrl} download="moss-tts-output.wav" style={{ display: 'inline-block', marginTop: 8, fontSize: 12, color: '#F97316', textDecoration: 'none', fontFamily: '"JetBrains Mono",monospace' }}>
              ↓ 下载 WAV
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
