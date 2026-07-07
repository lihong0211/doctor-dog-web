import { useState, useRef, useEffect } from 'react'
import { Layout, Typography, Input, Button, message } from 'antd'
import { SendOutlined } from '@ant-design/icons'
import { motion, AnimatePresence } from 'framer-motion'
import { ttsSynthesize } from '../service/tts'

const { Content } = Layout
const { Title } = Typography
const { TextArea } = Input

export default function TTS() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  const stopAudio = () => {
    const a = audioRef.current
    if (a) {
      a.pause()
      a.currentTime = 0
      audioRef.current = null
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    setPlaying(false)
    setText('')
  }

  useEffect(() => {
    return stopAudio
  }, [])

  const handleSubmit = async () => {
    const trimmed = text.trim()
    if (!trimmed) {
      message.warning('请输入要合成的文字')
      return
    }
    if (loading || playing) return
    setError(null)
    stopAudio()
    setLoading(true)
    try {
      const blob = await ttsSynthesize(trimmed)
      const url = URL.createObjectURL(blob)
      objectUrlRef.current = url
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => stopAudio()
      audio.onerror = () => {
        message.error('播放失败')
        stopAudio()
      }
      setLoading(false)
      setPlaying(true)
      await audio.play()
    } catch (e) {
      setLoading(false)
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      message.error(msg)
    }
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
          文字转语音 (TTS)
        </Title>
        <span style={{ fontSize: 14, color: 'var(--ds-text-muted)' }}>edge-tts</span>
      </div>

      <Content
        style={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'transparent',
        }}
      >
        {/* 中间：发送后展示音频波形动画 */}
        <div
          style={{
            flex: 1,
            minHeight: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            padding: 24,
          }}
        >
          <AnimatePresence>
            {(loading || playing) && (
              <motion.div
                key="waveform"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.25 }}
                style={{ display: 'flex', alignItems: 'center', gap: 5 }}
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={playing
                      ? { scaleY: [0.15, 1, 0.3, 0.85, 0.15] }
                      : { scaleY: [0.15, 0.45, 0.15] }
                    }
                    transition={{
                      duration: playing ? 0.9 : 1.4,
                      repeat: Infinity,
                      delay: i * 0.07,
                      ease: 'easeInOut',
                    }}
                    style={{
                      width: 4,
                      height: 48,
                      borderRadius: 3,
                      background: 'var(--ds-primary)',
                      transformOrigin: 'center',
                      opacity: playing ? 1 : 0.5,
                    }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {error && (
          <div style={{ padding: '0 24px', color: 'var(--ds-primary)', marginBottom: 8, fontSize: 14, textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* 底部输入区：与 Chat 同宽同位置，padding 16px 24px 24px */}
        <div
          style={{
            padding: '16px 24px 24px',
            background: 'transparent',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              borderRadius: 12,
              padding: '12px 14px',
              background: 'var(--ds-bg)',
              border: 'none',
              boxShadow: 'none',
            }}
          >
            <TextArea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
              placeholder="输入要转换的文字，回车或点击发送"
              autoSize={{ minRows: 1, maxRows: 3 }}
              bordered={false}
              style={{
                background: 'transparent',
                resize: 'none',
                color: 'var(--ds-text)',
              }}
              disabled={loading}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={loading}
                onClick={handleSubmit}
                disabled={playing}
                style={{
                  background: 'var(--ds-primary)',
                  borderColor: 'var(--ds-primary)',
                  fontWeight: 500,
                  minWidth: 88,
                }}
              >
                发送
              </Button>
            </div>
          </div>
        </div>
      </Content>

    </Layout>
  )
}
