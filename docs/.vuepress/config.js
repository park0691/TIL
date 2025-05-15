import { viteBundler } from '@vuepress/bundler-vite'
import { defaultTheme } from '@vuepress/theme-default'
import { defineUserConfig } from 'vuepress'

export default defineUserConfig({
  bundler: viteBundler(),
  theme: defaultTheme({
    sidebar: [
      {
        text: 'Book / Lecture',
        prefix: '/book-lecture',
        children: [
          {
            text: '토비의 스프링 3.1',
            children: [
              'toby-spring/toby-ch-06-aop'
            ],
          },
          {
            text: 'Spring Security 6 완전 정복',
            children: [
              'spring-security-v6/section-02',
              'spring-security-v6/section-03',
              'spring-security-v6/section-04'
            ],
          },
        ]
      },
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
            text: 'Collections',
            children: [
              'collections-hashing',
              'collections-map'
            ]
          },
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
        text: 'Spring',
        prefix: '/spring/',
        children: [
          'aop'
        ]
      },
      {
        text: 'Database',
        prefix: '/database/',
        children: [
          'transaction',
          'index'
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