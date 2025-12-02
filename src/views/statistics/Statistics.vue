<template>
  <div class="statistics-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>统计管理</span>
          <div class="header-actions">
            <el-button type="primary" @click="refreshData" :loading="loading">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <!-- 核心指标 -->
      <div class="stats-overview">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-icon">📊</div>
                <div class="stat-info">
                  <div class="stat-value">{{ statistics?.totalVisits || 0 }}</div>
                  <div class="stat-label">总预约数</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-icon">⏳</div>
                <div class="stat-info">
                  <div class="stat-value">{{ statistics?.pendingApprovals || 0 }}</div>
                  <div class="stat-label">待审批</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-icon">👥</div>
                <div class="stat-info">
                  <div class="stat-value">{{ statistics?.totalUsers || 0 }}</div>
                  <div class="stat-label">总用户数</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-icon">✓</div>
                <div class="stat-info">
                  <div class="stat-value">{{ statistics?.todayCheckIns || 0 }}</div>
                  <div class="stat-label">今日签到</div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 日期查询和导出 -->
      <el-card class="query-card" style="margin-top: 20px;">
        <template #header>
          <span>预约查询与导出</span>
        </template>
        
        <el-form :inline="true" class="query-form">
          <el-form-item label="开始日期">
            <el-date-picker
              v-model="queryParams.startDate"
              type="date"
              placeholder="选择开始日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 200px"
            />
          </el-form-item>
          <el-form-item label="结束日期">
            <el-date-picker
              v-model="queryParams.endDate"
              type="date"
              placeholder="选择结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 200px"
            />
          </el-form-item>
          <el-form-item label="状态筛选">
            <el-select
              v-model="queryParams.status"
              placeholder="全部状态"
              clearable
              style="width: 150px"
            >
              <el-option label="全部" value="" />
              <el-option label="待审批" value="PENDING" />
              <el-option label="已通过" value="APPROVED" />
              <el-option label="已拒绝" value="REJECTED" />
              <el-option label="已完成" value="COMPLETED" />
              <el-option label="已取消" value="CANCELLED" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleQuery" :loading="querying">查询</el-button>
            <el-button type="success" @click="handleExport" :loading="exporting" 
                       :disabled="!queryParams.startDate || !queryParams.endDate || queryResults.length === 0">
              <el-icon><Download /></el-icon>
              导出Excel
            </el-button>
          </el-form-item>
        </el-form>

        <!-- 查询结果 -->
        <div v-if="queryResults.length > 0" style="margin-top: 20px;">
          <div class="results-header">
            <span>查询结果（共 {{ queryResults.length }} 条）</span>
          </div>
          <el-table :data="queryResults" border style="width: 100%; margin-top: 10px;">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="visitorName" label="访客姓名" width="120" />
            <el-table-column prop="visitorPhone" label="访客电话" width="130" />
            <el-table-column prop="visitorCompany" label="访客公司" width="150" />
            <el-table-column prop="visitType" label="拜访类型" width="120">
              <template #default="{ row }">
                {{ getVisitTypeText(row.visitType) }}
              </template>
            </el-table-column>
            <el-table-column prop="startDateTime" label="开始时间" width="160">
              <template #default="{ row }">
                {{ formatDateTime(row.startDateTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="endDateTime" label="结束时间" width="160">
              <template #default="{ row }">
                {{ formatDateTime(row.endDateTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="viewDetail(row.id)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <el-empty v-if="hasQueried && queryResults.length === 0" description="该日期范围内暂无预约记录" />
      </el-card>

      <!-- 状态统计 -->
      <el-card class="status-card" style="margin-top: 20px;" v-if="statistics?.statusStats && statistics.statusStats.length > 0">
        <template #header>
          <span>预约状态统计</span>
        </template>
        <div class="status-stats">
          <div v-for="stat in statistics.statusStats" :key="stat.status" class="status-item">
            <div class="status-header">
              <span class="status-name">{{ getStatusText(stat.status) }}</span>
              <span class="status-count">{{ stat.count }} 条</span>
            </div>
            <el-progress 
              :percentage="getPercentage(stat.count)" 
              :color="getStatusColor(stat.status)"
              :stroke-width="10"
            />
          </div>
        </div>
      </el-card>

      <!-- 最近预约 -->
      <el-card class="recent-card" style="margin-top: 20px;" v-if="statistics?.recentVisits && statistics.recentVisits.length > 0">
        <template #header>
          <span>最近预约</span>
        </template>
        <el-table :data="statistics.recentVisits" border>
          <el-table-column prop="visitorName" label="访客姓名" width="120" />
          <el-table-column prop="visitorPhone" label="访客电话" width="130" />
          <el-table-column prop="visitType" label="拜访类型" width="120">
            <template #default="{ row }">
              {{ getVisitTypeText(row.visitType) }}
            </template>
          </el-table-column>
          <el-table-column prop="startDateTime" label="开始时间" width="160">
            <template #default="{ row }">
              {{ formatDateTime(row.startDateTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="viewDetail(row.id)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Refresh, Download } from '@element-plus/icons-vue'
import api from '@/utils/api'

const router = useRouter()

const loading = ref(false)
const statistics = ref(null)
const queryParams = ref({
  startDate: '',
  endDate: '',
  status: ''
})
const queryResults = ref([])
const querying = ref(false)
const exporting = ref(false)
const hasQueried = ref(false)

// 初始化日期（默认最近7天）
const initDates = () => {
  const today = new Date()
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  queryParams.value.endDate = formatDate(today)
  queryParams.value.startDate = formatDate(sevenDaysAgo)
}

const formatDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

onMounted(() => {
  loadStatistics()
  initDates()
})

const loadStatistics = async () => {
  loading.value = true
  try {
    statistics.value = await api.get('/statistics')
  } catch (error) {
    ElMessage.error('加载统计数据失败：' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

const refreshData = () => {
  loadStatistics()
  if (hasQueried.value) {
    handleQuery()
  }
}

const handleQuery = async () => {
  if (!queryParams.value.startDate || !queryParams.value.endDate) {
    ElMessage.warning('请选择日期范围')
    return
  }

  if (queryParams.value.startDate > queryParams.value.endDate) {
    ElMessage.warning('开始日期不能晚于结束日期')
    return
  }

  querying.value = true
  try {
    let url = `/statistics/visits?startDate=${queryParams.value.startDate}&endDate=${queryParams.value.endDate}`
    if (queryParams.value.status) {
      url += `&status=${queryParams.value.status}`
    }
    queryResults.value = await api.get(url)
    hasQueried.value = true
    if (queryResults.value.length === 0) {
      ElMessage.info('该日期范围内暂无预约记录')
    }
  } catch (error) {
    ElMessage.error('查询失败：' + (error.message || '未知错误'))
  } finally {
    querying.value = false
  }
}

const handleExport = async () => {
  if (!queryParams.value.startDate || !queryParams.value.endDate) {
    ElMessage.warning('请选择日期范围')
    return
  }

  if (queryResults.value.length === 0) {
    ElMessage.warning('请先查询数据')
    return
  }

  exporting.value = true
  try {
    const token = localStorage.getItem('admin_token')
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 
      (import.meta.env.PROD ? 'http://38.165.34.34:8080/api' : '/api')
    let url = `${baseUrl}/statistics/export?startDate=${queryParams.value.startDate}&endDate=${queryParams.value.endDate}`
    if (queryParams.value.status) {
      url += `&status=${queryParams.value.status}`
    }
    
    // 使用fetch下载文件
    const response = await fetch(url, {
      headers: {
        'token': token || ''
      }
    })
    
    if (response.ok) {
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      const statusText = queryParams.value.status ? `_${getStatusText(queryParams.value.status)}` : ''
      link.download = `预约数据_${queryParams.value.startDate}_${queryParams.value.endDate}${statusText}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
      ElMessage.success('导出成功')
    } else {
      const errorText = await response.text()
      throw new Error(errorText || '导出失败')
    }
  } catch (error) {
    ElMessage.error('导出失败：' + (error.message || '未知错误'))
  } finally {
    exporting.value = false
  }
}

const viewDetail = (id) => {
  router.push(`/visits/${id}`)
}

const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return ''
  const str = dateTimeStr.replace('T', ' ').replace(/:\d{2}$/, '')
  if (str.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)) {
    return str
  }
  const date = new Date(dateTimeStr)
  if (isNaN(date.getTime())) return dateTimeStr
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

const getStatusText = (status) => {
  const map = {
    'PENDING': '待审批',
    'APPROVED': '已通过',
    'REJECTED': '已拒绝',
    'COMPLETED': '已完成',
    'CANCELLED': '已取消'
  }
  return map[status] || status
}

const getStatusType = (status) => {
  const map = {
    'PENDING': 'warning',
    'APPROVED': 'success',
    'REJECTED': 'danger',
    'COMPLETED': 'info',
    'CANCELLED': 'info'
  }
  return map[status] || ''
}

const getVisitTypeText = (visitType) => {
  const map = {
    'BUSINESS': '商务拜访',
    'TECHNICAL': '技术交流',
    'MEETING': '会议',
    'INTERVIEW': '面试',
    'OTHER': '其他'
  }
  return map[visitType] || visitType
}

const getPercentage = (count) => {
  if (!statistics.value || !statistics.value.totalVisits || statistics.value.totalVisits === 0) {
    return 0
  }
  return Math.round((count / statistics.value.totalVisits) * 100)
}

const getStatusColor = (status) => {
  const map = {
    'PENDING': '#409EFF',
    'APPROVED': '#67C23A',
    'REJECTED': '#F56C6C',
    'COMPLETED': '#909399',
    'CANCELLED': '#909399'
  }
  return map[status] || '#409EFF'
}
</script>

<style scoped>
.statistics-container {
  padding: 0;
}

.stats-overview {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.stat-icon {
  font-size: 48px;
}

.stat-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.stat-value {
  font-size: 36px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.query-card {
  margin-top: 20px;
}

.query-form {
  margin-bottom: 0;
}

.results-header {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}

.status-stats {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.status-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.status-count {
  font-size: 14px;
  color: #909399;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}
</style>

