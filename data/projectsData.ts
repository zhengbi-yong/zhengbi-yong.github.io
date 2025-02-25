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
    imgSrc: '/static/images/shadowhand.png',
    href: '/blog/robotics/dexmani',
  },
  {
    title: 'PPG',
    description: `Use PPG signal to detect heart rate and blood pressure, etc.`,
    imgSrc: '/static/images/units.jpg',
    href: '/blog/the-time-machine',
  },
];

export default projectsData;
