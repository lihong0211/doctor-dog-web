import { useState, useRef, useEffect } from 'react'
import { Layout, Typography, Button, Spin } from 'antd'
import { SoundOutlined, StopOutlined } from '@ant-design/icons'
import { motion, AnimatePresence } from 'framer-motion'
import { sttStream, getSttWsUrl } from '../service/stt'

const { Content } = Layout
const { Title } = Typography

const CHUNK_MS = 2000

export default function STT() {
  const [transcript, setTranscript] = useState('')
  const [uploading, setUploading] = useState(false)
  const [pressing, setPressing] = useState(false)
  const [liveActive, setLiveActive] = useState(false)
  const [liveConnecting, setLiveConnecting] = useState(false)
  const [liveError, setLiveError] = useState<string | null>(null)
  const [sentChunks, setSentChunks] = useState(0)
  const wsRef = useRef<WebSocket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const stopLiveRef = useRef<(() => void) | null>(null)
  const liveUserClosedRef = useRef(false)
  const pressStreamRef = useRef<MediaStream | null>(null)
  const pressRecorderRef = useRef<MediaRecorder | null>(null)

  useEffect(() => {
    return () => {
      stopLiveRef.current?.()
    }
  }, [])

  const startPressRecord = async () => {
    if (pressing || uploading || liveActive) return
    setLiveError(null)
    setPressing(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      pressStreamRef.current = stream
      const recorder = new MediaRecorder(stream)
      pressRecorderRef.current = recorder
      const chunks: Blob[] = []
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data)
      }
      recorder.onstop = () => {
        const s = pressStreamRef.current
        if (s) {
          s.getTracks().forEach((t) => t.stop())
          pressStreamRef.current = null
        }
        pressRecorderRef.current = null
        setPressing(false)
        if (chunks.length === 0) return
        const blob = new Blob(chunks, { type: 'audio/webm' })
        setUploading(true)
        sttStream(blob, {
          language: 'zh',
          onText: (text) => setTranscript((prev) => prev + text),
          onError: (err) => setTranscript((prev) => prev + '\n[错误] ' + err.message),
        }).finally(() => setUploading(false))
      }
      recorder.start()
    } catch (e) {
      setPressing(false)
      setLiveError('无法打开麦克风: ' + (e instanceof Error ? e.message : String(e)))
    }
  }

  const stopPressRecord = () => {
    if (!pressing) return
    const recorder = pressRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
    } else {
      const s = pressStreamRef.current
      if (s) {
        s.getTracks().forEach((t) => t.stop())
        pressStreamRef.current = null
      }
      pressRecorderRef.current = null
      setPressing(false)
    }
  }

  useEffect(() => {
    if (!pressing) return
    const onUp = () => stopPressRecord()
    document.addEventListener('pointerup', onUp)
    document.addEventListener('pointercancel', onUp)
    return () => {
      document.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointercancel', onUp)
    }
  }, [pressing])

  const startLive = async () => {
    if (liveActive || liveConnecting) return
    setLiveError(null)
    setTranscript('')
    setSentChunks(0)
    setLiveConnecting(true)

    try {
      // 先请求麦克风（必须在用户手势内），再建 WebSocket
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const wsUrl = getSttWsUrl()
      if (!wsUrl) {
        setLiveError('无法获取 WebSocket 地址')
        stream.getTracks().forEach((t) => t.stop())
        setLiveConnecting(false)
        return
      }

      const ws = new WebSocket(wsUrl)
      wsRef.current = ws
      const chunks: Blob[] = []
      let chunkTimer: ReturnType<typeof setTimeout>

      ws.onopen = () => {
        setLiveConnecting(false)
        setLiveActive(true)
        const recorder = new MediaRecorder(stream)
        mediaRecorderRef.current = recorder

        recorder.ondataavailable = (e) => {
          if (e.data.size) chunks.push(e.data)
        }

        recorder.onstop = () => {
          if (chunks.length === 0) {
            chunkTimer = setTimeout(sendChunk, CHUNK_MS)
            return
          }
          const blob = new Blob(chunks, { type: 'audio/webm' })
          const reader = new FileReader()
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1] || reader.result
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ audio_base64: base64, language: 'zh' }))
              setSentChunks((n) => n + 1)
            }
            chunkTimer = setTimeout(sendChunk, CHUNK_MS)
          }
          reader.readAsDataURL(blob)
        }

        function sendChunk() {
          if (ws.readyState !== WebSocket.OPEN || !mediaRecorderRef.current) return
          chunks.length = 0
          mediaRecorderRef.current.start()
          setTimeout(() => mediaRecorderRef.current?.stop(), CHUNK_MS)
        }

        sendChunk()
      }

      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data) as { text?: string; error?: string }
          if (data.error) setTranscript((prev) => prev + '\n[错误] ' + data.error)
          else if (data.text) setTranscript((prev) => prev + data.text)
        } catch (_) {}
      }

      ws.onerror = () => {
        if (!liveUserClosedRef.current) setLiveError('WebSocket 连接错误')
      }

      ws.onclose = () => {
        if (liveUserClosedRef.current) setLiveError(null)
        liveUserClosedRef.current = false
        setLiveActive(false)
        setLiveConnecting(false)
        const mr = mediaRecorderRef.current
        if (mr && mr.state !== 'inactive') mr.stop()
        stream.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        mediaRecorderRef.current = null
        wsRef.current = null
      }

      stopLiveRef.current = () => {
        liveUserClosedRef.current = true
        clearTimeout(chunkTimer)
        ws.close()
      }
    } catch (e) {
      setLiveConnecting(false)
      setLiveError('无法打开麦克风: ' + (e instanceof Error ? e.message : String(e)))
    }
  }

  const stopLive = () => {
    stopLiveRef.current?.()
    stopLiveRef.current = null
  }

  return (
    <Layout
      style={{
        height: '100%',
        minHeight: 400,
        background: 'transparent',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'transparent',
        }}
      >
        <Title level={5} style={{ margin: 0, color: 'var(--ds-text)', fontWeight: 600 }}>
          语音转文字 (STT)
        </Title>
        <span style={{ fontSize: 14, color: 'var(--ds-text-muted)' }}>faster-whisper</span>
      </div>

      <Content
        style={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: 24,
          background: 'transparent',
        }}
      >
        {liveError && (
          <div style={{ color: 'var(--ds-primary)', marginBottom: 8, fontSize: 14, flexShrink: 0 }}>{liveError}</div>
        )}

        <AnimatePresence>
          {liveActive && (
            <motion.div
              key="live-banner"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              style={{
                marginBottom: 12,
                padding: '8px 12px',
                borderRadius: 8,
                background: 'rgba(59, 130, 246, 0.08)',
                fontSize: 13,
                color: 'var(--ds-text)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexShrink: 0,
              }}
            >
              <motion.span
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#ef4444',
                  flexShrink: 0,
                }}
              />
              <span>正在录音并发送（每 {CHUNK_MS / 1000} 秒一段）</span>
              <span style={{ color: 'var(--ds-text-muted)' }}>· 已发送 {sentChunks} 段</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 内容区域：无背景、无边框、无说明文字 */}
        <div
          style={{
            flex: 1,
            minHeight: 200,
            overflow: 'auto',
          }}
        >
          <AnimatePresence>
            {uploading && !transcript && (
              <motion.div
                key="recognizing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ds-text-muted)' }}
              >
                <Spin size="small" tip="识别中" />
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div
            key={transcript}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            style={{ whiteSpace: 'pre-wrap', color: 'var(--ds-text)', lineHeight: 1.7 }}
          >
            {transcript}
          </motion.div>
        </div>

        {/* 底部居中圆形按钮 */}
        <div
          style={{
            flexShrink: 0,
            padding: '16px 0 0',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 24,
          }}
        >
          {/* 长按说话按钮 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <motion.div
              animate={{ scale: pressing ? 0.88 : 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              style={{ position: 'relative', display: 'inline-flex' }}
            >
              {pressing && (
                <motion.span
                  animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'easeOut' }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    background: '#ef4444',
                    pointerEvents: 'none',
                  }}
                />
              )}
              <Button
                type="primary"
                icon={<SoundOutlined />}
                onPointerDown={(e) => { e.preventDefault(); startPressRecord() }}
                onPointerUp={stopPressRecord}
                onPointerLeave={stopPressRecord}
                disabled={uploading || liveActive}
                style={{
                  width: 56,
                  height: 56,
                  minWidth: 56,
                  padding: 0,
                  borderRadius: '50%',
                  ...(pressing && { background: '#ef4444', borderColor: '#ef4444' }),
                }}
                title={pressing ? '松开发送' : '长按说话'}
              />
            </motion.div>
            <span style={{ fontSize: 12, color: 'var(--ds-text-muted)' }}>
              {pressing ? '松开发送' : '长按说话'}
            </span>
          </div>

          {/* 实时转写 / 停止按钮 */}
          <AnimatePresence mode="wait">
            {!liveActive ? (
              <motion.div
                key="start-live"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.18 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
              >
                <Button
                  icon={<SoundOutlined />}
                  onClick={startLive}
                  disabled={uploading || liveConnecting || pressing}
                  loading={liveConnecting}
                  style={{ width: 56, height: 56, minWidth: 56, padding: 0, borderRadius: '50%' }}
                  title={liveConnecting ? '正在连接...' : '实时转写'}
                />
                <span style={{ fontSize: 12, color: 'var(--ds-text-muted)' }}>
                  {liveConnecting ? '连接中...' : '实时转写'}
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="stop-live"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.18 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
              >
                <div style={{ position: 'relative', display: 'inline-flex' }}>
                  <motion.span
                    animate={{ scale: [1, 1.5], opacity: [0.35, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '50%',
                      background: '#ef4444',
                      pointerEvents: 'none',
                    }}
                  />
                  <Button
                    danger
                    icon={<StopOutlined />}
                    onClick={stopLive}
                    style={{ width: 56, height: 56, minWidth: 56, padding: 0, borderRadius: '50%' }}
                    title="停止"
                  />
                </div>
                <span style={{ fontSize: 12, color: 'var(--ds-text-muted)' }}>停止</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Content>
    </Layout>
  )
}
