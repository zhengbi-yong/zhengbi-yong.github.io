'use client'

import Image from '@/components/Image'
import socialData, { type SocialItem } from '@/data/socialData'
import { useMemo } from 'react'

interface SocialCardProps {
  displaySocialIds?: number[]
}

/**
 * SocialCard - 社交媒体卡片组件（堆叠效果）
 * 参考 Astro 项目的 SocialCard 组件
 * 桌面端：卡片堆叠，悬停时展开
 * 移动端：正常排列
 */
export default function SocialCard({ displaySocialIds = [] }: SocialCardProps) {
  // 过滤社交媒体数据
  const filteredSocial = useMemo(() => {
    return socialData.filter((item) => {
      if (item.isShow === false) return false
      if (displaySocialIds.length > 0) {
        return displaySocialIds.includes(item.id)
      }
      return true
    })
  }, [displaySocialIds])

  return (
    <div className="relative w-full">
      <div className="social-cards-wrapper">
        <div className="social-list">
          {filteredSocial.map((item, index) => (
            <SocialCardItem
              key={item.id}
              item={item}
              index={index}
              total={filteredSocial.length}
            />
          ))}
        </div>
      </div>
      <style jsx global>{`
        .social-cards-wrapper {
          position: relative;
          width: 100%;
        }

        .social-list {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          height: 70px;
        }

        @media (max-width: 768px) {
          .social-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            height: auto;
            justify-content: center;
          }
        }

        @media (min-width: 769px) {
          .social-item {
            position: absolute;
            left: 0;
            transform: translateX(calc(var(--index) * 3px)) rotate(calc(var(--index) * 5deg));
            z-index: calc(var(--total) - var(--index));
            transition: transform 0.6s cubic-bezier(0.34, 1.2, 0.64, 1),
                        z-index 0s linear 0.6s,
                        box-shadow 0.3s ease;
            transition-delay: calc(var(--index) * 0.03s);
          }

          .social-list:hover .social-item {
            transform: translateX(calc(var(--index) * 85px)) rotate(0deg);
            z-index: calc(var(--index) + 100);
            transition: transform 0.6s cubic-bezier(0.34, 1.2, 0.64, 1),
                        z-index 0s linear 0s,
                        box-shadow 0.3s ease;
            transition-delay: calc(var(--index) * 0.03s);
          }

          .social-list:hover .social-item:hover {
            transform: translateX(calc(var(--index) * 80px)) translateY(-10px) rotate(-6deg) scale(1.05);
            z-index: 9999;
            transition: transform 0.35s cubic-bezier(0.34, 1.5, 0.64, 1),
                        z-index 0s linear 0s,
                        box-shadow 0.3s ease;
          }
        }

        @media (max-width: 768px) {
          .social-item {
            position: relative;
            transform: none;
            transition-delay: 0s;
          }
        }
      `}</style>
    </div>
  )
}

interface SocialCardItemProps {
  item: SocialItem
  index: number
  total: number
}

function SocialCardItem({ item, index, total }: SocialCardItemProps) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="social-item relative overflow-hidden rounded-xl cursor-pointer w-[72px] h-[72px] transition-all duration-300 hover:shadow-[0_15px_32px_rgba(0,0,0,0.15),0_5px_12px_rgba(0,0,0,0.1)] active:scale-95 md:active:scale-100"
      style={{
        ['--index' as any]: index,
        ['--total' as any]: total,
      }}
    >
      <Image
        src={item.image}
        alt={item.name}
        width={72}
        height={72}
        sizes="72px"
        className="object-cover rounded-xl transition-transform duration-[400ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-[1.15]"
      />
      <div className="absolute bottom-[6px] left-[6px] z-10 transition-opacity duration-300">
        <div className="text-[8px] text-white/85 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
          @{item.username}
        </div>
      </div>
    </a>
  )
}
