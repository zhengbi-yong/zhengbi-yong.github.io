// import Link from '@/components/Link'
// import Tag from '@/components/Tag'
// import siteMetadata from '@/data/siteMetadata'
// import { formatDate } from 'pliny/utils/formatDate'
// import NewsletterForm from 'pliny/ui/NewsletterForm'
import Image from 'next/image'

export default function Home({ posts }) {
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
            <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">姓名：雍征彼</p>
            <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
              邮箱：zhengbi.yong@outlook.com
            </p>
            <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
              电话：(+86) 186 0050 8939
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
          <section className="py-8">
            <h2 className="mb-4 text-2xl font-bold dark:text-gray-100">工作经历</h2>
            <div className="space-y-6">
              <div className="border-primary-500 border-l-4 pl-4">
                <h3 className="text-xl font-semibold">无</h3>
                <p className="mt-2 text-gray-500 dark:text-gray-400">……</p>
                <ul className="mt-2 list-disc pl-6 text-gray-600 dark:text-gray-300">
                  <li>……</li>
                </ul>
              </div>
              {/* 更多经历... */}
            </div>
          </section>
          {/* 技能证书模块 */}
          <section className="py-8">
            <h2 className="mb-4 text-2xl font-bold dark:text-gray-100">研究领域</h2>
            <div className="flex flex-wrap gap-3">
              {[
                'React',
                'Node.js',
                'TypeScript',
                'Docker',
                'Python',
                'c++',
                'c',
                'Rust',
                'Java',
                'Robotics',
                'AI',
                'VLA',
              ].map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-gray-100 px-4 py-2 text-sm dark:bg-gray-800"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
          {/* 项目案例模块 */}
          <section className="py-8">
            <h2 className="mb-4 text-2xl font-bold dark:text-gray-100">项目成果</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <h3 className="text-lg font-semibold">LEAP Hand</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-300">……</p>
              </div>
              {/* 更多项目... */}
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
