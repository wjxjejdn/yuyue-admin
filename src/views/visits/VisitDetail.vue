<template>
  <div class="visit-detail">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>预约详情</span>
          <el-button @click="$router.back()">返回</el-button>
        </div>
      </template>
      
      <el-descriptions :column="2" border v-loading="loading">
        <el-descriptions-item label="访客姓名">{{ visit.visitorName }}</el-descriptions-item>
        <el-descriptions-item label="访客电话">{{ visit.visitorPhone }}</el-descriptions-item>
        <el-descriptions-item label="访客公司">{{ visit.visitorCompany || '暂无' }}</el-descriptions-item>
        <el-descriptions-item label="同行人数">{{ visit.visitorNum }}人</el-descriptions-item>
        <el-descriptions-item label="被访人">{{ visit.contactPersonName }}</el-descriptions-item>
        <el-descriptions-item label="车牌号">{{ visit.licensePlate || '暂无' }}</el-descriptions-item>
        <el-descriptions-item label="拜访日期">{{ visit.visitDate }}</el-descriptions-item>
        <el-descriptions-item label="拜访时间">{{ visit.visitTime }}</el-descriptions-item>
        <el-descriptions-item label="预计时长">{{ visit.duration }}分钟</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(visit.status)">{{ getStatusText(visit.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="签到时间">{{ visit.checkInTime || '未签到' }}</el-descriptions-item>
        <el-descriptions-item label="签出时间">{{ visit.checkOutTime || '未签出' }}</el-descriptions-item>
        <el-descriptions-item label="拜访事由" :span="2">{{ visit.purpose || '暂无' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ visit.createTime }}</el-descriptions-item>
      </el-descriptions>
      
      <div v-if="visit.qrCodeUrl" style="margin-top: 30px; text-align: center;">
        <h3>二维码</h3>
        <img :src="visit.qrCodeUrl" alt="二维码" style="width: 300px; height: 300px;" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/utils/api'

const route = useRoute()

const visit = ref({})
const loading = ref(false)

const loadDetail = async () => {
  loading.value = true
  try {
    const data = await api.get(`/visits/${route.params.id}`)
    visit.value = data
  } catch (error) {
    console.error('加载详情失败', error)
  } finally {
    loading.value = false
  }
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
    'CANCELLED': ''
  }
  return map[status] || ''
}

onMounted(() => {
  loadDetail()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
