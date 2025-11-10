<template>
  <div class="admin-layout">
    <!-- 사이드바 -->
    <AdminSidebar />

    <!-- 메인 -->
    <main class="user-manage">
      <header class="page-header">
        <div>
          <h1>사원 관리</h1>
          <p>조직 구성원 정보를 확인하고 권한을 손쉽게 관리하세요.</p>
        </div>
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
    </main>
  </div>
</template>

<script>
import AdminSidebar from "@/components/AdminSidebar.vue";

export default {
  components: { AdminSidebar },
  data() {
    return {
      users: [],
      searchQuery: "",
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
.admin-layout {
  display: flex;
  background-color: #f5f6f8;
}

/* 메인 영역 */
.user-manage {
  flex: 1;
  padding: 50px 60px;
  box-sizing: border-box;
  min-height: 100vh;
}

/* 페이지 헤더 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
}

.page-header p {
  color: #6b7280;
  font-size: 14px;
  margin-top: 4px;
}

/* 검색창 */
.search-input {
  width: 260px;
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  font-size: 14px;
  transition: 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 6px rgba(37, 99, 235, 0.2);
}

/* 카드형 테이블 */
.card {
  background: white;
  border-radius: 16px;
  padding: 20px 25px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  text-align: center;
  padding: 12px;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #f0f0f0;
  background-color: #fafafa;
}

td {
  padding: 14px;
  text-align: center;
  border-bottom: 1px solid #f3f4f6;
  font-size: 14px;
  color: #374151;
}

tr:hover {
  background-color: #f9fafb;
}

/* 역할/상태 뱃지 */
.role-tag {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
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

.status {
  font-weight: 600;
  text-transform: capitalize;
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
  font-size: 13px;
}

button {
  padding: 6px 12px;
  background-color: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: 0.2s;
}

button:hover {
  background-color: #1d4ed8;
}
</style>
