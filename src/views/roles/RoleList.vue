<template>
  <div class="role-list">
    <el-card>
      <template #header>
        <span>角色管理</span>
      </template>
      
      <el-table :data="roles" v-loading="loading" stripe>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="role" label="角色代码" width="150" />
        <el-table-column prop="roleName" label="角色名称" width="150" />
        <el-table-column label="权限数量" width="120">
          <template #default="{ row }">
            <el-tag type="info">{{ row.permissionIds ? row.permissionIds.length : 0 }} 个权限</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="permissions" label="权限列表">
          <template #default="{ row }">
            <el-tag
              v-for="perm in row.permissions.slice(0, 5)"
              :key="perm.id"
              size="small"
              style="margin-right: 5px; margin-bottom: 5px;"
            >
              {{ perm.name }}
            </el-tag>
            <el-tag v-if="row.permissions.length > 5" size="small" type="info">
              +{{ row.permissions.length - 5 }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="editPermissions(row)">配置权限</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/utils/api'

const router = useRouter()

const roles = ref([])
const loading = ref(false)

const loadRoles = async () => {
  loading.value = true
  try {
    const data = await api.get('/admin/roles')
    roles.value = data
  } catch (error) {
    console.error('加载角色列表失败', error)
  } finally {
    loading.value = false
  }
}

const editPermissions = (role) => {
  router.push(`/roles/${role.role}/permissions`)
}

onMounted(() => {
  loadRoles()
})
</script>

<style scoped>
.role-list {
  padding: 0;
}
</style>
