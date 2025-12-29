// @ts-nocheck
/**
 * Admin Hooks - 基于 React Query 的管理后台数据管理
 * 参考 Refine 的设计理念，但使用自定义实现以保持完全控制
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminService } from '@/lib/api/backend'
import type {
  AdminStats,
  UserListResponse,
  UserListItem,
  CommentAdminListResponse,
  CommentAdminItem,
  UpdateUserRoleRequest,
  UpdateCommentStatusRequest,
} from '@/lib/types/backend'

// ==================== Admin Stats ====================

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminService.getStats(),
    staleTime: 30000, // 30秒内不重新获取
    refetchInterval: 60000, // 每60秒自动刷新
  })
}

// ==================== Users ====================

export function useUsers(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['admin', 'users', page, pageSize],
    queryFn: () => adminService.getUsers(page, pageSize),
    keepPreviousData: true,
  })
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateUserRoleRequest }) =>
      adminService.updateUserRole(userId, data),
    onSuccess: () => {
      // 使所有用户列表查询失效，触发重新获取
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => adminService.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

export function useBatchUpdateUserRoles() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      userIds,
      role,
    }: {
      userIds: string[]
      role: string
    }) => {
      // 并行更新所有用户角色
      await Promise.all(
        userIds.map((userId) => adminService.updateUserRole(userId, { role }))
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

export function useBatchDeleteUsers() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userIds: string[]) => {
      await Promise.all(userIds.map((userId) => adminService.deleteUser(userId)))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

// ==================== Comments ====================

export function useComments(page = 1, pageSize = 20, status?: string) {
  return useQuery({
    queryKey: ['admin', 'comments', page, pageSize, status],
    queryFn: () => adminService.getComments(page, pageSize, status),
    keepPreviousData: true,
  })
}

export function useUpdateCommentStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      commentId,
      data,
    }: {
      commentId: string
      data: UpdateCommentStatusRequest
    }) => adminService.updateCommentStatus(commentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'comments'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

export function useDeleteComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (commentId: string) => adminService.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'comments'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

export function useBatchUpdateCommentStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      commentIds,
      status,
    }: {
      commentIds: string[]
      status: string
    }) => {
      await Promise.all(
        commentIds.map((commentId) =>
          adminService.updateCommentStatus(commentId, { status })
        )
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'comments'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

export function useBatchDeleteComments() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (commentIds: string[]) => {
      await Promise.all(commentIds.map((commentId) => adminService.deleteComment(commentId)))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'comments'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

