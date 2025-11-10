<template>
  <div class="vacation-status-page">
    <div class="header">
      <h1>📊 연차 현황</h1>
      <p>나의 연차 사용 현황과 내역을 확인하세요.</p>
      <div class="header-actions">
        <button @click="$router.push('/employee/vacation')" class="apply-btn">
          ✏️ 연차 신청하기
        </button>
      </div>
    </div>

    <!-- ✅ 연차 현황 요약 카드 -->
    <div class="summary-card">
      <h2>연차 사용 현황</h2>

      <div class="stats-grid">
        <div class="stat-item total">
          <div class="stat-label">총 연차</div>
          <div class="stat-value">{{ status.totalDays }}일</div>
        </div>

        <div class="stat-item used">
          <div class="stat-label">사용한 연차</div>
          <div class="stat-value">{{ status.usedDays }}일</div>
        </div>

        <div class="stat-item remaining">
          <div class="stat-label">남은 연차</div>
          <div class="stat-value">{{ status.remainingDays }}일</div>
        </div>
      </div>

      <!-- 진행바 -->
      <div class="progress-section">
        <div class="progress-label">
          <span>사용률: {{ usagePercent }}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: usagePercent + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- ✅ 연차 사용 내역 테이블 -->
    <div class="history-card">
      <h2>📋 연차 사용 내역</h2>

      <div v-if="history.length === 0" class="empty-state">
        <p>연차 사용 내역이 없습니다.</p>
      </div>

      <table v-else>
        <thead>
          <tr>
            <th>신청일</th>
            <th>기간</th>
            <th>일수</th>
            <th>사유</th>
            <th>상태</th>
            <th>반려 사유</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="vac in history" :key="vac.vacation_id">
            <td>{{ formatDate(vac.createdAt) }}</td>
            <td>{{ vac.startDate }} ~ {{ vac.endDate }}</td>
            <td><strong>{{ vac.days }}일</strong></td>
            <td>{{ vac.reason }}</td>
            <td>
              <span :class="'status ' + vac.status">{{ vac.status }}</span>
            </td>
            <td>
              <span v-if="vac.status === '반려'">{{ vac.rejection_reason || '-' }}</span>
              <span v-else>-</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  name: "VacationStatus",
  data() {
    return {
      status: {
        totalDays: 15,
        usedDays: 0,
        remainingDays: 15,
      },
      history: [],
    };
  },
  computed: {
    usagePercent() {
      if (this.status.totalDays === 0) return 0;
      return Math.round((this.status.usedDays / this.status.totalDays) * 100);
    },
  },
  async created() {
    await this.loadStatus();
    await this.loadHistory();
  },
  methods: {
    async loadStatus() {
      try {
        const response = await this.$axios.get("http://localhost:3000/api/vacations/status");
        if (response.data.success) {
          this.status = response.data.status;
        }
      } catch (err) {
        console.error("연차 현황 불러오기 실패:", err);
      }
    },
    async loadHistory() {
      try {
        const response = await this.$axios.get("http://localhost:3000/api/vacations/history");
        if (response.data.success) {
          this.history = response.data.history;
        }
      } catch (err) {
        console.error("연차 내역 불러오기 실패:", err);
      }
    },
    formatDate(date) {
      return new Date(date).toLocaleDateString();
    },
  },
};
</script>

<style scoped>
.vacation-status-page {
  min-height: 100vh;
  background-color: #f9fafb;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem 1rem;
  font-family: "Pretendard", "Noto Sans KR", sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 2rem;
  color: #1f2937;
  font-weight: 700;
}

.header p {
  color: #6b7280;
  margin-top: 0.5rem;
}

.header-actions {
  margin-top: 1rem;
}

.apply-btn {
  background-color: #10b981;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.6rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s;
  font-weight: 500;
}

.apply-btn:hover {
  background-color: #059669;
}

.summary-card,
.history-card {
  background: white;
  border-radius: 1.5rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  padding: 2rem;
  width: 100%;
  max-width: 800px;
  margin-bottom: 2rem;
}

.summary-card h2,
.history-card h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

/* ✅ 통계 그리드 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-item {
  text-align: center;
  padding: 1.5rem;
  border-radius: 1rem;
  transition: transform 0.2s;
}

.stat-item:hover {
  transform: translateY(-4px);
}

.stat-item.total {
  background-color: #eff6ff;
  border: 2px solid #3b82f6;
}

.stat-item.used {
  background-color: #fef3c7;
  border: 2px solid #f59e0b;
}

.stat-item.remaining {
  background-color: #d1fae5;
  border: 2px solid #10b981;
}

.stat-label {
  font-size: 0.9rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
}

.stat-item.total .stat-value {
  color: #3b82f6;
}

.stat-item.used .stat-value {
  color: #f59e0b;
}

.stat-item.remaining .stat-value {
  color: #10b981;
}

/* ✅ 진행바 */
.progress-section {
  margin-top: 1.5rem;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: #6b7280;
  font-weight: 500;
}

.progress-bar {
  width: 100%;
  height: 1.5rem;
  background-color: #e5e7eb;
  border-radius: 1rem;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #059669);
  border-radius: 1rem;
  transition: width 0.6s ease;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 0.5rem;
  color: white;
  font-weight: 600;
  font-size: 0.85rem;
}

/* ✅ 빈 상태 */
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #9ca3af;
  font-size: 1rem;
}

/* ✅ 테이블 */
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

th,
td {
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  text-align: left;
}

th {
  background-color: #f3f4f6;
  font-weight: 600;
}

tr:hover {
  background-color: #f9fafb;
}

/* ✅ 상태 색상 */
.status {
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 0.5rem;
  display: inline-block;
}

.status.대기 {
  color: #ca8a04;
  background-color: #fef3c7;
}

.status.승인 {
  color: #16a34a;
  background-color: #d1fae5;
}

.status.반려 {
  color: #dc2626;
  background-color: #fee2e2;
}

/* ✅ 반응형 */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  table {
    font-size: 0.85rem;
  }

  th,
  td {
    padding: 0.5rem;
  }
}
</style>