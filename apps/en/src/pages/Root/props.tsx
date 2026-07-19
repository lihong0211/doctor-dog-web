export default {
  route: {
    path: '/',
    routes: [
      {
        path: '/english?module=users',
        key: '/english?module=users',
        name: '用户',
        component: '../English',
      },
      {
        path: '/english?module=words',
        key: '/english?module=words',
        name: '单词',
        component: '../English',
      },
      {
        path: '/english?module=libraries',
        key: '/english?module=libraries',
        name: '词库',
        component: '../English',
      },
      {
        path: '/english?module=roots',
        key: '/english?module=roots',
        name: '词根',
        component: '../English',
      },
      {
        path: '/english?module=affixes',
        key: '/english?module=affixes',
        name: '词缀',
        component: '../English',
      },
      {
        path: '/english?module=speech',
        key: '/english?module=speech',
        name: '日常用语',
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
