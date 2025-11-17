\<template>
  <div class="employee-layout">
    <!-- ✅ 상단 고정 헤더 -->
    <EmployeeHeader class="header-fixed" @toggle-sidebar="toggleSidebar" />

    <div class="content-area">
      <!-- ✅ 왼쪽 고정 사이드바 -->
      <EmployeeSidebar v-show="showSidebar" class="sidebar" />

      <!-- ✅ 오른쪽 메인 콘텐츠 -->
      <div class="main-content" :class="{ 'sidebar-hidden': !showSidebar }">
        

        <!-- ✅ 페이지 내용 -->
        <div class="peer-review-page">
          <div class="header">
            <h1>동료 평가 (Peer Review)</h1>
            <p>함께 일한 팀원을 평가하여 더 나은 협업 문화를 만들어주세요.</p>
          </div>

          <!-- ✅ 평가 폼 -->
          <div class="form-card">
            <h2>평가 작성</h2>

            <div class="form-group">
              <label>평가 대상</label>
              <select v-model="form.reviewee_id">
                <option disabled value="">-- 팀원을 선택하세요 --</option>
                <option v-for="user in teammates" :key="user.user_id" :value="user.user_id">
                  {{ user.name }}
                </option>
              </select>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label>팀워크</label>
                <input type="number" v-model="form.teamwork" min="1" max="5" />
              </div>

              <div class="form-group">
                <label>커뮤니케이션</label>
                <input type="number" v-model="form.communication" min="1" max="5" />
              </div>

              <div class="form-group">
                <label>책임감</label>
                <input type="number" v-model="form.responsibility" min="1" max="5" />
              </div>
            </div>

            <div class="form-group">
              <label>코멘트</label>
              <textarea
                v-model="form.comment"
                placeholder="팀원에 대한 피드백을 작성해주세요."
              ></textarea>
            </div>

            <button class="submit-btn" @click="submitReview">평가 제출</button>
          </div>

          <!-- ✅ 제출된 평가 목록 -->
          <div class="list-card" v-if="submitted.length">
            <h2>📋 내가 제출한 평가</h2>
            <table>
              <thead>
                <tr>
                  <th>이름</th>
                  <th>팀워크</th>
                  <th>커뮤니케이션</th>
                  <th>책임감</th>
                  <th>코멘트</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="review in submitted" :key="review.id">
                  <td>{{ review.Reviewee?.name }}</td>
                  <td>{{ review.teamwork }}</td>
                  <td>{{ review.communication }}</td>
                  <td>{{ review.responsibility }}</td>
                  <td>{{ review.comment }}</td>
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
  name: "PeerReview",
  components: { EmployeeHeader, EmployeeSidebar },
  data() {
    return {
      showSidebar: true,
      teammates: [],
      submitted: [],
      form: {
        reviewee_id: "",
        teamwork: 3,
        communication: 3,
        responsibility: 3,
        comment: "",
      },
    };
  },
  async mounted() {
    await this.loadTeammates();
    await this.loadSubmitted();
  },
  methods: {
    toggleSidebar() {
      this.showSidebar = !this.showSidebar;
    },
    async loadTeammates() {
      try {
        const res = await this.$axios.get("/api/peer-review/team", { withCredentials: true });
        this.teammates = res.data.data;
      } catch (err) {
        console.error("❌ 팀원 조회 실패:", err);
      }
    },
    async loadSubmitted() {
      try {
        const userId = localStorage.getItem("user_id");
        const res = await this.$axios.get("/api/peer-review/received/" + userId, {
          withCredentials: true,
        });
        this.submitted = res.data.reviews;
      } catch (err) {
        console.error("❌ 평가 조회 실패:", err);
      }
    },
    async submitReview() {
      if (!this.form.reviewee_id) return alert("평가 대상을 선택하세요.");
      try {
        await this.$axios.post("/api/peer-review", this.form, { withCredentials: true });
        alert("평가가 성공적으로 제출되었습니다!");
        this.form = { reviewee_id: "", teamwork: 3, communication: 3, responsibility: 3, comment: "" };
        await this.loadSubmitted();
      } catch (err) {
        console.error("❌ 평가 제출 실패:", err);
        alert("제출 중 오류가 발생했습니다.");
      }
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

/* ===== 상단 헤더 ===== */
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
  margin-top: 64px;
}

.sidebar {
  position: fixed;
  top: 64px;
  left: 0;
  width: 240px;
  height: calc(100vh - 64px);
  background-color: #ffffff;
  border-right: 1px solid #e5e7eb;
  box-shadow: 2px 0 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.main-content {
  flex: 1;
  margin-left: 240px;
  padding: 2rem;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.main-content.sidebar-hidden {
  margin-left: 0;
  width: 100%;
}


/* ===== 페이지 본문 ===== */
.peer-review-page {
  width: 100%;
  max-width: 900px;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 1.6rem;
  font-weight: 700;
  color: #1f2937;
}

.header p {
  color: #6b7280;
  margin-top: 0.5rem;
}

/* ===== 카드 ===== */
.form-card,
.list-card {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  padding: 2rem;
  margin-bottom: 2rem;
  width: 100%;
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
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.4rem;
}

select,
input,
textarea {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 0.6rem 0.8rem;
  font-size: 0.95rem;
}

select:focus,
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
  margin-top: 0.5rem;
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
</style>
