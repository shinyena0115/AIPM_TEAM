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

  <!-- 기존 기능 카드들 -->
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
    <h3>AI 인사 분석</h3>
    <div class="feature-desc">
      <p>팀원 업무·출퇴근·연차·동료평가 기반 분석</p>
    </div>
  </div>

  <!-- 🔥 팀원 카드: feature-grid 안으로 이동 -->
  <div class="team-full-card">
    <h3 class="team-title">Team Members</h3>

    <div class="team-members-grid">
      <div
        class="team-mini"
        v-for="member in teamMembers"
        :key="member.user_id"
        @click="openMemberModal(member)"
      >
        <div class="avatar-circle">{{ member.name.slice(0, 1) }}</div>
        <p class="mini-name">{{ member.name }}</p>
      </div>
    </div>
  </div>

</div>


      
      </main>

      <!-- 오른쪽 패널 -->
      <aside class="sidebar-right">
        <div class="calendar">
          <h3>📅 Team Calendar</h3>
          <ManagerCalendarComponent />
        </div>

        
      </aside>
    </div>

    <!-- 🔥 팀원 상세 모달 -->
    <div v-if="showMemberModal" class="modal-overlay" @click.self="closeMemberModal">
      <div class="modal-box">
        <h2>{{ selectedMember?.name }}</h2>
        <p><strong>Email:</strong> {{ selectedMember?.email }}</p>
        <p><strong>Role:</strong> {{ selectedMember?.role }}</p>

        <button class="close-btn" @click="closeMemberModal">닫기</button>
      </div>
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
      teamMembers: [],
      teamName: "",

      selectedMember: null,
      showMemberModal: false,
    };
  },

  async created() {
    await this.loadCurrentUser();
    await this.loadTeamMembers();

    if (window.innerWidth <= 1024) {
      this.showSidebar = false;
    }
  },

  methods: {
    async loadCurrentUser() {
      try {
        const res = await this.$axios.get("http://localhost:3000/api/info", {
          withCredentials: true,
        });

        if (res.data.isLogin) {
          this.currentUser = res.data.user;
        } else {
          this.$router.push("/login");
        }
      } catch {
        this.$router.push("/login");
      }
    },

    async loadTeamMembers() {
      try {
        const res = await this.$axios.get(
          "http://localhost:3000/api/manager/team-members",
          { withCredentials: true }
        );

        if (res.data.success) {
          this.teamName = res.data.team;
          this.teamMembers = res.data.members;
        }
      } catch (err) {
        console.error("팀원 목록 로딩 오류:", err);
      }
    },

    goTo(path) {
      this.$router.push(path);
    },

    toggleSidebar() {
      this.showSidebar = !this.showSidebar;
    },

    /* 🔥 모달 열기 */
    openMemberModal(member) {
      this.selectedMember = member;
      this.showMemberModal = true;
    },

    /* 🔥 모달 닫기 */
    closeMemberModal() {
      this.showMemberModal = false;
      this.selectedMember = null;
    },
  },
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
  height: calc(100vh - 60px);
  box-shadow: 2px 0 6px rgba(0,0,0,0.05);
}

/* 메인 */
.main-content {
  flex: 1;
  margin-left: 240px;
  padding: 2rem;
  transition: 0.3s;
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
}

/* 인사말 */
.welcome {
  margin-bottom: 20px;
}
.welcome h1 {
  font-size: 22px;
  font-weight: 600;
}
.welcome p {
  color: #6b7280;
}

/* 기능 카드 */
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
   /* 🔥 추가 — 카드 높이 통일 */
  height: 180px;
  display: flex;
  flex-direction: column;
  justify-content: center;
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
/* 팀원 섹션 */
.team-section {
  margin-top: 40px;
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
}

.team-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 16px;
}

/* 🔥 3열 그리드 */
.team-full-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;

  /* feature-card와 동일 */
  height: 180px;
  display: flex;
  flex-direction: column;
  justify-content: center;

  /* grid 안에서 자연스럽게 정렬 */
  width: 100%;
  box-sizing: border-box;
}

.team-full-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.08);
}

.team-title {
  text-align: center;
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

/* 카드 내부 그리드 — 팀원 전체 배치 */
.team-members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(55px, 1fr));
  gap: 0.8rem;
  justify-items: center;
}

/* 개별 팀원 아바타+이름 */
.team-mini {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: 0.2s ease;
}

.team-mini:hover {
  transform: translateY(-4px);
}

/* 동그라미 아바타 */
.avatar-circle {
  width: clamp(40px, 4vw, 55px);
  height: clamp(40px, 4vw, 55px);
  border-radius: 50%;
  background: #4f46e5;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(0.8rem, 1.4vw, 1rem);
  font-weight: 700;
}

/* 팀원 이름 */
.mini-name {
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  color: #333;
}


/* 모달 스타일 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.45);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-box {
  background: white;
  padding: 25px;
  border-radius: 12px;
  width: 340px;
  text-align: center;
}

.close-btn {
  margin-top: 20px;
  padding: 8px 16px;
  background: #4f46e5;
  color: #fff;
  border-radius: 8px;
}

.role-tag {
  background: #eef2ff;
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 11px;
  color: #4f46e5;
}
</style>
