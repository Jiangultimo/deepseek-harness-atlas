/**
 * 只支持中英两种。语言是 URL 的第一段（/zh、/en），
 * 这样一条链接就带着语言，分享出去不会串。
 */
export const LOCALES = ['zh', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'zh'

export function isLocale(v: string): v is Locale {
  return (LOCALES as readonly string[]).includes(v)
}

/** 一段双语文本。数据文件里所有给人看的字段都长这样。 */
export interface I18nText {
  zh: string
  en: string
}

export function t(text: I18nText, locale: Locale): string {
  return text[locale]
}

export const LOCALE_LABEL: Record<Locale, string> = {
  zh: '中文',
  en: 'English',
}

/** 界面词条。正文在档案文件里，这里只放框架上的字。 */
export const UI = {
  brand: { zh: 'DeepSeek Harness 地图', en: 'DeepSeek Harness Atlas' },
  eyebrow: { zh: 'ARCHITECTURE ATLAS', en: 'ARCHITECTURE ATLAS' },

  expandLegend: { zh: '展开图例', en: 'Expand legend' },
  collapseLegend: { zh: '收起图例', en: 'Collapse legend' },
  regionsHeading: { zh: '七片板块', en: 'Seven territories' },
  blocksUnit: { zh: '块', en: ' plots' },
  roadsUnit: { zh: '路', en: ' links' },

  signLabel: { zh: '架构解剖', en: 'The Dissection' },
  signHint: { zh: '先读这个 →', en: 'Start here →' },

  reportTitle: { zh: '架构解剖', en: 'Architecture Dissection' },
  backToMap: { zh: '返回地图', en: 'Back to map' },
  backToList: { zh: '返回清单', en: 'Back to list' },
  backOneLevel: { zh: '返回上一层', en: 'Back' },
  recenter: { zh: '回正视角', en: 'Recenter' },

  roadsLegend: { zh: '道路 · 点击开关', en: 'Links · click to toggle' },
  blockRoads: { zh: '这块的道路', en: 'Links from here' },
  highlights: { zh: '这块的看点', en: 'What to look at' },
  mechanisms: { zh: '几个值得单独说的设计', en: 'Designs worth calling out' },
  lessons: { zh: '能带走的判断', en: 'What you can take away' },
  tradeoffs: { zh: '它付出的代价', en: 'What it costs' },
  packages: { zh: '涉及的包', en: 'Packages involved' },
  codeIndex: { zh: '代码索引', en: 'Code index' },
  related: { zh: '相关模块', en: 'Related' },

  loadingMap: { zh: '正在测绘…', en: 'Surveying…' },
  loadingArchive: { zh: '正在取档案…', en: 'Fetching the file…' },
  archiveFailed: {
    zh: '档案没能载入。刷新页面再试一次。',
    en: 'Could not load this file. Try refreshing.',
  },
  archivePending: {
    zh: '这块的完整档案还在编写中。下面是已经确定的要点。',
    en: 'This file is still being written. Here is what is already settled.',
  },

  expandFullscreen: { zh: '全屏查看', en: 'Fullscreen' },
  collapseFullscreen: { zh: '收回侧栏', en: 'Exit fullscreen' },
  closePanel: { zh: '返回板块', en: 'Back to territory' },

  mobileNote: {
    zh: '3D 地图需要更大的屏幕。这里是同样的 22 块地，按七片板块分组。',
    en: 'The 3D map needs a bigger screen. Same 22 plots, grouped into seven territories.',
  },
  linesUnit: { zh: ' 行', en: ' lines' },
} as const

export type UiKey = keyof typeof UI

export function ui(key: UiKey, locale: Locale): string {
  return UI[key][locale]
}
