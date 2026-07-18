import { render, screen, within } from '@testing-library/react';
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
    render(<English />);

    expect(screen.getByText('ENGLISH WORKBENCH')).toBeVisible();
    expect(screen.getByRole('heading', { name: '英语学习中心' })).toBeVisible();

    const navigation = screen.getByRole('navigation', { name: '英语学习模块' });
    const labels = ['用户', '单词', '词库', '词根', '词缀', '日常用语'];
    const buttons = labels.map((label) =>
      screen.getByRole('button', { name: label }),
    );

    expect(navigation).toContainElement(buttons[0]);
    expect(
      within(navigation)
        .getAllByRole('button')
        .map((button) => button.getAttribute('aria-label')),
    ).toEqual(labels);
    expect(buttons[0]).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('用户内容')).toBeVisible();
  });
});
