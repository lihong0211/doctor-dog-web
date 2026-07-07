export default {
  route: {
    path: '/',
    routes: [
      {
        path: '/english',
        name: '学英语',
        component: '../English',
      },
      {
        path: '/business-data',
        name: '业务数据',
        component: '../BusinessData',
      },
      {
        path: '/store',
        name: '商品店铺',
        component: '../Store',
      },
    ],
  },
  
};
