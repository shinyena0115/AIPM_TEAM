<template>
  <div class="admin-layout">

    <!-- 🔥 고정 헤더 -->
    <AdminHeader
      class="header-fixed"
      @toggle-sidebar="sidebarOpen = !sidebarOpen"
    />

    <div class="layout-body">

      <!-- 🔥 사이드바 -->
      <AdminSidebar
        v-show="sidebarOpen"
        class="admin-sidebar-fixed"
      />

      <!-- 🔥 메인 -->
      <main class="page-wrapper" :class="{ 'sidebar-hidden': !sidebarOpen }">

        <div class="header">
          <div>
            <h1>부서 및 팀 관리</h1>
            <p>조직의 부서 및 팀을 효율적으로 관리하세요.</p>
          </div>
          <div class="header-button-wrap">
  <button class="add-department-btn" @click="showDeptModal = true">+ 부서 등록하기</button>
</div>
        </div>

        <!-- 🔥 카드 -->
        <section class="card department-list">
          <div
            class="department-card"
            v-for="dep in departments"
            :key="dep.id"
          >
            <div class="dep-top">
              <h2>{{ dep.name }}</h2>
              <button class="delete-btn" @click="deleteDepartment(dep)">삭제</button>
            </div>

            <ul class="team-list">
              <li v-for="team in dep.Teams" :key="team.id">
                {{ team.name }}
                <button @click="deleteTeam(team.id)" class="team-del">x</button>
              </li>
            </ul>

            <button class="add-team-btn" @click="openTeamModal(dep)">
              + 팀 추가
            </button>
          </div>
        </section>

      </main>
    </div>

    <!-- 부서 등록 모달 -->
    <div class="modal" v-if="showDeptModal">
      <div class="modal-content">
        <h2>부서 등록</h2>
        <input v-model="newDeptName" placeholder="부서명 입력" />
        <div class="modal-buttons">
          <button @click="addDepartment">등록</button>
          <button @click="showDeptModal = false">취소</button>
        </div>
      </div>
    </div>

    <!-- 팀 등록 모달 -->
    <div class="modal" v-if="showTeamModal">
      <div class="modal-content">
        <h2>{{ selectedDept?.name }} 팀 추가</h2>
        <input v-model="newTeamName" placeholder="팀 이름 입력" />
        <div class="modal-buttons">
          <button @click="addTeam">등록</button>
          <button @click="showTeamModal = false">취소</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import AdminSidebar from "@/components/AdminSidebar.vue";
import AdminHeader from "@/components/AdminHeader.vue";

export default {
  components: { AdminSidebar, AdminHeader },

  data() {
    return {
      departments: [],
      sidebarOpen: true,      // 🔥 사원관리와 동일한 토글 구조
      showDeptModal: false,
      showTeamModal: false,
      newDeptName: "",
      newTeamName: "",
      selectedDept: null,
    };
  },

  mounted() {
    this.getDepartments();
  },

  methods: {
    async getDepartments() {
      const res = await this.$axios.post("/api/department/list");
      if (res.data.success) this.departments = res.data.departmentList;
    },

    async addDepartment() {
      if (!this.newDeptName.trim()) return;
      await this.$axios.post("/api/department/create", { name: this.newDeptName });
      this.showDeptModal = false;
      this.newDeptName = "";
      this.getDepartments();
    },

    async deleteDepartment(dep) {
      if (confirm(`${dep.name} 부서를 삭제하시겠습니까?`)) {
        await this.$axios.post("/api/department/delete", { id: dep.id });
        this.getDepartments();
      }
    },

    openTeamModal(dep) {
      this.selectedDept = dep;
      this.showTeamModal = true;
    },

    async addTeam() {
      if (!this.newTeamName.trim()) return;
      await this.$axios.post("/api/department/team/create", {
        name: this.newTeamName,
        department_id: this.selectedDept.id,
      });
      this.showTeamModal = false;
      this.newTeamName = "";
      this.getDepartments();
    },

    async deleteTeam(teamId) {
      await this.$axios.post("/api/department/team/delete", { id: teamId });
      this.getDepartments();
    },
  },
};
</script>

<style scoped>
/* 🔥 사원관리 페이지와 동일 레이아웃 시스템 */
.admin-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.header-fixed {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  z-index: 200;
  display: flex;
  align-items: center;
}

.layout-body {
  display: flex;
  margin-top: 60px;
}

.admin-sidebar-fixed {
  position: fixed;
  top: 60px;
  left: 0;
  width: 240px;
  height: calc(100vh - 60px);
  background: white;
  border-right: 1px solid #e5e7eb;
  overflow-y: auto;
  z-index: 150;
}

.page-wrapper {
  flex: 1;
  margin-left: 240px;
  padding: 40px 50px;
  transition: margin-left 0.3s ease;
}

.page-wrapper.sidebar-hidden {
  margin-left: 0;
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

.header-button-wrap {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1.5rem;
}

.add-department-btn {
  background: #eb3f25;
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: 0.2s;
}

.add-department-btn:hover {
  background: #eb3f25;
}

/* 카드 공통 */
.card {
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}

/* 부서 카드 */
.department-card {
  border: 1px solid #e5e7eb;
  padding: 18px 20px;
  border-radius: 12px;
  margin-bottom: 14px;
}

.dep-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dep-top h2 {
  font-size: 17px;
  font-weight: 700;
  color: #1f2937;
}

.delete-btn {
  border: none;
  background: none;
  color: #ef4444;
  cursor: pointer;
}

/* 팀 리스트 */
.team-list {
  list-style: none;
  padding: 0;
  margin-top: 12px;
}

.team-list li {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
  margin-bottom: 6px;
}

.team-del {
  border: none;
  background: none;
  color: #ef4444;
  cursor: pointer;
}

/* 팀 추가 버튼 */
.add-team-btn {
  margin-top: 8px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 14px;
}

/* 🔥 모달 전체 배경 */
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999; /* 최상단 표시 */
  backdrop-filter: blur(2px); /* 부드러운 블러 효과 */
}

/* 🔥 모달 박스 */
.modal-content {
  background: white;
  border-radius: 14px;
  padding: 28px 26px;
  width: 380px;
  box-shadow:
    0 6px 18px rgba(0, 0, 0, 0.1),
    0 0 2px rgba(0, 0, 0, 0.08);
  animation: popIn 0.2s ease-out;
}

/* 🔥 애니메이션 */
@keyframes popIn {
  0%   { transform: scale(0.92); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

/* 🔥 제목 */
.modal-content h2 {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 18px;
  text-align: center;
}

/* 🔥 입력창 */
.modal-content input {
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #ffbbb0;
  font-size: 14px;
  outline: none;
  transition: 0.2s;
}

.modal-content input:focus {
  border-color: #eb3f25;
  box-shadow: 0 0 0 3px #ffbbb0;
}

/* 🔥 버튼 그룹 */
.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

/* 🔥 등록 버튼 */
.modal-buttons button:first-child {
  background: #eb3f25;
  color: white;
  padding: 8px 14px;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}

.modal-buttons button:first-child:hover {
  background: #eb3f25;
}

/* 🔥 취소 버튼 */
.modal-buttons button:last-child {
  background: #ffbbb0;
  border: 1px solid #ffbbb0;
  padding: 8px 14px;
  border-radius: 8px;
  color: #374151;
  cursor: pointer;
  transition: 0.2s;
}

.modal-buttons button:last-child:hover {
  background: #ffbbb0;
}

</style>
