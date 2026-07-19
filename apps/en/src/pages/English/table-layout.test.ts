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

    for (const path of [
      'EnDesktop/Words/index.tsx',
      'English/LivingSpeech/index.tsx',
    ]) {
      expect(source(path)).toContain("calc(100dvh - 311px)");
    }

    for (const path of [
      'EnDesktop/Users/index.tsx',
      'EnDesktop/Libraries/index.tsx',
      'English/Root/index.tsx',
      'English/Affix/index.tsx',
    ]) {
      expect(source(path)).toContain("calc(100dvh - 215px)");
    }

    const css = source('English/English.css');
    expect(css).toContain('scrollbar-color');
    expect(css).toContain('::-webkit-scrollbar');
    expect(css).toContain('.en-workbench-module > .ant-pro-table');
    expect(css).toContain('margin-top: 12px');
    expect(css).toContain('margin-bottom: 15px');
  });

  it('keeps the full-width header and aligns content below it', () => {
    const root = source('Root/index.tsx');
    expect(root).not.toContain('headerRender={isEnglish ? false');
    expect(root).toContain("title={isEnglish ? '英语工作台'");
    expect(root).toContain('pageHeaderRender={isEnglish ? false');
  });

  it('applies the English dark theme to header portals and login modal', () => {
    expect(source('Root/index.tsx')).toContain(
      '<ConfigProvider theme={isEnglish ? enTheme : undefined}>',
    );
    expect(source('EnDesktop/Login.tsx')).toContain(
      'rootClassName="en-login-modal"',
    );
  });
});
