interface Project {
  title: string;
  description: string;
  href?: string;
  imgSrc?: string;
}

const projectsData: Project[] = [
  {
    title: '基于 LeRobot 和 LEAP Hand 的双臂灵巧操纵系统',
    description: `基于开源项目。`,
    imgSrc: '/robotics/SO-100.webp',
    href: '/blog/robotics/dexmani',
  },
  {
    title: '论文阅读',
    description: `阅读并整理最新的论文。`,
    imgSrc: '/static/images/units.jpg',
    href: '/blog/robotics/dexmani',
  },
];

export default projectsData;
