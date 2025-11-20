<template>
  <div class="employee-layout">
    <!-- ✅ 상단 고정 헤더 -->
    <EmployeeHeader class="header-fixed" @toggle-sidebar="toggleSidebar" />

    <!-- ✅ 사이드바 + 메인 콘텐츠 -->
    <div class="content-area">
      <!-- ✅ 왼쪽 사이드바 -->
      <EmployeeSidebar v-show="showSidebar" class="sidebar" />

      <!-- ✅ 메인 영역 -->
      <div class="main-content" :class="{ 'sidebar-hidden': !showSidebar }">
        <div class="welcome">
          <h1>{{ currentUser?.name }}님, 환영합니다!</h1>
          <p>오늘도 좋은 하루 되세요 😊</p>
        </div>

        <!-- 기능 카드 -->
        <div class="feature-grid">
          <div class="feature-card" @click="goTo('/employee/tasks')">
            <h3>AI 업무 우선순위</h3>
            <div class="feature-desc">
              <p>AI가 실시간으로 업무의 중요도를 분석하여</p>
              <p>가장 효율적인 순서로 정리합니다.</p>
            </div>
          </div>

          <div class="feature-card" @click="goTo('/employee/vacation')">
            <h3>연차 관리</h3>
            <div class="feature-desc">
              <p>내 근무일정과 연차 내역을 한 화면에서</p>
              <p>직관적으로 확인하고 간편하게 신청하세요.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ✅ 오른쪽 캘린더 사이드바 -->
      <aside class="sidebar-right">
        <div class="calendar">
          <h3>📅 Calendar</h3>
          <CalendarComponent />
        </div>

        <div class="events">
          <h3>Upcoming Events</h3>
          <p>등록된 일정이 없습니다.</p>
        </div>
      </aside>
    </div>
  </div>
</template>

<script>
import CalendarComponent from "@/components/CalendarComponent.vue";
import EmployeeSidebar from "@/components/EmployeeSidebar.vue";
import EmployeeHeader from "@/components/EmployeeHeader.vue";

export default {
  name: "EmployeeHome",
  components: { EmployeeSidebar, EmployeeHeader, CalendarComponent },
  data() {
    return {
      currentUser: null,
      showSidebar: true, // ✅ 기본 표시 (PC)
    };
  },
  async created() {
    await this.loadCurrentUser();

    // ✅ 화면 크기에 따라 초기 표시 설정
    if (window.innerWidth <= 1024) {
      this.showSidebar = false;
    }
  },
  methods: {
    async loadCurrentUser() {
      try {
        const response = await this.$axios.get("http://localhost:3000/api/info", {
          withCredentials: true,
        });
        if (response.data.isLogin) {
          this.currentUser = response.data.user;
        } else {
          this.$router.push("/login");
        }
      } catch (error) {
        console.error("사용자 정보 불러오기 실패:", error);
        this.$router.push("/login");
      }
    },
    goTo(path) {
      this.$router.push(path);
    },
    toggleSidebar() {
      this.showSidebar = !this.showSidebar;
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

.content-area {
  display: flex;
  margin-top: 60px;
  min-height: calc(100vh - 60px);
}

.sidebar {
  position: fixed;
  top: 60px;
  left: 0;
  width: 240px;
  height: calc(100vh - 60px);
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
  overflow-y: auto;
}

.main-content.sidebar-hidden {
  margin-left: 0;
}

/* ✅ 오른쪽 캘린더 사이드바 */
.sidebar-right {
  width: 300px;
  background: #fff;
  border-left: 1px solid #e5e7eb;
  padding: 20px;
  flex-shrink: 0;
  overflow-y: auto;
  position: sticky;
  top: 60px;
  height: calc(100vh - 60px);
}

/* ✅ 인사말 */
.welcome {
  margin: 20px 0;
}
.welcome h1 {
  font-size: 22px;
  font-weight: 600;
}
.welcome p {
  color: #6b7280;
}

/* ✅ 기능 카드 */
.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}
.feature-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  padding: 2rem 1.5rem;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
}
.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
}
.feature-card h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 1rem;
}
.feature-desc p {
  font-size: 0.95rem;
  color: #555;
  line-height: 1.5;
  margin: 0.25rem 0;
}

/* ✅ 오른쪽 캘린더 내부 */
.calendar {
  margin-bottom: 30px;
}
.calendar h3 {
  margin-bottom: 10px;
  font-weight: 600;
}
.events h3 {
  margin-bottom: 10px;
  font-weight: 600;
}

</style>
