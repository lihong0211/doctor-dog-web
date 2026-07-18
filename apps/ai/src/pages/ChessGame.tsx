import { useState } from 'react'
import { Layout, Typography, Card, Input, Button, Space, Tag, List, message, Spin, Alert } from 'antd'
import { AppstoreOutlined, ReloadOutlined, SendOutlined } from '@ant-design/icons'
import { newChessGame, makeMove, type ChessState } from '../service/chess-game'

const { Content } = Layout
const { Title, Text } = Typography

export default function ChessGame() {
  const [game, setGame] = useState<ChessState | null>(null)
  const [moveInput, setMoveInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<{ player: string; move: string }[]>([])

  const handleNew = async () => {
    setLoading(true)
    setHistory([])
    try {
      const g = await newChessGame()
      setGame(g)
    } catch {
      message.error('创建游戏失败，请确认后端服务已启动')
    } finally {
      setLoading(false)
    }
  }

  const handleMove = async () => {
    if (!game || !moveInput.trim()) return
    if (game.game_over) return message.warning('游戏已结束，请重新开始')
    const move = moveInput.trim().toLowerCase()
    setMoveInput('')
    setLoading(true)
    try {
      const g = await makeMove(game.game_id, move)
      setGame(g)
      setHistory(prev => [
        ...prev,
        { player: '你', move },
        ...(g.ai_move ? [{ player: 'AI', move: g.ai_move }] : []),
      ])
      if (g.game_over) {
        message.success(`游戏结束！结果：${g.result}`)
      }
    } catch (e) {
      message.error(e instanceof Error ? e.message : '走法无效')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout style={{ height: '100%', background: 'var(--ai-surface-2)' }}>
      <Content style={{ padding: 24, overflow: 'auto', height: '100%' }}>
        <Space align="center" style={{ marginBottom: 20 }}>
          <AppstoreOutlined style={{ fontSize: 28, color: 'var(--ai-primary)' }} />
          <Title level={3} style={{ margin: 0 }}>AI 象棋对弈</Title>
        </Space>

        <Alert message="走法使用 UCI 格式，例如 e2e4（从 e2 移到 e4）。白棋先手，你执白。" type="info" showIcon style={{ marginBottom: 16 }} />

        <div style={{ display: 'grid', gridTemplateColumns: '500px 1fr', gap: 16 }}>
          <div>
            <Card
              title="棋盘"
              extra={<Button icon={<ReloadOutlined />} onClick={handleNew} loading={loading && !game}>新游戏</Button>}
            >
              {!game && (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#aaa' }}>
                  <AppstoreOutlined style={{ fontSize: 64, marginBottom: 16 }} />
                  <div>点击"新游戏"开始对局</div>
                </div>
              )}
              {game && (
                <div
                  dangerouslySetInnerHTML={{ __html: game.board_svg }}
                  style={{ maxWidth: '100%', overflow: 'hidden' }}
                />
              )}
            </Card>
            {game && !game.game_over && (
              <Card style={{ marginTop: 12 }}>
                <Space.Compact style={{ width: '100%' }}>
                  <Input
                    placeholder="输入走法，如 e2e4"
                    value={moveInput}
                    onChange={e => setMoveInput(e.target.value)}
                    onPressEnter={handleMove}
                    disabled={loading}
                  />
                  <Button type="primary" icon={<SendOutlined />} onClick={handleMove} loading={loading}>走棋</Button>
                </Space.Compact>
                <Tag style={{ marginTop: 8 }} color={game.turn === 'white' ? 'blue' : 'default'}>
                  当前：{game.turn === 'white' ? '白棋（你）' : '黑棋（AI）'}
                </Tag>
              </Card>
            )}
            {game?.game_over && (
              <Alert message={`游戏结束！结果：${game.result}`} type="success" showIcon style={{ marginTop: 12 }} />
            )}
          </div>

          <Card title="走法记录">
            {loading && <Spin size="small" style={{ display: 'block', margin: '8px auto' }} />}
            {history.length === 0 ? (
              <Text type="secondary">暂无走法记录</Text>
            ) : (
              <List
                size="small"
                dataSource={[...history].reverse()}
                renderItem={(item, i) => (
                  <List.Item>
                    <Tag color={item.player === 'AI' ? 'orange' : 'blue'}>{item.player}</Tag>
                    <Text code>{item.move}</Text>
                    <Text type="secondary" style={{ marginLeft: 8 }}>第 {history.length - i} 步</Text>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </div>
      </Content>
    </Layout>
  )
}
