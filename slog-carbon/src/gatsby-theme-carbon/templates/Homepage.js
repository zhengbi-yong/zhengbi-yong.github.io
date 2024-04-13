import React from 'react';
import Layout from '../../../node_modules/gatsby-theme-carbon/src/components/Layout';
// import { HomepageBanner, HomepageCallout } from '../../../node_modules/gatsby-theme-carbon/src/components/Homepage';
// import Carbon from '../../../node_modules/gatsby-theme-carbon/src/images/carbon.jpg';
import Main from '../../../node_modules/gatsby-theme-carbon/src/components/Main';
import useMetadata from '../../../node_modules/gatsby-theme-carbon/src/util/hooks/useMetadata';
import Utils from '../../../node_modules/gatsby-theme-carbon/src/components/Utils';

// import NextPrevious from '../../../node_modules/gatsby-theme-carbon/src/components/NextPrevious';

const Homepage = ({
  children,
  Banner,
  FirstCallout,
  SecondCallout,
  location,
  pageContext,
}) => {
  const { frontmatter = {}, titleType } = pageContext;
  const { title, description, keywords } = frontmatter;
  const { homepageTheme } = useMetadata();

  return (
    <Layout
      pageTitle={title}
      pageDescription={description}
      pageKeywords={keywords}
      titleType={titleType}
      homepage
      theme={homepageTheme}>
      {Banner}
      {FirstCallout}
      <Main>{children}</Main>
      {SecondCallout}
      <Utils />
    </Layout>
  );
};

export default Homepage;
