import request from './request'

export interface ChessState {
  game_id: string
  fen: string
  board_svg: string
  turn?: string
  ai_move?: string | null
  game_over?: boolean
  result?: string | null
}

export async function newChessGame(): Promise<ChessState> {
  const res = await request.post('/ai/chess/new', {})
  return res.data
}

export async function makeMove(gameId: string, move: string): Promise<ChessState> {
  const res = await request.post('/ai/chess/move', { game_id: gameId, move })
  return res.data
}
