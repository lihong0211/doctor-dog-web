import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import English from './index';

vi.mock('./Root', () => ({ default: () => <div>词根内容</div> }));
vi.mock('./Affix', () => ({ default: () => <div>词缀内容</div> }));
vi.mock('./LivingSpeech', () => ({ default: () => <div>日常用语内容</div> }));
vi.mock('../EnDesktop/Words', () => ({ default: () => <div>单词内容</div> }));
vi.mock('../EnDesktop/Libraries', () => ({ default: () => <div>词库内容</div> }));
vi.mock('../EnDesktop/Users', () => ({ default: () => <div>用户内容</div> }));

describe('English workbench', () => {
  it('shows the approved sidebar order and defaults to users', () => {
    render(
      <MemoryRouter initialEntries={['/english']}>
        <English />
      </MemoryRouter>,
    );

    expect(screen.getByText('ENGLISH WORKBENCH')).toBeVisible();
    expect(screen.getByRole('heading', { name: '英语学习中心' })).toBeVisible();

    expect(
      screen.queryByRole('navigation', { name: '英语学习模块' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('用户内容')).toBeVisible();
  });
});
