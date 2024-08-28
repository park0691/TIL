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
          'java-intro'
        ],
      },
      {
        text: 'Database',
        prefix: '/database/',
        children: [],
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