// Step 1: Import React
import * as React from 'react';
import Layout from '../components/layout';
import { StaticImage } from 'gatsby-plugin-image';
import Seo from '../components/seo';
import { animated, useSpring } from 'react-spring';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import './index.css';



// Step 2: Define your component
const IndexPage = () => {
  const fadeIn = useSpring({
    to: { opacity: 1 },
    from: { opacity: 0 },
    delay: 500, // 延迟 500 毫秒开始动画
  });
  return (
    <Layout pageTitle="Home Page">
      <h1>Test The Roboto font</h1>
      <animated.p style={fadeIn}>I'm making this by following the Gatsby Tutorial.</animated.p>
      <animated.div style={fadeIn}>
        <StaticImage
          alt="The logo of THU"
          src="../images/THU_logo.png"
        />
      </animated.div>
    </Layout>
  );
};

export const Head = () => <Seo title="Home Page" />

export default IndexPage;
