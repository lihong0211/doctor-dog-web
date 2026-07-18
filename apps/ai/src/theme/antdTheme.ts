import { theme, type ThemeConfig } from 'antd'
import { aiTokens } from './tokens'

export const aiTheme: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: aiTokens.primary,
    colorSuccess: aiTokens.success,
    colorWarning: aiTokens.warning,
    colorError: aiTokens.error,
    colorBgBase: aiTokens.canvas,
    colorBgContainer: aiTokens.surface2,
    colorBgElevated: aiTokens.surface3,
    colorBorder: aiTokens.borderStrong,
    colorBorderSecondary: aiTokens.border,
    colorText: aiTokens.text,
    colorTextSecondary: aiTokens.textSecondary,
    colorTextTertiary: aiTokens.textTertiary,
    fontFamily: aiTokens.fontFamily,
    fontFamilyCode: aiTokens.fontFamilyCode,
    borderRadius: aiTokens.radiusControl,
    controlHeight: aiTokens.controlHeight,
    boxShadow: 'none',
    boxShadowSecondary: '0 16px 48px rgba(0, 0, 0, 0.36)',
  },
  components: {
    Layout: {
      bodyBg: aiTokens.canvas,
      headerBg: aiTokens.surface1,
      siderBg: aiTokens.surface1,
    },
    Menu: {
      darkItemBg: aiTokens.surface1,
      darkSubMenuItemBg: aiTokens.surface1,
      darkItemColor: aiTokens.textSecondary,
      darkItemHoverBg: aiTokens.surface3,
      darkItemHoverColor: aiTokens.text,
      darkItemSelectedBg: aiTokens.primaryMuted,
      darkItemSelectedColor: aiTokens.primary,
      itemBorderRadius: aiTokens.radiusControl,
      itemHeight: 40,
    },
    Tabs: {
      itemColor: aiTokens.textSecondary,
      itemHoverColor: aiTokens.text,
      itemSelectedColor: aiTokens.primary,
      inkBarColor: aiTokens.primary,
    },
    Button: {
      primaryShadow: 'none',
      defaultShadow: 'none',
      borderColorDisabled: aiTokens.border,
    },
    Input: {
      activeBorderColor: aiTokens.primary,
      hoverBorderColor: aiTokens.borderStrong,
      activeShadow: '0 0 0 2px rgba(0, 201, 141, 0.16)',
    },
    Card: {
      colorBgContainer: aiTokens.surface2,
      colorBorderSecondary: aiTokens.border,
    },
    Tag: {
      defaultBg: aiTokens.surface3,
      defaultColor: aiTokens.textSecondary,
    },
    Modal: {
      contentBg: aiTokens.surface2,
      headerBg: aiTokens.surface2,
    },
    Table: {
      headerBg: aiTokens.surface2,
      headerColor: aiTokens.textSecondary,
      rowHoverBg: aiTokens.surface3,
      borderColor: aiTokens.border,
    },
    Tooltip: {
      colorBgSpotlight: aiTokens.surface4,
      colorTextLightSolid: aiTokens.text,
    },
  },
}
