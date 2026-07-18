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
        path: '/store',
        name: '商品店铺',
        component: '../Store',
        hideInMenu: true,
      },
    ],
  },
  
};
