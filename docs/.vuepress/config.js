import { viteBundler } from '@vuepress/bundler-vite'
import { defaultTheme } from '@vuepress/theme-default'
import { defineUserConfig } from 'vuepress'

export default defineUserConfig({
  bundler: viteBundler(),
  theme: defaultTheme({
    sidebar: [
      {
        text: 'Java',
        prefix: '/java/',
        children: [
          {
            text: 'JVM, Java Virtual Machine',
            children: [
              'jvm-class-loader',
              'jvm-runtime-data-area',
              'jvm-gc-algorithm'
            ],
          },
          'functional-interface-lambda'
        ],
      },
      {
        text: 'Database',
        prefix: '/database/',
        children: [
          'transaction'
        ],
      },
    ],
    navbar: [
      {
        text: 'Blog',
        link: 'https://park0691.github.io/',
      },
    ],
  }),

  title: 'depark\'s note',
  base: '/TIL/'
})