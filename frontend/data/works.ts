import worksData from '../public/data/works.json'

interface Work {
  name: string
  description?: string
  image: string
  url: string
  tags?: string[]
  video?: string | null
  isShow?: boolean
}

export default worksData as Work[]