interface MusicSheet {
  id: string
  title: string
  src: string
  description?: string
  composer?: string
  year?: string
  category?: string
  instrument?: string
  difficulty?: string
}

const musicSheets: MusicSheet[] = [
  {
    id: 'flower_dance',
    title: 'Flower Dance',
    src: 'flower_dance.mxl',
    description: '一首优美的钢琴曲，旋律流畅，情感丰富。灵感源自自然花卉的绽放与凋零，适合中高级演奏者。',
    composer: 'DJ Okawari',
    year: '2010',
    category: 'Piano',
    instrument: 'Piano Solo',
    difficulty: 'Intermediate',
  },
  {
    id: 'simple-example',
    title: '简单示例',
    src: 'simple-example.xml',
    description: '一个简单的 MusicXML 示例乐谱，适合初学者了解乐谱结构。',
    year: '2025',
    category: 'Etude',
    instrument: 'Piano',
    difficulty: 'Beginner',
  },
  {
    id: 'multi-part-example',
    title: '多声部示例',
    src: 'multi-part-example.xml',
    description: '展示多声部音乐的 MusicXML 示例，涵盖和声与对位技法。',
    year: '2025',
    category: 'Ensemble',
    instrument: 'Mixed',
    difficulty: 'Advanced',
  },
]

export default musicSheets

