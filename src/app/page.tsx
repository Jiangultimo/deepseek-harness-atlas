import { redirect } from 'next/navigation'
import { DEFAULT_LOCALE } from '@/content/i18n'

/** 根路径不承载内容，直接送到默认语言。 */
export default function RootPage() {
  redirect(`/${DEFAULT_LOCALE}`)
}
