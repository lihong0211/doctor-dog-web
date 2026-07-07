import axios from 'axios';

const instance = axios.create({
  baseURL: import.meta.env.PROD ? 'https://api.doctor-dog.com' : '',
  timeout: 30000, // 增加到30秒，避免复杂查询超时
});

instance.interceptors.response.use(
  (res) => {
    if (res?.data?.code === 200) {
      return Promise.resolve(res?.data?.data);
    } else {
      return Promise.reject(res?.data?.msg);
    }
  },
  (err) => {
    throw err;
  },
);

export default instance;
