import React from 'react';
import ResourceLinks from 'gatsby-theme-carbon/src/components/LeftNav/ResourceLinks';

const links = [
  {
    title: 'Github',
    href: 'https://github.com/zhengbi-yong',
  },
  {
    title: '知乎',
    href: 'https://www.zhihu.com/people/peter-79-84',
  },
  {
    title: 'BiliBili',
    href: 'https://space.bilibili.com/514023785',
  },
];

// shouldOpenNewTabs: true if outbound links should open in a new tab
const CustomResources = () => <ResourceLinks shouldOpenNewTabs links={links} />;

export default CustomResources;
