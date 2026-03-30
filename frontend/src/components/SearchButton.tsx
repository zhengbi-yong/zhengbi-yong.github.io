import Link from '@/components/Link'
import { Search } from 'lucide-react'

const SearchButton = () => {
  return (
    <Link
      href="/search"
      aria-label="搜索"
      className="inline-flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity duration-300"
    >
      <Search className="w-5 h-5 text-[#c6c7c6]" />
    </Link>
  )
}

export default SearchButton