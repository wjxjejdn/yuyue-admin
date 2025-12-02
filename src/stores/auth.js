import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/utils/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('admin_token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('admin_user') || 'null'))

  const isAuthenticated = ref(!!token.value)

  const login = async (username, password) => {
    try {
      const response = await api.post('/admin/login', { username, password })
      token.value = response.token
      userInfo.value = response.user
      isAuthenticated.value = true
      localStorage.setItem('admin_token', response.token)
      localStorage.setItem('admin_user', JSON.stringify(response.user))
      return { success: true }
    } catch (error) {
      return { success: false, message: error.message || '登录失败' }
    }
  }

  const logout = () => {
    token.value = ''
    userInfo.value = null
    isAuthenticated.value = false
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
  }

  return {
    token,
    userInfo,
    isAuthenticated,
    login,
    logout
  }
})
