<template>
  <div class="employee-layout">
    <!-- ✅ 상단 고정 헤더 -->
    <EmployeeHeader class="header-fixed" @toggle-sidebar="toggleSidebar" />

    <!-- ✅ 사이드바 + 메인 콘텐츠 -->
    <div class="content-area">
      <!-- ✅ 왼쪽 사이드바 -->
      <EmployeeSidebar v-show="showSidebar" class="sidebar" />

      <!-- ✅ 오른쪽 메인 영역 -->
      <div class="main-content" :class="{ 'sidebar-hidden': !showSidebar }">
        <!-- ✅ 상단 네비게이션 -->
        <div class="page-nav">
          <button
            @click="$router.push('/employee/vacation')"
            :class="['nav-btn', { active: $route.path === '/employee/vacation' }]"
          >
            연차 신청
          </button>
          <button
            @click="$router.push('/employee/vacation-status')"
            :class="['nav-btn', { active: $route.path === '/employee/vacation-status' }]"
          >
            연차 현황
          </button>
          <button
            @click="$router.push('/employee/vacation-notice')"
            :class="['nav-btn', { active: $route.path === '/employee/vacation-notice' }]"
          >
            연차 게시판
          </button>
        </div>

        <!-- ✅ 연차 현황 페이지 -->
        <div class="vacation-status-page">
          <div class="header">
            <h1>연차 현황</h1>
            <p>나의 연차 사용 현황과 내역을 확인하세요.</p>
            <div class="header-actions">
              
            </div>
          </div>

          <!-- ✅ 요약 카드 -->
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

            <div class="progress-section">
              <div class="progress-label">
                <span>사용률: {{ usagePercent }}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: usagePercent + '%' }"></div>
              </div>
            </div>
          </div>

          <!-- ✅ 내역 테이블 -->
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
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import EmployeeHeader from "@/components/EmployeeHeader.vue";
import EmployeeSidebar from "@/components/EmployeeSidebar.vue";

export default {
  name: "VacationStatus",
  components: { EmployeeHeader, EmployeeSidebar },
  data() {
    return {
      showSidebar: true,
      status: { totalDays: 15, usedDays: 0, remainingDays: 15 },
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
    toggleSidebar() {
      this.showSidebar = !this.showSidebar;
    },
    async loadStatus() {
      try {
        const res = await axios.get("http://localhost:3000/api/vacations/status", {
          withCredentials: true,
        });
        if (res.data.success) this.status = res.data.status;
      } catch (err) {
        console.error("연차 현황 불러오기 실패:", err);
      }
    },
    async loadHistory() {
      try {
        const res = await axios.get("http://localhost:3000/api/vacations/history", {
          withCredentials: true,
        });
        if (res.data.success) this.history = res.data.history;
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
/* ===== 전체 레이아웃 ===== */
.employee-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f9fafb;
  font-family: "Pretendard", "Noto Sans KR", sans-serif;
}

/* ===== 헤더 고정 ===== */
.header-fixed {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 64px;
  background-color: #fff;
  border-bottom: 1px solid #e5e7eb;
  z-index: 50;
}

/* ===== 콘텐츠 ===== */
.content-area {
  display: flex;
  margin-top: 64px;
}

/* ===== 사이드바 ===== */
.sidebar {
  position: fixed;
  top: 64px;
  left: 0;
  width: 240px;
  height: calc(100vh - 64px);
  background-color: #fff;
  border-right: 1px solid #e5e7eb;
  box-shadow: 2px 0 6px rgba(0, 0, 0, 0.05);
  z-index: 20;
  transition: all 0.3s ease;
}

.main-content {
  flex: 1;
  margin-left: 240px;
  padding: 2rem;
  transition: all 0.3s ease;
}

.main-content.sidebar-hidden {
  margin-left: 0;
}

/* ===== 네비게이션 ===== */
.page-nav {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.8rem;
}

.nav-btn {
  background-color: transparent;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 0.45rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-btn:hover,
.nav-btn.active {
  background-color: #10b981;
  border-color: #10b981;
  color: white;
}

/* ===== 본문 ===== */
.vacation-status-page {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
}

/* ===== 헤더 ===== */
.header {
  text-align: center;
  margin-bottom: 2rem;
}
.header h1 {
  font-size: 1.6rem;
  color: #1f2937;
  font-weight: 700;
}
.header p {
  color: #6b7280;
  margin-top: 0.5rem;
}


/* ===== 카드 ===== */
.summary-card,
.history-card {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  padding: 2rem;
  margin-bottom: 2rem;
}

/* ===== 통계 ===== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  text-align: center;
  border-radius: 1rem;
  padding: 1rem;
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
  color: #6b7280;
  margin-bottom: 0.5rem;
}
.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
}

/* ===== 진행바 ===== */
.progress-bar {
  width: 100%;
  height: 1.2rem;
  background: #e5e7eb;
  border-radius: 1rem;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #059669);
  transition: width 0.6s ease;
}

/* ===== 테이블 ===== */
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}
th,
td {
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  text-align: left;
}
th {
  background-color: #f3f4f6;
}
tr:hover {
  background-color: #f9fafb;
}

/* ===== 상태 ===== */
.status {
  font-weight: 600;
  padding: 0.25rem 0.6rem;
  border-radius: 0.4rem;
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
</style>
