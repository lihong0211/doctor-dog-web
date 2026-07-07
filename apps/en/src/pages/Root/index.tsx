import { useEffect } from 'react';
import { ProLayout, PageContainer } from '@ant-design/pro-components';
import { css } from '@emotion/react';
import { Outlet, useLocation, NavLink } from 'react-router-dom';
import layoutProps from './props';

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
      className="h-full"
      layout="mix"
      theme="dark"
      location={{ pathname }}
      menuItemRender={(item: any, dom: any) => (
        <NavLink to={item.key!}>{dom}</NavLink>
      )}
      css={style}
    >
      <PageContainer>
        <Outlet />
      </PageContainer>
      {/* <Footer></Footer> */}
    </ProLayout>
  );
}
