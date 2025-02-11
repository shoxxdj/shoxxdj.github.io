import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "shoxxdj.fr",
  description: "Le blog d'un pentester bidouilleur",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Writeups', link: '/writeups' },
      {text:'CVE',link:'/cve'},
      {text:'Articles',link:'/articles'}
    ],

    // sidebar: [
    //   {
    //     text: 'Examples',
    //     items: [
    //       { text: 'Markdown Examples', link: '/markdown-examples' },
    //       { text: 'Runtime API Examples', link: '/api-examples' }
    //     ]
    //   }
    // ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/shoxxdj' },
      { icon: 'twitter',link: 'https://x.com/shoxxdj'}
    ]
  }
})
