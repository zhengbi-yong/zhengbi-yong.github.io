import { notFound } from 'next/navigation'
import FullscreenMusicSheet from '@/components/FullscreenMusicSheet'

// 乐谱配置映射
const musicSheets: Record<string, { title: string; src: string }> = {
  flower_dance: {
    title: 'Flower Dance',
    src: 'flower_dance.mxl',
  },
  // 可以在这里添加更多乐谱
}

export const generateStaticParams = async () => {
  return Object.keys(musicSheets).map((name) => ({
    name,
  }))
}

export default async function MusicPage(props: { params: Promise<{ name: string }> }) {
  const params = await props.params
  const name = params.name

  const musicSheet = musicSheets[name]

  if (!musicSheet) {
    notFound()
  }

  return <FullscreenMusicSheet src={musicSheet.src} title={musicSheet.title} />
}

