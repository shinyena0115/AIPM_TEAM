<template>
  <div class="employee-layout">
    <!-- ✅ 상단 고정 헤더 -->
    <EmployeeHeader
      :currentUser="currentUser"
      @toggle-sidebar="toggleSidebar"
    />

    <!-- ✅ 헤더 아래: 왼쪽 사이드바 + 메인 + 오른쪽 캘린더 -->
    <div class="content-area">
      <!-- 왼쪽 사이드바 (햄버거로 토글 가능) -->
      <transition name="slide">
        <EmployeeSidebar
          v-if="showSidebar"
          class="sidebar-left"
          @close-sidebar="toggleSidebar"
        />
      </transition>

      <!-- 오버레이 (모바일 전용) -->
      <div
        v-if="showSidebar"
        class="overlay"
        @click="toggleSidebar"
      ></div>

      <!-- 메인 콘텐츠 -->
      <main class="main">
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
      </main>

      <!-- ✅ 오른쪽 캘린더 -->
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
/* 전체 레이아웃 */
.employee-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f8f9fc;
}

/* ✅ 헤더 */
.employee-layout > :first-child {
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 1000;
}

/* ✅ 헤더 아래: 3분할 레이아웃 */
.content-area {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

/* ✅ 왼쪽 사이드바 */
.sidebar-left {
  width: 240px;
  background: #ffffff;
  border: none;
  flex-shrink: 0;
  position: sticky;
  top: 60px;
  height: calc(100vh - 60px);
  overflow: hidden;
  z-index: 1100;
}

/* ✅ 가운데 메인 */
.main {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
  z-index: 1;
}

/* ✅ 오른쪽 캘린더 사이드바 */
.sidebar-right {
  width: 300px;
  background: #fff;
  border-left: 1px solid #e6e6e6;
  padding: 20px;
  flex-shrink: 0;
  position: sticky;
  top: 60px;
  height: calc(100vh - 60px);
  overflow-y: auto;
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

/* ✅ 슬라이드 애니메이션 */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

/* ✅ 오버레이 (모바일 전용) */
.overlay {
  display: none;
}

@media (max-width: 1024px) {
  .sidebar-left {
    position: fixed;
    top: 64px;
    left: 0;
    height: calc(100vh - 64px);
    z-index: 1200;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.2);
  }

  .overlay {
    display: block;
    position: fixed;
    top: 64px;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 1000;
  }
}
</style>
