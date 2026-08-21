import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DeepSeek Harness 地图',
  description:
    '一张可以把玩的 3D 架构地图：22 块地按关注点分成七片，地形高度是真实代码行数，道路是真实的依赖关系。',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    // 浏览器扩展（翻译类插件尤其常见）会在 React 接管之前往 html/body 上写属性，
    // 造成服务端与客户端的属性对不上。suppressHydrationWarning 只放过当前这一层
    // 元素的属性差异，不影响子树的水合校验——所以自己写出来的不一致仍然会报出来。
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
