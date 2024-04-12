import React from 'react';
import { HomepageBanner, HomepageCallout } from 'gatsby-theme-carbon';
import HomepageTemplate from 'gatsby-theme-carbon/src/templates/Homepage';
import { calloutLink } from './Homepage.module.scss';

import Carbon from './carbon.jpg';

const FirstLeftText = () => <p>个人简介</p>;

const FirstRightText = () => (
  <p>
    本人是清华大学自动化系2019级本科学生，2024年预计在北京理工大学自动化学院继续学习。对<code>深度学习</code>、<code>强化学习</code>、<code>机器人</code>、<code>计算机视觉</code>和<code>多模态</code>等领域具有研究兴趣。
    <a
      className={calloutLink}
      href="https://zhengbi-yong.github.io">
      个人主页 →
    </a>
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
