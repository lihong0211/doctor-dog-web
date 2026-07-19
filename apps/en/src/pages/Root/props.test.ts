import { describe, expect, it } from 'vitest';
import layoutProps from './props';

describe('English outer navigation', () => {
  it('puts all English modules in the outer sidebar in approved order', () => {
    const routes = layoutProps.route.routes.filter(
      ({ path }) => path.startsWith('/english'),
    );

    expect(routes.map(({ name }) => name)).toEqual([
      '用户',
      '单词',
      '词库',
      '词根',
      '词缀',
      '日常用语',
    ]);
    expect(routes.map(({ path }) => path)).toEqual([
      '/english?module=users',
      '/english?module=words',
      '/english?module=libraries',
      '/english?module=roots',
      '/english?module=affixes',
      '/english?module=speech',
    ]);
    expect(routes.map(({ key }) => key)).toEqual(routes.map(({ path }) => path));
  });
});
