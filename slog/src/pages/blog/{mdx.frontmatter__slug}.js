import * as React from 'react';
import { graphql } from 'gatsby';
import { GatsbyImage, getImage } from 'gatsby-plugin-image';
import Layout from '../../components/layout';
import Seo from '../../components/seo';
import { Container, Typography, Paper, Link, Box } from '@mui/material';
import { MDXProvider } from '@mdx-js/react';
// 定义自定义组件
const CustomHeading1 = (props) => <Typography variant="h4" gutterBottom {...props} />;
const CustomParagraph = (props) => <Typography {...props} />;
const CustomLink = (props) => <Link underline="hover" color="secondary" {...props} />;

// 组件映射
const components = {
  h1: CustomHeading1,
  p: CustomParagraph,
  a: CustomLink,
  // 可以根据需要添加更多的映射
};

// 包装您的布局组件
const BlogPostLayout = ({ children }) => (
  <MDXProvider components={components}>
    <Layout>
      {children}
    </Layout>
  </MDXProvider>
);
const BlogPost = ({ data, children }) => {
  const image = getImage(data.mdx.frontmatter.hero_image)
  return (
  <BlogPostLayout pageTitle={data.mdx.frontmatter.title}>
      <Container maxWidth="md"> {/* 调整 maxWidth 以更好地适应内容 */}
        <Box my={4}>
          <GatsbyImage image={image} alt={data.mdx.frontmatter.hero_image_alt} />
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Photo Credit: <Link href={data.mdx.frontmatter.hero_image_credit_link}>{data.mdx.frontmatter.hero_image_credit_text}</Link>
          </Typography>
          <Paper elevation={3} sx={{ p: 3 }}>
            {children} {/* MDX 内容将自动应用上面定义的自定义组件 */}
          </Paper>
        </Box>
      </Container>
  </BlogPostLayout>
  );
}

export const query = graphql`
  query($id: String) {
    mdx(id: {eq: $id}) {
      frontmatter {
        title
        date(formatString: "MMMM DD, YYYY")
        hero_image_alt
        hero_image_credit_link
        hero_image_credit_text
        hero_image {
          childImageSharp {
            gatsbyImageData
          }
        }
      }
    }
  }
`

export const Head = ({ data }) => <Seo title={data.mdx.frontmatter.title} />

export default BlogPost;
