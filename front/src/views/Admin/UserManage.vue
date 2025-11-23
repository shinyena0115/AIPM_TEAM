<template>
  <div class="admin-layout">

    <!-- 🔥 고정 헤더 -->
    <AdminHeader
      class="header-fixed"
      @toggle-sidebar="sidebarOpen = !sidebarOpen"
    />

    <div class="layout-body">

      <!-- 🔥 사이드바 (토글) -->
      <AdminSidebar
        v-if="sidebarOpen"
        class="admin-sidebar-fixed"
      />

      <!-- 🔥 메인 -->
      <main class="page-wrapper" :class="{ 'sidebar-hidden': !sidebarOpen }">
        <div class="user-manage">

          <!-- 페이지 헤더 -->
          <header class="header">
            <div>
              <h1>사원 관리</h1>
              <p>조직 구성원 정보를 확인하고 권한을 손쉽게 관리하세요.</p>
            </div>
          </header>
          <header class="search">
  <div class="left-space"></div>

  <input
    v-model="searchQuery"
    type="text"
    placeholder="🔍 이름 또는 이메일 검색"
    class="search-input"
  />
</header>

          <section class="card">
            <table>
              <thead>
                <tr>
                  <th>이름</th>
                  <th>이메일</th>
                  <th>부서</th>
                  <th>팀</th>
                  <th>권한</th>
                  <th>상태</th>
                  <th>권한 변경</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="user in filteredUsers" :key="user.user_id">
                  <td>{{ user.name }}</td>
                  <td>{{ user.email }}</td>
                  <td>{{ user.department }}</td>
                  <td>{{ user.team }}</td>

                  <td>
                    <span class="role-tag" :class="user.role.toLowerCase()">
                      {{ user.role }}
                    </span>
                  </td>

                  <td>
                    <span :class="['status', user.status.toLowerCase()]">
                      {{ user.status }}
                    </span>
                  </td>

                  <td>
                    <div class="action">
                      <select v-model="user.newRole">
                        <option>Employee</option>
                        <option>Manager</option>
                        <option>Admin</option>
                      </select>
                      <button @click="updateRole(user)">변경</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>
      </main>

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
      users: [],
      searchQuery: "",
      sidebarOpen: true, // 🔥 추가
    };
  },

  computed: {
    filteredUsers() {
      const q = this.searchQuery.toLowerCase();
      return this.users.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      );
    },
  },

  async created() {
    const res = await this.$axios.get("http://localhost:3000/admin/users");
    this.users = res.data.map((u) => ({ ...u, newRole: u.role }));
  },

  methods: {
    async updateRole(user) {
      try {
        await this.$axios.put(
          `http://localhost:3000/admin/users/${user.user_id}/role`,
          { role: user.newRole }
        );
        alert("권한 변경 완료");
      } catch (err) {
        console.error(err);
        alert("변경 실패");
      }
    },
  },
};
</script>

<style scoped>
/* ==========================
   🔥 전체 레이아웃 구조
========================== */
.admin-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* 🔥 고정 헤더 */
.header-fixed {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  z-index: 200;
  display: flex;
  align-items: center;
}

/* 🔥 헤더 아래 본문 */
.layout-body {
  display: flex;
  margin-top: 60px;
}

/* 🔥 사이드바 고정 */
.admin-sidebar-fixed {
  position: fixed;
  top: 60px;
  left: 0;
  width: 240px;
  height: calc(100vh - 60px);
  background: white;
  border-right: 1px solid #e5e7eb;
  z-index: 150;
  overflow-y: auto;
}

/* 🔥 메인 컨텐츠 */
.page-wrapper {
  margin-left: 240px;
  flex: 1;
  padding: 40px 50px;
  transition: margin-left 0.3s ease;
}

/* 사이드바 접힘 → 메인 확장 */
.page-wrapper.sidebar-hidden {
  margin-left: 0;
}

/* ===========================
   🔥 사원 관리 UI
===========================*/
.user-manage {
  width: 100%;
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
.search {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

/* 검색 input */
.search-input {
  width: 260px;
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  font-size: 14px;
}

.card {
  background: white;
  border-radius: 16px;
  padding: 20px 25px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

/* 테이블 */
table {
  width: 100%;
  border-collapse: collapse;
}

th {
  background: #fafafa;
  padding: 12px;
  font-weight: 600;
  border-bottom: 2px solid #eee;
}

td {
  padding: 14px;
  border-bottom: 1px solid #f3f4f6;
}

tr:hover {
  background: #f9fafb;
}

/* 권한 뱃지 */
.role-tag {
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 13px;
}

.role-tag.admin {
  background: #fee2e2;
  color: #b91c1c;
}

.role-tag.manager {
  background: #dbeafe;
  color: #1e40af;
}

.role-tag.employee {
  background: #e0fee5;
  color: #19953e;
}

/* 상태 */
.status {
  font-weight: 600;
}
.status.active {
  color: #16a34a;
}
.status.inactive {
  color: #dc2626;
}

/* 권한 변경 */
.action {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
}

select {
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
}

button {
  padding: 6px 12px;
  border-radius: 8px;
  background: #eb3f25;
  color: white;
}
button:hover {
  background: #eb3f25;
}
</style>
