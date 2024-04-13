import React from 'react';
import Footer from 'gatsby-theme-carbon/src/components/Footer';

const Content = ({ buildTime }) => (
  <>
    <p>
      最后一次部署的时间：<code>{buildTime}</code>
    </p>
    <p>
      本网站基于 <a href="https://www.gatsbyjs.com/"> Gatsby </a>和 <a href="https://gatsby-theme-carbon.vercel.app"> Gatsby Theme Carbon </a>
    </p>
  </>
);

const links = {
  firstCol: [
    { href: 'https://github.com/zhengbi-yong', linkText: 'GitHub Profile' },
    { href: 'https://www.zhihu.com/people/peter-79-84', linkText: '知乎主页' },
    { href: 'https://space.bilibili.com/514023785', linkText: 'BiliBili' },
  ],
  secondCol: [
    { href: 'https://react.dev', linkText: 'React' },
    { href: 'https://www.gatsbyjs.com', linkText: 'Gatsby' },
    { href: 'https://gatsby-theme-carbon.vercel.app', linkText: 'Gatsby Theme Carbon' },
  ],
};

const CustomFooter = () => <Footer links={links} Content={Content} />;

export default CustomFooter;
