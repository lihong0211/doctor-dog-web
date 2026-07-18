import './styles/index.css';
import './reset.stylus';
import 'antd/dist/reset.css';

import 'animate.css';

import { RouterProvider } from 'react-router-dom';

import router from './Router';

function App() {
  return <RouterProvider router={router} />;
}

export default App;
