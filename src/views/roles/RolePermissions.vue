<template>
  <div class="role-permissions">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>配置角色权限 - {{ roleName }}</span>
          <el-button @click="$router.back()">返回</el-button>
        </div>
      </template>
      
      <el-alert
        :title="`当前角色：${roleName}（${role}）`"
        type="info"
        :closable="false"
        style="margin-bottom: 20px;"
      />
      
      <!-- 顶部操作栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-button type="primary" @click="selectAll">
            <el-icon><Check /></el-icon>
            全选
          </el-button>
          <el-button @click="clearAll">
            <el-icon><Close /></el-icon>
            取消全选
          </el-button>
          <span class="selected-count">
            已选择 {{ selectedPermissions.length }} / {{ totalPermissions }} 个权限
          </span>
        </div>
        <div class="toolbar-right">
          <el-button type="success" @click="savePermissions" :loading="saving">
            <el-icon><Document /></el-icon>
            保存权限配置
          </el-button>
        </div>
      </div>
      
      <!-- 权限树状结构 -->
      <div class="permission-tree" v-loading="loading">
        <div 
          v-for="group in groupedPermissions" 
          :key="group.resource" 
          class="permission-module"
        >
          <!-- 模块标题 -->
          <div 
            class="module-header" 
            @click="toggleModule(group.resource)"
          >
            <div class="module-header-left">
              <el-icon class="expand-icon" :class="{ expanded: expandedModules[group.resource] }">
                <ArrowRight />
              </el-icon>
              <span class="module-title">{{ getResourceName(group.resource) }}</span>
              <el-checkbox
                :model-value="isModuleAllSelected(group)"
                :indeterminate="isModuleIndeterminate(group)"
                @click.stop
                @change="toggleModuleSelection(group)"
                class="module-checkbox"
              >
                全选模块
              </el-checkbox>
            </div>
            <div class="module-header-right">
              <span class="module-count">
                {{ getSelectedCount(group) }} / {{ group.permissions.length }}
              </span>
            </div>
          </div>
          
          <!-- 模块权限列表（可折叠） -->
          <el-collapse-transition>
            <div v-show="expandedModules[group.resource]" class="module-content">
              <el-row :gutter="20">
                <el-col 
                  :span="12" 
                  v-for="permission in group.permissions" 
                  :key="permission.id"
                  class="permission-item-col"
                >
                  <div class="permission-item">
                    <el-checkbox 
                      :label="permission.id" 
                      v-model="selectedPermissions"
                    >
                      <div class="permission-info">
                        <div class="permission-name-row">
                          <span class="permission-name">{{ permission.name }}</span>
                          <el-tooltip 
                            :content="permission.description || '无详细说明'"
                            placement="top"
                            effect="dark"
                          >
                            <el-icon class="info-icon">
                              <InfoFilled />
                            </el-icon>
                          </el-tooltip>
                        </div>
                        <div class="permission-desc">
                          {{ permission.description || '无描述' }}
                        </div>
                        <div class="permission-tags">
                          <el-tag size="small" type="info">
                            {{ getResourceNameCN(permission.resource) }}
                          </el-tag>
                          <el-tag size="small" type="success">
                            {{ getActionNameCN(permission.action) }}
                          </el-tag>
                        </div>
                      </div>
                    </el-checkbox>
                  </div>
                </el-col>
              </el-row>
            </div>
          </el-collapse-transition>
        </div>
      </div>
      
      <!-- 底部操作栏 -->
      <div class="action-buttons">
        <el-button @click="$router.back()">取消</el-button>
        <el-button type="primary" :loading="saving" @click="savePermissions" size="large">
          <el-icon><Document /></el-icon>
          保存配置
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Check, Close, Document, ArrowRight, InfoFilled } from '@element-plus/icons-vue'
import api from '@/utils/api'

const route = useRoute()
const router = useRouter()

const role = ref(route.params.role)
const roleName = ref('')
const permissions = ref([])
const selectedPermissions = ref([])
const loading = ref(false)
const saving = ref(false)

// 模块展开/折叠状态
const expandedModules = reactive({})

