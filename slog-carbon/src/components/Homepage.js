import React from 'react';
import { HomepageBanner, HomepageCallout } from 'gatsby-theme-carbon';
import HomepageTemplate from 'gatsby-theme-carbon/src/templates/Homepage';
import { AnchorLink, AnchorLinks } from 'gatsby-theme-carbon';
import Carbon from './carbon.jpg';

const FirstLeftText = () => <p>个人简介</p>;

const FirstRightText = () => (
  <p>
    <code>清华大学</code>自动化系2019级本科生，<code>北京理工大学</code>自动化学院2024级硕士生。研究兴趣：深度学习、强化学习、机器人、计算机视觉和多模态。
    <AnchorLinks>
      <AnchorLink to='https://zhengbi-yong.github.io'>了解更多</AnchorLink>
    </AnchorLinks>
  </p>
);

const BannerText = () => <h1>Sisyphus' Blog</h1>;

const customProps = {
  Banner: <HomepageBanner renderText={BannerText} image={Carbon} />,
  FirstCallout: (
    <HomepageCallout
      backgroundColor="#030303"
      color="white"
      leftText={FirstLeftText}
      rightText={FirstRightText}
    />
  ),
};

// spreading the original props gives us props.children (mdx content)
function ShadowedHomepage(props) {
  return <HomepageTemplate {...props} {...customProps} />;
}

export default ShadowedHomepage;
