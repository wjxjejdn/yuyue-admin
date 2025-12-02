<template>
  <div class="approval-list">
    <el-card>
      <template #header>
        <span>审批记录</span>
      </template>
      
      <el-table :data="approvals" v-loading="loading" stripe>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="visit.visitorName" label="访客" width="120" />
        <el-table-column prop="visit.contactPersonName" label="被访人" width="120" />
        <el-table-column prop="approverName" label="审批人" width="120" />
        <el-table-column prop="approvalStatus" label="审批结果" width="100">
          <template #default="{ row }">
            <el-tag :type="row.approvalStatus === 'APPROVED' ? 'success' : 'danger'">
              {{ row.approvalStatus === 'APPROVED' ? '通过' : '拒绝' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="approvalComment" label="审批意见" />
        <el-table-column prop="approvalTime" label="审批时间" width="180" />
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

const approvals = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const loadApprovals = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value
    }
    const data = await api.get('/admin/approvals', { params })
    approvals.value = data.content || data
    total.value = data.total || data.length
  } catch (error) {
    console.error('加载审批记录失败', error)
  } finally {
    loading.value = false
  }
}

const handleSizeChange = () => {
  loadApprovals()
}

const handlePageChange = () => {
  loadApprovals()
}

onMounted(() => {
  loadApprovals()
})
</script>

<style scoped>
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
