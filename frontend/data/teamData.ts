interface TeamMember {
  id: string
  name: string
  nameEn?: string
  role: string
  title?: string
  avatar?: string
  bio: string
  email?: string
  github?: string
  website?: string
  affiliation?: string
  research?: string[]
}

const teamMembers: TeamMember[] = [
  {
    id: 'shi-dawei',
    name: '石大发',
    nameEn: 'Dawei Shi',
    role: 'Advisor',
    title: '教授，博士生导师',
    bio: '北京理工大学教授，从事机器人学、多模态感知与智能系统研究，主持多项国家级科研项目，指导研究生在灵巧操纵与具身智能领域取得突破性进展。',
    affiliation: '北京理工大学',
    research: ['机器人学', '多模态感知', '智能系统'],
    email: 'shi.dawei@bit.edu.cn',
  },
  {
    id: 'zhengbi-yong',
    name: '雍征彼',
    nameEn: 'Zhengbi Yong',
    role: 'Lead',
    title: '硕士研究生',
    avatar: '/static/images/avatar.jpg',
    bio: '北京理工大学硕士研究生，研究方向为机器人灵巧操纵与具身智能。负责双臂协同操纵系统开发，同时进行论文阅读与学术写作。',
    affiliation: '北京理工大学',
    research: ['灵巧操纵', '具身智能', '多模态感知'],
    github: 'zhengbi-yong',
    email: 'zhengbi.yong@outlook.com',
    website: 'https://zhengbi-yong.github.io',
  },
  {
    id: 'wang-le',
    name: '王乐',
    nameEn: 'Le Wang',
    role: 'Member',
    title: '博士研究生',
    bio: '研究方向为机器人视觉感知与场景理解，专注于复杂环境下的三维目标检测与位姿估计。',
    affiliation: '北京理工大学',
    research: ['计算机视觉', '三维目标检测', '场景理解'],
  },
  {
    id: 'li-hao',
    name: '李浩',
    nameEn: 'Hao Li',
    role: 'Member',
    title: '硕士研究生',
    bio: '研究方向为强化学习与机器人控制，致力于将深度强化学习应用于灵巧手的复杂操纵任务。',
    affiliation: '北京理工大学',
    research: ['强化学习', '机器人控制', '深度学习'],
  },
]

export default teamMembers
