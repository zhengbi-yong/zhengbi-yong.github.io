import React from 'react';
import slugify from 'slugify';
import { useStaticQuery, graphql } from 'gatsby';

import Utils from '../../../node_modules/gatsby-theme-carbon/src/components/Utils';
import Layout from '../../../node_modules/gatsby-theme-carbon/src/components/Layout';
import PageHeader from '../../../node_modules/gatsby-theme-carbon/src/components/PageHeader';
import EditLink from '../../../node_modules/gatsby-theme-carbon/src/components/EditLink';
import NextPrevious from '../../../node_modules/gatsby-theme-carbon/src/components/NextPrevious';
import PageTabs from '../../../node_modules/gatsby-theme-carbon/src/components/PageTabs';
import Main from '../../../node_modules/gatsby-theme-carbon/src/components/Main';
import useMetadata from '../../../node_modules/gatsby-theme-carbon/src/util/hooks/useMetadata';
import LastModifiedDate from '../../../node_modules/gatsby-theme-carbon/src/components/LastModifiedDate';
import "katex/dist/katex.min.css";
const Default = ({ pageContext, children, location, Title }) => {
  const { frontmatter = {}, relativePagePath, titleType } = pageContext;
  const {
    tabs,
    title,
    theme: frontmatterTheme,
    description,
    keywords,
    date,
  } = frontmatter;

  const { interiorTheme } = useMetadata();

  // get the path prefix if it exists
  const {
    site: { pathPrefix },
  } = useStaticQuery(graphql`
    query PATH_PREFIX_QUERY {
      site {
        pathPrefix
      }
    }
  `);

  // let gatsby handle prefixing
  const slug = pathPrefix
    ? location.pathname.replace(pathPrefix, '')
    : location.pathname;

  const getCurrentTab = () => {
    if (!tabs) return '';
    return (
      slug.split('/').filter(Boolean).slice(-1)[0] ||
      slugify(tabs[0], { lower: true })
    );
  };

  const currentTab = getCurrentTab();

  const theme = frontmatterTheme || interiorTheme;

  return (
    <Layout
      tabs={tabs}
      homepage={false}
      theme={theme}
      pageTitle={title}
      pageDescription={description}
      pageKeywords={keywords}
      titleType={titleType}>
      <PageHeader
        title={Title ? <Title /> : title}
        label="label"
        tabs={tabs}
        theme={theme}
      />
      {tabs && (
        <PageTabs
          title={title}
          slug={slug}
          tabs={tabs}
          currentTab={currentTab}
        />
      )}
      <Main padded>
        {children}
        <EditLink relativePagePath={relativePagePath} />
        <LastModifiedDate date={date} />
      </Main>
      <NextPrevious
        pageContext={pageContext}
        location={location}
        slug={slug}
        tabs={tabs}
        currentTab={currentTab}
      />
      <Utils />
    </Layout>
  );
};

export default Default;
