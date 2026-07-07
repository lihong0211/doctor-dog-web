import Root from './pages/Root/index';
import English from './pages/English/index';
import BusinessData from './pages/BusinessData/index';
import StoreLayout from './pages/Store/StoreLayout';
import ProductList from './pages/Store/ProductList';
import ProductDetail from './pages/Store/ProductDetail';
import StoreLogin from './pages/Store/Login';
import StoreRegister from './pages/Store/Register';
import AdminProducts from './pages/Store/AdminProducts';
import AdminOrders from './pages/Store/AdminOrders';
import Test from './pages/English/Test/index';
import { createBrowserRouter, Navigate } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      {
        index: true,
        element: <Navigate to="/english" replace />,
      },
      {
        path: '/english',
        element: <English />,
      },
      {
        path: '/business-data',
        element: <BusinessData />,
      },
      {
        path: '/store',
        element: <StoreLayout />,
        children: [
          { index: true, element: <ProductList /> },
          { path: 'product/:id', element: <ProductDetail /> },
          { path: 'login', element: <StoreLogin /> },
          { path: 'register', element: <StoreRegister /> },
          { path: 'admin/products', element: <AdminProducts /> },
          { path: 'admin/orders', element: <AdminOrders /> },
        ],
      },
      {
        path: '/test',
        element: <Test />,
      },
    ],
  },
],{
  basename: '/en'
});

export default router;

export const navigate = router.navigate;
