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
              'jvm-gc-algorithm',
              'jvm-garbage-collector'
            ],
          },
          'generics',
          {
            text: 'Thread Programming',
            children: [
              'thread-runnable',
              'thread-fork-join',
              'thread-callable-future-executor',
              'thread-completable-future'
            ],
          },
          'reactive-programming-basic',
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