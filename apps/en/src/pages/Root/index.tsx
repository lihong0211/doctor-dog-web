import { useEffect } from 'react';
import { ProLayout, PageContainer } from '@ant-design/pro-components';
import { css } from '@emotion/react';
import { Outlet, useLocation, NavLink } from 'react-router-dom';
import layoutProps from './props';
import EnDesktopAuthStatus from '../EnDesktop/AuthStatus';

const FIXED_TITLE = '二仙桥大爷 | 学英语';

export default function Root() {
  const { pathname } = useLocation();

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
  `;
  return (
    <ProLayout
      {...layoutProps}
      className="h-full en-app-shell"
      layout="mix"
      theme="dark"
      location={{ pathname }}
      menuItemRender={(item: any, dom: any) => (
        <NavLink to={item.key!}>{dom}</NavLink>
      )}
      actionsRender={() => [<EnDesktopAuthStatus key="en-desktop-auth" />]}
      css={style}
    >
      <PageContainer>
        <Outlet />
      </PageContainer>
      {/* <Footer></Footer> */}
    </ProLayout>
  );
}
