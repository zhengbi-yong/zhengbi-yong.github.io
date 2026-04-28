import {
  LayoutDashboard,
  Users,
  MessageSquare,
  FileText,
  BarChart3,
  Activity,
  Settings,
  Command,
} from 'lucide-react'
import { type SidebarData } from './types'

export const sidebarData: SidebarData = {
  user: {
    name: '管理员',
    email: 'zhengbi.yong@outlook.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Zhengbi Blog Admin',
      logo: Command,
      plan: '管理后台',
    },
  ],
  navGroups: [
    {
      title: '主要',
      items: [
        {
          title: '仪表板',
          url: '/admin',
          icon: LayoutDashboard,
        },
        {
          title: '文章管理',
          url: '/admin/posts',
          icon: FileText,
        },
        {
          title: '用户管理',
          url: '/admin/users',
          icon: Users,
        },
        {
          title: '评论审核',
          url: '/admin/comments',
          icon: MessageSquare,
        },
      ],
    },
    {
      title: '系统',
      items: [
        {
          title: '数据分析',
          url: '/admin/analytics',
          icon: BarChart3,
        },
        {
          title: '系统监控',
          url: '/admin/monitoring',
          icon: Activity,
        },
        {
          title: '系统设置',
          icon: Settings,
          items: [
            {
              title: '基本设置',
              url: '/admin/settings',
            },
            {
              title: '主题设置',
              url: '/admin/settings/appearance',
            },
          ],
        },
      ],
    },
  ],
}
