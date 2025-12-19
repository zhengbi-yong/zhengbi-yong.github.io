interface MusicSheet {
  id: string
  title: string
  src: string
  description?: string
  composer?: string
  year?: string
}

const musicSheets: MusicSheet[] = [
  {
    id: 'flower_dance',
    title: 'Flower Dance',
    src: 'flower_dance.mxl',
    description: '一首优美的钢琴曲，旋律流畅，情感丰富。',
    composer: 'DJ Okawari',
  },
  {
    id: 'simple-example',
    title: '简单示例',
    src: 'simple-example.xml',
    description: '一个简单的 MusicXML 示例乐谱。',
  },
  {
    id: 'multi-part-example',
    title: '多声部示例',
    src: 'multi-part-example.xml',
    description: '展示多声部音乐的 MusicXML 示例。',
  },
]

export default musicSheets

