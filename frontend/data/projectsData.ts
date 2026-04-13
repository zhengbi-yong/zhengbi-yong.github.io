interface Project {
  title: string
  description: string
  href?: string
  imgSrc?: string
  category?: string
  year?: string
}

const projectsData: Project[] = [
  {
    title: '基于 LeRobot 和 LEAP Hand 的双臂灵巧操纵系统',
    description: '基于开源机器人平台 LeRobot 与 LEAP Hand 灵巧手，构建双臂协同操纵系统，实现复杂物体的精准抓取与操作。',
    imgSrc: '/robotics/SO-100.webp',
    href: '/blog/robotics/dexmani',
    category: 'Robotics',
    year: '2025',
  },
  {
    title: '论文阅读笔记',
    description: '系统性地阅读、整理并记录机器人学与多模态感知领域的前沿论文，涵盖灵巧操纵、具身智能等方向。',
    imgSrc: '/units.jpg',
    href: '/blog/robotics/dexmani',
    category: 'Research',
    year: '2025',
  },
]

export default projectsData
