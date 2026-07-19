import { useEffect } from 'react';
import { ProLayout, PageContainer } from '@ant-design/pro-components';
import { css } from '@emotion/react';
import { Outlet, useLocation, NavLink } from 'react-router-dom';
import layoutProps from './props';
import EnDesktopAuthStatus from '../EnDesktop/AuthStatus';

const FIXED_TITLE = '二仙桥大爷 | 学英语';

export default function Root() {
  const { pathname, search } = useLocation();
  const isEnglish = pathname === '/english';
  const englishLocation =
    search && search.includes('module=') ? `${pathname}${search}` : '/english?module=users';

  useEffect(() => {
    document.title = FIXED_TITLE;
  }, [pathname]);
  const style = css`
    .ant-layout {
      height: 100%;
      .ant-layout-content {
        overflow: auto;
        padding: 0;
      }
    }

    &.en-app-shell--english,
    &.en-app-shell--english .ant-layout,
    &.en-app-shell--english .ant-pro-layout-container,
    &.en-app-shell--english .ant-pro-layout-content,
    &.en-app-shell--english .ant-pro-page-container {
      background: #07090d;
    }

    &.en-app-shell--english .ant-pro-page-container-children-container {
      padding: 0;
    }

    &.en-app-shell--english .ant-pro-global-header,
    &.en-app-shell--english .ant-pro-sider {
      border-color: #232d39;
    }
  `;
  return (
    <ProLayout
      {...layoutProps}
      className={`h-full en-app-shell${isEnglish ? ' en-app-shell--english' : ''}`}
      layout="mix"
      theme="dark"
      title={isEnglish ? 'ENGLISH' : undefined}
      location={{ pathname: isEnglish ? englishLocation : pathname }}
      token={
        isEnglish
          ? {
              bgLayout: '#07090d',
              header: {
                colorBgHeader: '#0d1117',
                colorBgScrollHeader: '#0d1117',
                colorHeaderTitle: '#f3f6f8',
                colorTextRightActionsItem: '#aab5c0',
              },
              sider: {
                colorMenuBackground: '#0d1117',
                colorBgCollapsedButton: '#131922',
                colorTextCollapsedButton: '#aab5c0',
                colorTextMenu: '#aab5c0',
                colorTextMenuSelected: '#f3f6f8',
                colorBgMenuItemSelected: 'rgba(0, 201, 141, 0.14)',
                colorTextMenuActive: '#00c98d',
              },
              pageContainer: {
                colorBgPageContainer: '#07090d',
                colorBgPageContainerFixed: '#07090d',
              },
            }
          : undefined
      }
      menuItemRender={(item: any, dom: any) => (
        <NavLink to={item.key!}>{dom}</NavLink>
      )}
      actionsRender={() => [<EnDesktopAuthStatus key="en-desktop-auth" />]}
      css={style}
    >
      <PageContainer title={isEnglish ? false : undefined}>
        <Outlet />
      </PageContainer>
      {/* <Footer></Footer> */}
    </ProLayout>
  );
}
