import Link from 'next/link'
import { slug } from 'github-slugger'
import { Badge } from '@/components/shadcn/ui/badge'

interface TagProps {
  text: string
}

export default function Tag({ text }: TagProps) {
  return (
    <Link href={`/tags/${slug(text)}`}>
      <Badge variant="secondary" className="mr-3 cursor-pointer hover:bg-primary/80 uppercase">
        {text.split(' ').join('-')}
      </Badge>
    </Link>
  )
}
