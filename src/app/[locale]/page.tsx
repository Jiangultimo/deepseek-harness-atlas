import { notFound } from 'next/navigation'
import { AtlasShell } from '@/components/atlas/AtlasShell'
import { isLocale } from '@/content/i18n'

export default async function Home({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  return <AtlasShell locale={locale} />
}
