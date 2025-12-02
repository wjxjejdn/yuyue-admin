<template>
  <div class="checkin-list">
    <el-card>
      <template #header>
        <span>门禁记录</span>
      </template>
      
      <el-table :data="checkins" v-loading="loading" stripe>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="visit.visitorName" label="访客" width="120" />
        <el-table-column prop="visit.contactPersonName" label="被访人" width="120" />
        <el-table-column prop="guard.name" label="门卫" width="120" />
        <el-table-column prop="checkStatus" label="验证状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.checkStatus)">
              {{ getStatusText(row.checkStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" />
        <el-table-column prop="scanTime" label="扫码时间" width="180" />
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/utils/api'

const checkins = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const loadCheckIns = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value
    }
    const data = await api.get('/admin/checkins', { params })
    checkins.value = data.content || data
    total.value = data.total || data.length
  } catch (error) {
    console.error('加载门禁记录失败', error)
  } finally {
    loading.value = false
  }
}

const handleSizeChange = () => {
  loadCheckIns()
}

const handlePageChange = () => {
  loadCheckIns()
}

const getStatusText = (status) => {
  const map = {
    'SUCCESS': '成功',
    'FAILED': '失败',
    'EXPIRED': '过期',
    'INVALID': '无效'
  }
  return map[status] || status
}

const getStatusType = (status) => {
  const map = {
    'SUCCESS': 'success',
    'FAILED': 'danger',
    'EXPIRED': 'warning',
    'INVALID': 'info'
  }
  return map[status] || ''
}

onMounted(() => {
  loadCheckIns()
})
</script>

<style scoped>
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
