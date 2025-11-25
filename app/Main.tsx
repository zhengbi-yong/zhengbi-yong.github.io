// import Link from '@/components/Link'
// import Tag from '@/components/Tag'
// import siteMetadata from '@/data/siteMetadata'
// import { formatDate } from 'pliny/utils/formatDate'
// import NewsletterForm from 'pliny/ui/NewsletterForm'
import Image from 'next/image'
// import BackgroundCanvas from '@/components/BackgroundCanvas'
import type { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'

interface HomeProps {
  posts: CoreContent<Blog>[]
}

export default function Home({ posts }: HomeProps) {
  return (
    <>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="space-y-2 pt-6 pb-8 md:space-y-5">
          {/* 新增头像模块 */}
          <div className="mb-8 flex justify-center">
            <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-gray-200 dark:border-gray-700">
              {/* <img
                src="/static/images/avatar.jpg" // 替换为实际路径
                alt="avatar"
                className="h-full w-full object-cover"
              /> */}
              <Image src="/static/images/avatar.jpg" alt="avatar" width={128} height={128} />
            </div>
          </div>
          {/* 基本信息模块 */}
          <section className="py-8">
            <h2 className="mb-4 text-2xl font-bold dark:text-gray-100">基本信息</h2>
            <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
              姓名：雍征彼（Zhengbi Yong)
            </p>
            <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
              邮箱：zhengbi.yong@outlook.com
            </p>
            <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
              电话：(+86) 186 0050 8939
            </p>
            <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
              地址：中国北京市海淀区
            </p>
          </section>
          {/* 教育经历模块 */}
          <section className="py-8">
            <h2 className="mb-4 text-2xl font-bold dark:text-gray-100">教育经历</h2>
            <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
              本科：清华大学自动化系（TsingHua University，Department of Automation）
            </p>
            <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
              硕士：北京理工大学自动化学院（Beijing Institute of Technology，School of
              Automation）导师：史大威（David Shi）
            </p>
          </section>
          {/* 工作经历模块 */}
          {/* 技能证书模块 */}
          {/* 项目案例模块 */}
        </div>
      </div>
    </>
  )
}
