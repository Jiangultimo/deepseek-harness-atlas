import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LOCALES, isLocale } from '@/content/i18n'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params
  const zh = locale !== 'en'
  return {
    title: zh ? 'DeepSeek Harness 地图' : 'DeepSeek Harness Atlas',
    description: zh
      ? '一张可以把玩的 3D 架构地图：22 块地按关注点分成七片，地形高度是真实代码行数，道路是真实的依赖关系。'
      : 'A 3D architecture map you can play with: 22 plots across seven territories, terrain height is real line count, roads are real dependencies.',
  }
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<'/[locale]'>) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  return children
}
