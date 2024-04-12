import * as React from 'react'
import Layout from '../components/layout'
import Seo from '../components/seo'
import Button from '@mui/material/Button';

// ButtonUsage 组件
export function ButtonUsage() {
  return <Button variant="contained">Hello world</Button>;
}
const ExperimentPage = () => {
  return (
    <Layout pageTitle="Experiment">
          <p>This Page is for some experiments.</p>
          <ButtonUsage />
    </Layout>
  )
}

export const Head = () => <Seo title="Experiment" />

export default ExperimentPage