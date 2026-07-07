import { NavLink, Outlet } from 'react-router-dom';
import { css } from '@emotion/react';

const navStyle = css`
  display: flex;
  gap: 16px;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 16px;
  a {
    color: #666;
    text-decoration: none;
    &.active {
      color: #1677ff;
      font-weight: 500;
    }
  }
`;

export default function StoreLayout() {
  return (
    <div>
      <nav css={navStyle}>
        <NavLink to="/store" end>商品列表</NavLink>
        <NavLink to="/store/login">登录</NavLink>
        <NavLink to="/store/register">注册</NavLink>
        <NavLink to="/store/admin/products">后台-商品</NavLink>
        <NavLink to="/store/admin/orders">后台-订单</NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
