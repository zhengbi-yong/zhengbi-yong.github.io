import { notFound } from 'next/navigation'
import FullscreenMusicSheet from '@/components/FullscreenMusicSheet'
import musicSheets from '@/data/musicData'

export const generateStaticParams = async () => {
  return musicSheets.map((music) => ({
    name: music.id,
  }))
}

export default async function MusicPage(props: { params: Promise<{ name: string }> }) {
  const params = await props.params
  const name = params.name

  const musicSheet = musicSheets.find((music) => music.id === name)

  if (!musicSheet) {
    notFound()
  }

  return (
    <FullscreenMusicSheet
      src={musicSheet.src}
      title={musicSheet.title}
      composer={musicSheet.composer}
      description={musicSheet.description}
    />
  )
}
