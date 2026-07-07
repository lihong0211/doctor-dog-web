import './styles/index.css';
import './reset.stylus';
import 'antd/dist/reset.css';

import 'animate.css';
import { ConfigProvider } from 'antd';

import { RouterProvider } from 'react-router-dom';

import router from './Router';

ConfigProvider.config({
  theme: {
    primaryColor: '#d0021b',
  },
});

function App() {
  return (
    <ConfigProvider>
      <RouterProvider router={router} />
    </ConfigProvider>
  );
}

export default App;
