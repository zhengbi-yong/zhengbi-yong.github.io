interface Project {
  title: string;
  description: string;
  href?: string;
  imgSrc?: string;
}

const projectsData: Project[] = [
  {
    title: 'LEAP Hand',
    description: `Dexterous manipulation base on LEAP Hand.`,
    imgSrc: '/static/images/shadowhand.png',
    href: 'https://www.google.com',
  },
  {
    title: 'PPG',
    description: `Use PPG signal to detect heart rate and blood pressure, etc.`,
    imgSrc: '/static/images/units.jpg',
    href: '/blog/the-time-machine',
  },
];

export default projectsData;
