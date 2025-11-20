<template>
  <div class="manager-layout">
    <!-- ✅ 상단 고정 헤더 -->
    <ManagerHeader class="header-fixed" @toggle-sidebar="toggleSidebar" />

    <!-- 전체 영역 -->
    <div class="content-area">
      
      <!-- ✅ 왼쪽 사이드바 -->
      <ManagerSidebar v-show="showSidebar" class="sidebar" />

      <!-- 메인 -->
      <main class="main-content" :class="{ 'sidebar-hidden': !showSidebar }">
        <!-- 인사말 -->
      <div class="welcome">
        <h1>{{ currentUser?.name }} 매니저님, 안녕하세요!</h1>
        <p>오늘 팀의 진행 상황을 확인해보세요.</p>
      </div>

      <!-- 기능 카드 -->
      <div class="feature-grid">
        <div class="feature-card" @click="goTo('/manager/team-task-dashboard')">
          <h3>팀 업무 현황</h3>
          <div class="feature-desc">
            <p>팀원들의 업무 상태와 진행률을</p>
            <p>한눈에 확인하고 관리할 수 있습니다.</p>
          </div>
        </div>

        <div class="feature-card" @click="goTo('/manager/vacation')">
          <h3>연차 승인 관리</h3>
          <div class="feature-desc">
            <p>팀원들의 연차 신청을 빠르게 확인하고</p>
            <p>승인 또는 반려할 수 있습니다.</p>
          </div>
        </div>

        <div class="feature-card" @click="goTo('/manager/ai-feedback')">
          <h3>리포트 요약</h3>
          <div class="feature-desc">
            <p>AI가 자동으로 생성한 업무 리포트를</p>
            <p>요약하여 제공합니다.</p>
          </div>
        </div>
      </div>
    </main>

      <!-- 오른쪽 사이드 패널 -->
      <aside class="sidebar-right">
        <div class="calendar">
          <h3>📅 Team Calendar</h3>
          <ManagerCalendarComponent />
        </div>

        <div class="events">
          <h3>Pending</h3>
          <p class="event blue">김현우 – 연차 요청</p>
          <p class="event green">신규 프로젝트 보고서</p>
        </div>
      </aside>
    </div>
  </div>
</template>

<script>
import ManagerHeader from "@/components/ManagerHeader.vue";
import ManagerSidebar from "@/components/ManagerSidebar.vue";
import ManagerCalendarComponent from "@/components/ManagerCalendarComponent.vue";

export default {
  name: "ManagerHome",
  components: { ManagerHeader, ManagerSidebar, ManagerCalendarComponent },
  data() {
    return {
      currentUser: null,
      showSidebar: true,
    };
  },
  async created() {
    await this.loadCurrentUser();
    if (window.innerWidth <= 1024) {
      this.showSidebar = false;
    }
  },
  methods: {
    async loadCurrentUser() {
      try {
        const response = await this.$axios.get("http://localhost:3000/api/info", {
          withCredentials: true,
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" }
        });

        if (response.data.isLogin) {
          this.currentUser = response.data.user;
        } else {
          this.$router.push("/login");
        }
      } catch (err) {
        console.error("사용자 정보 불러오기 실패:", err);
        this.$router.push("/login");
      }
    },
    goTo(path) {
      this.$router.push(path);
    },
    toggleSidebar() {
      this.showSidebar = !this.showSidebar;
    }
  }
};
</script>

<style scoped>
.manager-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f8f9fc;
}

.content-area {
  display: flex;
  margin-top: 60px;
  min-height: calc(100vh - 60px);
}

/* 좌측 사이드바 */
.sidebar {
  width: 240px;
  background: #fff;
  border-right: 1px solid #e5e7eb;
  position: fixed;
  top: 60px;
  left: 0;
  height: calc(100vh - 60px);
  box-shadow: 2px 0 6px rgba(0,0,0,0.05);
}

/* 메인 콘텐츠 */
.main-content {
  flex: 1;
  margin-left: 240px;
  padding: 2rem;
  transition: 0.3s ease;
}

.main-content.sidebar-hidden {
  margin-left: 0;
}

/* 오른쪽 패널 */
.sidebar-right {
  width: 300px;
  background: #fff;
  border-left: 1px solid #e5e7eb;
  padding: 20px;
  flex-shrink: 0;
}


/* 인사말 */
.welcome {
  margin: 10px 0 20px 0;
}

.welcome h1 {
  font-size: 22px;
  font-weight: 600;
}

.welcome p {
  color: #6b7280;
}

/* 기능 카드 */
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

.event {
  padding: 12px;
  border-radius: 10px;
  color: #fff;
  margin-bottom: 10px;
}
.event.blue { background: #3b82f6; }
.event.green { background: #22c55e; }
</style>
