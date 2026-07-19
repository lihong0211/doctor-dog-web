import { useEffect } from 'react';
import { ProLayout, PageContainer } from '@ant-design/pro-components';
import { ConfigProvider } from 'antd';
import { css } from '@emotion/react';
import { Outlet, useLocation, NavLink } from 'react-router-dom';
import layoutProps from './props';
import EnDesktopAuthStatus from '../EnDesktop/AuthStatus';
import { enTheme } from '../../theme/antdTheme';

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

    &.en-app-shell--english .ant-pro-global-header {
      border-bottom: 1px solid #232d39;
      box-shadow: 0 1px 0 rgba(255, 255, 255, 0.02);
    }

    &.en-app-shell--english .en-header-account {
      display: inline-flex;
      width: 40px;
      height: 40px;
      align-items: center;
      justify-content: center;
      padding: 0;
    }

    &.en-app-shell--english .en-header-account .ant-avatar {
      color: #07110e;
      background: #00c98d;
    }

    &.en-app-shell--english .ant-menu-item {
      border-left: 3px solid transparent;
      color: #aab5c0;
    }

    &.en-app-shell--english .ant-menu-item:hover {
      color: #f3f6f8 !important;
      background: rgba(0, 201, 141, 0.08) !important;
    }

    &.en-app-shell--english .ant-menu-item-selected {
      color: #f3f6f8 !important;
      border-left-color: #00c98d;
      background: #123f35 !important;
      box-shadow: inset 0 0 0 1px rgba(0, 201, 141, 0.24);
    }

    &.en-app-shell--english .ant-menu-item-selected a {
      color: #f3f6f8 !important;
      font-weight: 700;
    }

    &.en-app-shell--english,
    &.en-app-shell--english * {
      scrollbar-width: thin;
      scrollbar-color: #287a67 #0d1117;
    }

    &.en-app-shell--english *::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    &.en-app-shell--english *::-webkit-scrollbar-track {
      background: #0d1117;
    }

    &.en-app-shell--english *::-webkit-scrollbar-thumb {
      border: 2px solid #0d1117;
      border-radius: 999px;
      background: #287a67;
    }

    &.en-app-shell--english *::-webkit-scrollbar-thumb:hover {
      background: #00c98d;
    }
  `;
  return (
    <ConfigProvider theme={isEnglish ? enTheme : undefined}>
      <ProLayout
      {...layoutProps}
      className={`h-full en-app-shell${isEnglish ? ' en-app-shell--english' : ''}`}
      layout="mix"
      theme="dark"
      logo={isEnglish ? false : undefined}
      title={isEnglish ? '英语工作台' : undefined}
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
                colorBgMenuItemSelected: '#123f35',
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
      <PageContainer
        title={isEnglish ? false : undefined}
        pageHeaderRender={isEnglish ? false : undefined}
      >
        <Outlet />
      </PageContainer>
      {/* <Footer></Footer> */}
      </ProLayout>
    </ConfigProvider>
  );
}
