import * as React from 'react';
import { Link, graphql } from 'gatsby';
import Layout from '../../components/layout';
import Seo from '../../components/seo';
import { Typography, Card, CardContent, CardActions, Button } from '@mui/material';

const BlogPage = ({ data }) => {
  return (
    <Layout pageTitle="My Blog Posts">
      {data.allMdx.nodes.map((node) => (
        <Card key={node.id} sx={{ marginBottom: 2 }}>
          <CardContent>
            <Typography variant="h5" component="h2">
              <Link to={`/blog/${node.frontmatter.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                {node.frontmatter.title}
              </Link>
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Posted: {node.frontmatter.date}
            </Typography>
            <Typography variant="body1">{node.excerpt}</Typography>
          </CardContent>
          <CardActions>
            <Button size="small" color="primary">
              <Link to={`/blog/${node.frontmatter.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                Read More
              </Link>
            </Button>
          </CardActions>
        </Card>
      ))}
    </Layout>
  );
};

export const query = graphql`
  query {
    allMdx(sort: { frontmatter: { date: DESC } }) {
      nodes {
        frontmatter {
          date(formatString: "MMMM D, YYYY")
          title
          slug
        }
        id
        excerpt
      }
    }
  }
`;

export const Head = () => <Seo title="My Blog Posts" />;

export default BlogPage;
