export type AudioItem = {
  id: number;
  display_name: string;
  url: string;
};

export type TtsAudio = {
  id: number;
  url: string;
  updated_at: string;
} | null;

export type QuestionItem = {
  id: number;
  question: string;
  spoken_desc: string;
  key_points: string;
  category: string | null;
  mastery: string;
  created_at: string;
  audios: AudioItem[];
  tts_audio: TtsAudio;
};

export const MASTERY_LEVELS = ['未复习', '需加强', '基本掌握', '已掌握'] as const;

export const MASTERY_COLORS: Record<string, string> = {
  未复习: 'default',
  需加强: 'orange',
  基本掌握: 'blue',
  已掌握: 'green',
};

// 分类存的是"大类/子标签"，筛选只按大类分组
export function mainCategory(category: string | null): string {
  return category?.split('/')[0] || '';
}
