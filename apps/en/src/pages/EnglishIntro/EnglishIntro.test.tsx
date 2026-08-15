import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import EnglishIntro from './index';

describe('English intro page', () => {
  it('shows the hero, console entry, desktop downloads, QR code and footer', () => {
    render(
      <MemoryRouter initialEntries={['/english']}>
        <EnglishIntro />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: '随时随地，把单词学进脑子里' }),
    ).toBeVisible();

    expect(screen.getByRole('link', { name: '进入控制台' })).toHaveAttribute(
      'href',
      '/en/english/console',
    );

    expect(
      screen.getByRole('link', { name: 'Mac (Apple Silicon)' }),
    ).toHaveAttribute(
      'href',
      'https://github.com/lihong0211/en-app/releases/download/v2.1.1/learn-english-2.1.1-arm.dmg',
    );
    expect(screen.getByRole('link', { name: 'Mac (Intel)' })).toHaveAttribute(
      'href',
      'https://github.com/lihong0211/en-app/releases/download/v2.1.1/learn-english-2.1.1-intel.dmg',
    );
    expect(screen.getByRole('link', { name: 'Windows' })).toHaveAttribute(
      'href',
      'https://github.com/lihong0211/en-app/releases/download/v2.1.1/learn-english-2.1.1.exe',
    );

    expect(screen.getByAltText('学英语小程序二维码')).toBeVisible();
    expect(screen.getByText('备案号：蜀ICP备2024044574号')).toBeVisible();
  });
});
