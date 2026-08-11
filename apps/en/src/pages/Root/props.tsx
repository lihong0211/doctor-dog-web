export default {
  route: {
    path: '/',
    routes: [
      {
        path: '/english/console?module=users',
        key: '/english/console?module=users',
        name: '用户',
        component: '../English',
      },
      {
        path: '/english/console?module=words',
        key: '/english/console?module=words',
        name: '单词',
        component: '../English',
      },
      {
        path: '/english/console?module=libraries',
        key: '/english/console?module=libraries',
        name: '词库',
        component: '../English',
      },
      {
        path: '/english/console?module=roots',
        key: '/english/console?module=roots',
        name: '词根',
        component: '../English',
      },
      {
        path: '/english/console?module=affixes',
        key: '/english/console?module=affixes',
        name: '词缀',
        component: '../English',
      },
      {
        path: '/english/console?module=speech',
        key: '/english/console?module=speech',
        name: '日常用语',
        component: '../English',
      },
      {
        path: '/english/console?module=interview',
        key: '/english/console?module=interview',
        name: '面试题',
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
