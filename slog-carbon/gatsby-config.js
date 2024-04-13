module.exports = {
  siteMetadata: {
    title: 'Sisyphus\' Blog',
    description: 'Blog of Zheng Biyong, a student of Tsinghua University and Beijing Institute of Technology. Research interests: deep learning, reinforcement learning, robotics, computer vision and multimodal.',
    keywords: 'blog, deep learning, reinforcement learning, robotics, computer vision, multimodal, Zheng Biyong, Tsinghua University, Beijing Institute of Technology, student, undergraduate, master, 2019, 2024, 2019级, 2024级, 本科生, 硕士生, 清华大学, 北京理工大学, 学生, 深度学习, 强化学习, 机器人, 计算机视觉, 多模态'
  },
  pathPrefix: `/gtc`,
  plugins: [
    {
      resolve: 'gatsby-plugin-manifest',
      options: {
        name: 'Carbon Design Gatsby Theme',
        icon: 'src/images/favicon.svg',
        short_name: 'Gatsby Theme Carbon',
        start_url: '/',
        background_color: '#ffffff',
        theme_color: '#161616',
        display: 'browser',
      },
    },
    {
      resolve: 'gatsby-theme-carbon',
      options: {
        mediumAccount: 'carbondesign',
        isSwitcherEnabled: false,
      },
    },
  ],
};
