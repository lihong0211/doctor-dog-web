import './styles/index.css';
import './reset.stylus';
import 'antd/dist/reset.css';

import 'animate.css';
import { ConfigProvider } from 'antd';

import { RouterProvider } from 'react-router-dom';

import router from './Router';
import { enTheme } from './theme/antdTheme';

function App() {
  return (
    <ConfigProvider theme={enTheme}>
      <RouterProvider router={router} />
    </ConfigProvider>
  );
}

export default App;
