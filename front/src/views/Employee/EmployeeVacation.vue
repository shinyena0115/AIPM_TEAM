<template>
  <div class="employee-layout">
    <!-- ✅ 상단 고정 헤더 -->
    <EmployeeHeader class="header-fixed" @toggle-sidebar="toggleSidebar" />

    <!-- ✅ 사이드바 + 메인 콘텐츠 -->
    <div class="content-area">
      
      <!-- ✅ 왼쪽 고정 사이드바 (토글 가능) -->
      <EmployeeSidebar
        v-show="showSidebar"
        class="sidebar"
      />

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

        <!-- ✅ 실제 페이지 내용 -->
        <div class="vacation-page">
          <div class="header">
            <h1>연차 신청</h1>
            <p>근무일정 및 연차 내역을 확인하고 신청하세요.</p>
          </div>

          <!-- 연차 신청 폼 -->
          <div class="form-card">
            <h2>연차 신청</h2>
            <div class="form-grid">
              <div class="form-group">
                <label>시작일</label>
                <input v-model="form.startDate" type="date" />
              </div>

              <div class="form-group">
                <label>종료일</label>
                <input v-model="form.endDate" type="date" />
              </div>
            </div>

            <div class="form-group">
              <label>사유</label>
              <textarea
                v-model="form.reason"
                placeholder="예: 가족행사, 휴식 등"
              ></textarea>
            </div>

            <button @click="submitVacation" class="submit-btn">
              연차 신청하기
            </button>
          </div>

          <!-- 연차 신청 내역 -->
          <div class="list-card">
            <h2>📋 연차 신청 내역</h2>
            <table>
              <thead>
                <tr>
                  <th>신청일</th>
                  <th>기간</th>
                  <th>사유</th>
                  <th>상태</th>
                  <th>반려 사유</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="vac in vacations" :key="vac.vacation_id">
                  <td>{{ formatDate(vac.createdAt) }}</td>
                  <td>{{ vac.startDate }} ~ {{ vac.endDate }}</td>
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
import EmployeeHeader from "@/components/EmployeeHeader.vue";
import EmployeeSidebar from "@/components/EmployeeSidebar.vue";

export default {
  name: "EmployeeVacation",
  components: { EmployeeHeader, EmployeeSidebar },
  data() {
    return {
      showSidebar: true, // ✅ 사이드바 표시 상태
      form: { startDate: "", endDate: "", reason: "" },
      vacations: [],
    };
  },
  async created() {
    await this.loadVacations();
  },
  methods: {
    toggleSidebar() {
      this.showSidebar = !this.showSidebar;
    },
    async loadVacations() {
      try {
        const res = await this.$axios.get("http://localhost:3000/api/vacations/me", {
          withCredentials: true,
        });
        if (res.data.success) this.vacations = res.data.vacations;
      } catch (e) {
        console.error("연차 내역 불러오기 실패:", e);
      }
    },
    async submitVacation() {
      if (!this.form.startDate || !this.form.endDate || !this.form.reason)
        return alert("모든 항목을 입력해주세요.");
      try {
        const res = await this.$axios.post("http://localhost:3000/api/vacations", this.form, {
          withCredentials: true,
        });
        if (res.data.success) {
          alert("연차 신청이 완료되었습니다!");
          this.form = { startDate: "", endDate: "", reason: "" };
          this.loadVacations();
        } else alert("연차 신청 실패: " + res.data.message);
      } catch (e) {
        console.error("연차 신청 실패:", e);
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

/* ===== 상단 헤더 고정 ===== */
.header-fixed {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 64px;
  z-index: 50;
  background-color: white;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

/* ===== 사이드바 + 메인 ===== */
.content-area {
  display: flex;
  margin-top: 64px; /* 헤더 높이만큼 띄움 */
}

/* ===== 사이드바 (고정) ===== */
.sidebar {
  position: fixed;
  top: 64px;
  left: 0;
  width: 240px;
  height: calc(100vh - 64px);
  background-color: #ffffff;
  border-right: 1px solid #e5e7eb;
  box-shadow: 2px 0 6px rgba(0, 0, 0, 0.05);
  z-index: 20;
  transition: all 0.3s ease;
}


/* 사이드바가 닫혔을 때 메인 확장 */
.sidebar-hidden {
  margin-left: 0;
}
/* ===== 메인 영역 ===== */

.main-content {
  flex: 1;
  margin-left: 240px; /* 사이드바가 있을 때 */
  padding: 2rem;
  min-height: calc(100vh - 64px);
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.3s ease; /* 부드럽게 이동 */
}

/* 사이드바가 닫혔을 때 메인 확장 및 중앙 배치 */
.main-content.sidebar-hidden {
  margin-left: 0;
  width: 100%;
  align-items: center; /* 내부 컨텐츠도 중앙 정렬 유지 */
}


/* ===== 페이지 내 네비게이션 ===== */
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

.nav-btn:hover {
  background-color: #10b981;
  border-color: #10b981;
  color: white;
}

.nav-btn.active {
  background-color: #10b981;
  color: white;
  border-color: #10b981;
  font-weight: 600;
}

/* ===== 본문 ===== */
.vacation-page {
  width: 100%;
  max-width: 900px;
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

/* ===== 카드 공통 ===== */
.form-card,
.list-card {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  padding: 2rem;
  width: 100%;
  margin-bottom: 2rem;
}

.form-card h2,
.list-card h2 {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 1.2rem;
  color: #111827;
}

/* ===== 폼 ===== */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

input,
textarea {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 0.6rem 0.8rem;
  font-size: 0.95rem;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
}

textarea {
  resize: none;
  height: 100px;
}

/* ===== 버튼 ===== */
.submit-btn {
  background-color: #10b981;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 0.6rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s;
}

.submit-btn:hover {
  background-color: #059669;
}

/* ===== 테이블 ===== */
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

th,
td {
  padding: 0.75rem 1rem;
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

/* ===== 상태 색상 ===== */
.status {
  font-weight: 600;
}

.status.대기 {
  color: #ca8a04;
}

.status.승인 {
  color: #16a34a;
}

.status.반려 {
  color: #dc2626;
}
</style>