const loadPermissions = async () => {
  loading.value = true
  try {
    const [allPerms, rolePerms] = await Promise.all([
      api.get('/admin/roles/permissions'),
      api.get(`/admin/roles/${role.value}/permissions`)
    ])
    
    permissions.value = allPerms
    selectedPermissions.value = rolePerms
        .filter(p => p.assigned)
        .map(p => p.id)
    
    // 设置角色名称
    const roleNames = {
      'VISITOR': '访客',
      'LEADER': '领导',
      'GUARD': '门卫',
      'ADMIN': '系统管理员'
    }
    roleName.value = roleNames[role.value.toUpperCase()] || role.value
    
    // 默认展开所有模块
    groupedPermissions.value.forEach(group => {
      expandedModules[group.resource] = true
    })
  } catch (error) {
    ElMessage.error('加载权限失败：' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

const groupedPermissions = computed(() => {
  const groups = {}
  permissions.value.forEach(perm => {
    if (!groups[perm.resource]) {
      groups[perm.resource] = { resource: perm.resource, permissions: [] }
    }
    groups[perm.resource].permissions.push(perm)
  })
  return Object.values(groups)
})

const totalPermissions = computed(() => {
  return permissions.value.length
})

// 切换模块展开/折叠
const toggleModule = (resource) => {
  expandedModules[resource] = !expandedModules[resource]
}

// 检查模块是否全选
const isModuleAllSelected = (group) => {
  return group.permissions.every(p => selectedPermissions.value.includes(p.id))
}

// 检查模块是否为半选状态
const isModuleIndeterminate = (group) => {
  const selectedCount = group.permissions.filter(p => selectedPermissions.value.includes(p.id)).length
  return selectedCount > 0 && selectedCount < group.permissions.length
}

// 获取模块已选数量
const getSelectedCount = (group) => {
  return group.permissions.filter(p => selectedPermissions.value.includes(p.id)).length
}

// 切换模块全选/取消
const toggleModuleSelection = (group) => {
  const allSelected = isModuleAllSelected(group)
  if (allSelected) {
    // 取消选中该模块所有权限
    group.permissions.forEach(p => {
      const index = selectedPermissions.value.indexOf(p.id)
      if (index > -1) {
        selectedPermissions.value.splice(index, 1)
      }
    })
  } else {
    // 选中该模块所有权限
    group.permissions.forEach(p => {
      if (!selectedPermissions.value.includes(p.id)) {
        selectedPermissions.value.push(p.id)
      }
    })
  }
}

const selectAll = () => {
  selectedPermissions.value = permissions.value.map(p => p.id)
  ElMessage.success('已全选所有权限')
}

const clearAll = () => {
  selectedPermissions.value = []
  ElMessage.info('已清空所有权限')
}

const getResourceName = (resource) => {
  const names = {
    'visit': '预约管理',
    'approval': '审批管理',
    'user': '用户管理',
    'guard': '门卫管理',
    'admin': '系统管理',
    'statistics': '统计管理',
    'role': '角色管理',
    'permission': '权限管理'
  }
  return names[resource] || resource
}

const getResourceNameCN = (resource) => {
  return getResourceName(resource)
}

const getActionNameCN = (action) => {
  const names = {
    'view': '查看',
    'view_all': '查看全部',
    'create': '创建',
    'update': '更新',
    'delete': '删除',
    'approve': '审批',
    'scan': '扫码',
    'role': '角色',
    'manage': '管理',
    'statistics': '统计'
  }
  return names[action] || action
}

const savePermissions = async () => {
  saving.value = true
  try {
    await api.put(`/admin/roles/${role.value}/permissions`, {
      permissionIds: selectedPermissions.value
    })
    ElMessage.success({
      message: '权限配置保存成功！',
      duration: 2000
    })
    setTimeout(() => {
      router.back()
    }, 1500)
  } catch (error) {
    ElMessage.error('保存失败：' + (error.message || '未知错误'))
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadPermissions()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 20px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.toolbar-right {
  display: flex;
  align-items: center;
}

.selected-count {
  color: #606266;
  font-size: 14px;
}

.permission-tree {
  max-height: 600px;
  overflow-y: auto;
  padding: 10px;
}

.permission-module {
  margin-bottom: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  transition: all 0.3s;
}

.permission-module:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.module-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  cursor: pointer;
  user-select: none;
  transition: all 0.3s;
}

.module-header:hover {
  background: linear-gradient(135deg, #5568d3 0%, #654391 100%);
}

.module-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.expand-icon {
  transition: transform 0.3s;
  font-size: 16px;
}

.expand-icon.expanded {
  transform: rotate(90deg);
}

.module-title {
  font-weight: bold;
  font-size: 16px;
  flex: 1;
}

.module-checkbox {
  color: #fff;
}

.module-checkbox :deep(.el-checkbox__label) {
  color: #fff;
}

.module-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.module-count {
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 13px;
}

.module-content {
  padding: 20px;
  background: #fafafa;
  overflow: hidden;
}

.module-content .el-row {
  margin: 0;
}

.module-content .el-col {
  padding-left: 0;
  padding-right: 10px;
  margin-bottom: 15px;
}

.permission-item-col {
  margin-bottom: 15px;
  min-width: 0;
  overflow: hidden;
}

.permission-item {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 15px;
  transition: all 0.2s;
  overflow: hidden;
  word-wrap: break-word;
  word-break: break-word;
}

.permission-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.permission-item :deep(.el-checkbox) {
  width: 100%;
  align-items: flex-start;
}

.permission-item :deep(.el-checkbox__label) {
  width: 100%;
  padding-left: 8px;
  white-space: normal;
  word-wrap: break-word;
}

.permission-info {
  width: 100%;
  padding-left: 8px;
  box-sizing: border-box;
  overflow: hidden;
}

.permission-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.permission-name {
  font-weight: bold;
  font-size: 15px;
  color: #303133;
  word-break: break-word;
  flex: 1;
  min-width: 0;
}

.info-icon {
  color: #909399;
  cursor: pointer;
  font-size: 14px;
  flex-shrink: 0;
}

.info-icon:hover {
  color: #409eff;
}

.permission-desc {
  font-size: 13px;
  color: #606266;
  margin-bottom: 10px;
  line-height: 1.5;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
}

.permission-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-buttons {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 2px solid #ebeef5;
  display: flex;
  justify-content: flex-end;
  gap: 15px;
}

/* 滚动条美化 */
.permission-tree::-webkit-scrollbar {
  width: 8px;
}

.permission-tree::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.permission-tree::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.permission-tree::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>