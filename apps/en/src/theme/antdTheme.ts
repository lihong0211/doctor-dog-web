import { theme, type ThemeConfig } from 'antd'
import { enTokens } from './tokens'

export const enTheme: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: enTokens.primary,
    colorPrimaryHover: enTokens.primaryHover,
    colorBgBase: enTokens.canvas,
    colorBgContainer: enTokens.surface2,
    colorBgElevated: enTokens.surface3,
    colorBorder: enTokens.border,
    colorBorderSecondary: enTokens.border,
    colorText: enTokens.text,
    colorTextSecondary: enTokens.textSecondary,
    colorTextTertiary: enTokens.textTertiary,
    colorSuccess: enTokens.success,
    colorWarning: enTokens.warning,
    colorError: enTokens.error,
    borderRadius: enTokens.radius,
    fontFamily: enTokens.fontFamily,
  },
  components: {
    Layout: {
      bodyBg: enTokens.canvas,
      headerBg: enTokens.surface1,
      siderBg: enTokens.surface1,
    },
    Menu: {
      darkItemBg: enTokens.surface1,
      darkItemSelectedBg: 'rgba(0, 201, 141, 0.12)',
      darkItemSelectedColor: enTokens.primary,
      itemBorderRadius: 8,
    },
    Table: {
      headerBg: enTokens.surface1,
      headerColor: enTokens.textSecondary,
      rowHoverBg: enTokens.surface3,
      borderColor: enTokens.border,
      footerBg: enTokens.surface1,
    },
    Tabs: {
      itemColor: enTokens.textSecondary,
      itemSelectedColor: enTokens.primary,
      itemHoverColor: enTokens.primaryHover,
      inkBarColor: enTokens.primary,
    },
    Card: {
      colorBgContainer: enTokens.surface2,
      colorBorderSecondary: enTokens.border,
    },
    Input: {
      colorBgContainer: enTokens.surface1,
      activeBorderColor: enTokens.primary,
      hoverBorderColor: enTokens.primaryHover,
    },
    Select: {
      colorBgContainer: enTokens.surface1,
      optionSelectedBg: 'rgba(0, 201, 141, 0.12)',
    },
    Button: {
      primaryColor: '#04130E',
      colorPrimary: enTokens.primary,
      colorPrimaryHover: enTokens.primaryHover,
    },
    Drawer: {
      colorBgElevated: enTokens.surface2,
    },
    Modal: {
      contentBg: enTokens.surface2,
      headerBg: enTokens.surface2,
      footerBg: enTokens.surface2,
    },
    Pagination: {
      itemActiveBg: enTokens.surface3,
    },
  },
}
