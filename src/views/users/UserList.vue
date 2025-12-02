<template>
  <div class="user-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
          <div class="header-actions">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索用户姓名/电话"
              style="width: 250px;"
              clearable
              @input="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
        </div>
      </template>
      
      <el-alert
        title="说明：微信登录的用户默认角色为'访客'，系统管理员可以在此修改用户角色以分配相应权限"
        type="info"
        :closable="false"
        style="margin-bottom: 20px;"
      />
      
      <el-table :data="users" v-loading="loading" stripe>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="phone" label="电话" width="130" />
        <el-table-column prop="email" label="邮箱" width="180" show-overflow-tooltip />
        <el-table-column prop="companyName" label="公司" width="150" show-overflow-tooltip />
        <el-table-column prop="department" label="部门" width="120" />
        <el-table-column prop="role" label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="getRoleType(row.role)">{{ getRoleText(row.role) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'danger'">
              {{ row.status === 'ACTIVE' ? '活跃' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="changeRole(row)">修改角色</el-button>
            <el-button link type="info" @click="viewUserDetail(row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 修改角色对话框 -->
    <el-dialog v-model="roleDialogVisible" title="修改用户角色" width="500px">
      <div style="margin-bottom: 20px;">
        <p><strong>用户：</strong>{{ selectedUser?.name }}</p>
        <p><strong>当前角色：</strong>{{ getRoleText(selectedUser?.role) }}</p>
      </div>
      <el-radio-group v-model="selectedRole">
        <el-radio label="VISITOR" style="display: block; margin-bottom: 15px; height: auto;">
          <div>
            <div style="font-weight: bold; margin-bottom: 5px;">访客</div>
            <div style="font-size: 12px; color: #999;">可以创建和查看自己的预约</div>
          </div>
        </el-radio>
        <el-radio label="LEADER" style="display: block; margin-bottom: 15px; height: auto;">
          <div>
            <div style="font-weight: bold; margin-bottom: 5px;">领导</div>
            <div style="font-size: 12px; color: #999;">可以审批预约申请</div>
          </div>
        </el-radio>
        <el-radio label="GUARD" style="display: block; margin-bottom: 15px; height: auto;">
          <div>
            <div style="font-weight: bold; margin-bottom: 5px;">门卫</div>
            <div style="font-size: 12px; color: #999;">可以扫码验证访客</div>
          </div>
        </el-radio>
        <el-radio label="ADMIN" style="display: block; margin-bottom: 15px; height: auto;">
          <div>
            <div style="font-weight: bold; margin-bottom: 5px;">系统管理员</div>
            <div style="font-size: 12px; color: #999;">拥有所有管理权限</div>
          </div>
        </el-radio>
      </el-radio-group>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="roleDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmRoleChange" :loading="updating">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import api from '@/utils/api'

const users = ref([])
const loading = ref(false)
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const roleDialogVisible = ref(false)
const selectedUser = ref(null)
const selectedRole = ref('')
const updating = ref(false)

const loadUsers = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      keyword: searchKeyword.value
    }
    const data = await api.get('/admin/users', { params })
    users.value = data.content || data
    total.value = data.total || data.length
  } catch (error) {
    console.error('加载用户列表失败', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadUsers()
}

const handleSizeChange = () => {
  loadUsers()
}

const handlePageChange = () => {
  loadUsers()
}

const changeRole = (user) => {
  selectedUser.value = user
  selectedRole.value = user.role
  roleDialogVisible.value = true
}

const confirmRoleChange = async () => {
  if (!selectedUser.value || selectedRole.value === selectedUser.value.role) {
    ElMessage.warning('请选择不同的角色')
    return
  }

  updating.value = true
  try {
    await api.put(`/admin/users/${selectedUser.value.id}/role`, { 
      role: selectedRole.value 
    })
    ElMessage.success({
      message: '角色修改成功！用户需要重新登录小程序才能获得新权限。',
      duration: 4000
    })
    roleDialogVisible.value = false
    loadUsers()
  } catch (error) {
    ElMessage.error('修改失败：' + (error.message || '未知错误'))
  } finally {
    updating.value = false
  }
}

const viewUserDetail = (user) => {
  const detail = `
姓名：${user.name || '未设置'}
电话：${user.phone || '未设置'}
邮箱：${user.email || '未设置'}
公司：${user.companyName || '未设置'}
部门：${user.department || '未设置'}
角色：${getRoleText(user.role)}
状态：${user.status === 'ACTIVE' ? '活跃' : '禁用'}
  `.trim()
  
  ElMessageBox.alert(detail, '用户详情', {
    confirmButtonText: '关闭'
  })
}

const getRoleText = (role) => {
  const map = {
    'VISITOR': '访客',
    'LEADER': '领导',
    'GUARD': '门卫',
    'ADMIN': '系统管理员'
  }
  return map[role] || role
}

const getRoleType = (role) => {
  const map = {
    'VISITOR': '',
    'LEADER': 'success',
    'GUARD': 'warning',
    'ADMIN': 'danger'
  }
  return map[role] || ''
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>