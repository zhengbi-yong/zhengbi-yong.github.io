import Image from './Image'
import Link from './Link'

interface CardProps {
  title: string
  description: string
  imgSrc?: string
  href?: string
}

const Card = ({ title, description, imgSrc, href }: CardProps) => (
  <div className="group h-full">
    <div
      className={`${
        imgSrc && 'h-full'
      } hover:border-primary-300/50 dark:hover:border-primary-600/50 overflow-hidden rounded-2xl border border-gray-200/50 bg-white/60 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-gray-200/50 dark:border-gray-700/50 dark:bg-gray-900/60 dark:hover:shadow-gray-900/50`}
    >
      {imgSrc && (
        <div className="relative overflow-hidden">
          {href ? (
            <Link href={href} aria-label={`Link to ${title}`} className="block">
              <Image
                alt={title}
                src={imgSrc}
                className="h-48 w-full object-cover object-center transition-transform duration-300 group-hover:scale-105 md:h-56 lg:h-64"
                width={544}
                height={306}
              />
            </Link>
          ) : (
            <Image
              alt={title}
              src={imgSrc}
              className="h-48 w-full object-cover object-center transition-transform duration-300 group-hover:scale-105 md:h-56 lg:h-64"
              width={544}
              height={306}
            />
          )}
        </div>
      )}
      <div className="p-6">
        <h2 className="mb-3 text-2xl leading-8 font-bold tracking-tight text-gray-900 dark:text-gray-100">
          {href ? (
            <Link
              href={href}
              aria-label={`Link to ${title}`}
              className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
            >
              {title}
            </Link>
          ) : (
            title
          )}
        </h2>
        <p className="prose mb-4 max-w-none leading-relaxed text-gray-600 dark:text-gray-300">
          {description}
        </p>
        {href && (
          <Link
            href={href}
            className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 group/link inline-flex items-center gap-2 text-base leading-6 font-medium transition-all duration-200"
            aria-label={`Link to ${title}`}
          >
            <span className="relative">
              了解更多
              <span className="bg-primary-500 dark:bg-primary-400 absolute bottom-0 left-0 h-[1px] w-0 transition-all duration-300 group-hover/link:w-full"></span>
            </span>
            <span className="transition-transform duration-300 group-hover/link:translate-x-1">
              →
            </span>
          </Link>
        )}
      </div>
    </div>
  </div>
)

export default Card
