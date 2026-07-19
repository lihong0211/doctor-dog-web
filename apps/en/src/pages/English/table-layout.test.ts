import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) =>
  readFileSync(resolve(process.cwd(), 'src/pages', path), 'utf8');

describe('English table layout contracts', () => {
  it('keeps create only in the words search actions', () => {
    expect(source('EnDesktop/Words/index.tsx')).toContain('optionRender');

    for (const path of [
      'EnDesktop/Users/index.tsx',
      'EnDesktop/Libraries/index.tsx',
      'English/Root/index.tsx',
      'English/Affix/index.tsx',
      'English/LivingSpeech/index.tsx',
    ]) {
      expect(source(path)).toContain('toolBarRender={false}');
    }
  });

  it('removes fixed table heights and adds scoped dark scrollbars', () => {
    for (const path of [
      'EnDesktop/Words/index.tsx',
      'EnDesktop/Users/index.tsx',
      'English/Root/index.tsx',
      'English/Affix/index.tsx',
      'English/LivingSpeech/index.tsx',
    ]) {
      expect(source(path)).not.toContain('y: 450');
    }

    const css = source('English/English.css');
    expect(css).toContain('scrollbar-color');
    expect(css).toContain('::-webkit-scrollbar');
  });
});
