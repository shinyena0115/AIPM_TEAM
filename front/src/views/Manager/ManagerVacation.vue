<template>
  <div class="manager-layout">     <!-- 🔥 추가 -->

    <!-- 🔥 최상단 고정 헤더 추가 -->
    <ManagerHeader class="header-fixed" @toggle-sidebar="sidebarOpen = !sidebarOpen" />

    <div class="layout-body">      <!-- 🔥 추가 -->
        <ManagerSidebar v-if="sidebarOpen" />

      <!-- 🔥 기존 전체 내용 감싸기 -->
      <div class="page-wrapper" :class="{ 'sidebar-hidden': !sidebarOpen }">
        <!-- ⬇⬇⬇ 기존 코드 전체 그대로 유지 ⬇⬇⬇ -->


    <!-- 메인 내용 -->
    <div class="content">
      <div class="header">
        <h1>연차 승인 관리</h1>
        <p>직원들의 연차 신청 내역을 확인하고 승인 또는 반려할 수 있습니다.</p>
      </div>

      <div class="layout-container">
        <!-- 왼쪽 테이블 -->
        <div class="table-card">
          <table>
            <thead>
              <tr>
                <th>이름</th>
                <th>팀</th>
                <th>기간</th>
                <th>사유</th>
                <th>상태</th>
                <th>조치</th>
              </tr>
            </thead>
            <tbody>
              <!-- 정렬된 리스트 사용 -->
              <tr
                v-for="vac in computedVacations"
                :key="vac.vacation_id"
                :class="getRowClass(vac)"
              >
                <td>{{ vac.user?.name }}</td>
                <td>{{ vac.user?.Team?.name || '-' }}</td>
                <td>{{ vac.startDate }} ~ {{ vac.endDate }}</td>
                <td>{{ vac.reason }}</td>

                <td>
                  <span :class="'status ' + vac.status">{{ vac.status }}</span>
                  <template v-if="vac.status === '반려' && vac.rejection_reason">
                    <br />
                    <small class="rejection-reason">사유: {{ vac.rejection_reason }}</small>
                  </template>
                </td>

                <td>
                  <template v-if="vac.status === '대기'">
                    <button class="btn approve" @click="updateStatus(vac.vacation_id, '승인')">승인</button>
                    <button class="btn reject" @click="openRejectModal(vac.vacation_id)">반려</button>
                  </template>
                  <template v-else>
                    <span class="processed">처리 완료</span>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 오른쪽: AI 결과 -->
        <div class="ai-panel">
          <h3>
            <img :src="aiIcon" alt="AI 아이콘" class="ai-icon" />
            AI 판단 결과
          </h3>

          <div v-if="Array.isArray(aiResults) && aiResults.length > 0">
            <div
              v-for="teamResult in aiResults"
              :key="teamResult.team"
              class="ai-result-card"
            >
              <h4>{{ teamResult.team }}팀</h4>
              <ul>
                <li
                  v-for="p in teamResult.priority"
                  :key="p.name + p.startDate + p.endDate"
                  :class="{
                    'ai-approve': p.recommendation === '승인',
                    'ai-reject': p.recommendation === '반려',
                    'ai-manager-review': p.recommendation === '팀장 판단 필요'
                  }"
                >
                  <strong>{{ p.name }}</strong> → {{ p.recommendation }}
                  <br />
                  <small>{{ p.reason }}</small>
                </li>
              </ul>
              <p class="ai-comment">💬 {{ teamResult.comment }}</p>
            </div>
          </div>

          <div v-else class="ai-empty">
            아직 AI 판단 결과가 없습니다.
          </div>

          <div class="ai-apply-box">
            <h4>AI 추천 자동 적용</h4>
            <button class="btn ai-apply-btn" @click="applyAIResults">
              AI 추천대로 승인/반려 적용하기
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 반려 사유 모달 -->
    <div v-if="showRejectModal" class="modal-overlay">
      <div class="modal">
        <h3>반려 사유 입력</h3>
        <textarea v-model="rejectionReason" placeholder="반려 사유를 입력하세요"></textarea>

        <div class="modal-actions">
          <button class="btn cancel" @click="closeRejectModal">취소</button>
          <button class="btn reject" @click="submitRejection">반려 처리</button>
        </div>
      </div>
    </div>
        </div> <!-- page-wrapper -->
    </div> <!-- layout-body -->
  </div> <!-- manager-layout -->
</template>


<script>
import ManagerSidebar from "@/components/ManagerSidebar.vue";
import ManagerHeader from "@/components/ManagerHeader.vue";
import aiIcon from "@/assets/ai.png";

export default {
  name: "ManagerVacation",
  components: { ManagerSidebar, ManagerHeader },
  data() {
    return {
      vacations: [],
      aiResults: [],
      showRejectModal: false,
      selectedVacationId: null,
      rejectionReason: "",
      aiIcon,
      sidebarOpen: true,   // 🔥 추가
    };
  },

  async created() {
    await this.loadVacations();
    await this.loadAIPredictions();
  },

  computed: {
    /* AI 추천 매핑 (name+기간 → recommendation) */
    aiRecommendationMap() {
      const map = {};
      if (Array.isArray(this.aiResults)) {
        for (const teamResult of this.aiResults) {
          if (!Array.isArray(teamResult.priority)) continue;
          for (const p of teamResult.priority) {
            const key = `${p.name}_${p.startDate}_${p.endDate}`;
            map[key] = p.recommendation;
          }
        }
      }
      return map;
    },

    /* 🔥 우선순위 정렬된 연차 리스트 */
    computedVacations() {
      return this.vacations.slice().sort((a, b) => {
        const keyA = `${a.user?.name}_${a.startDate}_${a.endDate}`;
        const keyB = `${b.user?.name}_${b.startDate}_${b.endDate}`;
        const aRec = this.aiRecommendationMap[keyA] || "기타";
        const bRec = this.aiRecommendationMap[keyB] || "기타";
        const order = { "반려": 0, "팀장 판단 필요": 1, "승인": 2, "기타": 3 };
        return order[aRec] - order[bRec];
      });
    },
  },

  methods: {
    getRowClass(vac) {
      if (vac.status !== "대기") return "";
      const key = `${vac.user?.name}_${vac.startDate}_${vac.endDate}`;
      const rec = this.aiRecommendationMap[key];
      if (rec === "승인") return "ai-row-approve";
      if (rec === "반려") return "ai-row-reject";
      if (rec === "팀장 판단 필요") return "ai-row-manager-review";
      return "";
    },

    async loadVacations() {
      try {
        const res = await this.$axios.get("http://localhost:3000/api/manager/vacations", {
          withCredentials: true,
        });
        if (res.data.success) this.vacations = res.data.vacations;
      } catch (err) {
        console.error("연차 목록 오류:", err);
      }
    },

    async loadAIPredictions() {
      try {
        const today = new Date().toISOString().split("T")[0];
        const res = await this.$axios.post(
          "http://localhost:3000/api/ai/vacations/ai-vacation-priority",
          { targetDate: today },
          { withCredentials: true }
        );
        if (res.data.results) {
          this.aiResults = Array.isArray(res.data.results)
            ? res.data.results
            : [res.data.results];
        }
      } catch (err) {
        console.error("AI 판단 불러오기 오류:", err);
      }
    },

    async updateStatus(vacationId, status) {
      if (!confirm(`해당 연차를 ${status}하시겠습니까?`)) return;
      try {
        const res = await this.$axios.post(
          `http://localhost:3000/api/manager/vacations/${vacationId}/status`,
          { status },
          { withCredentials: true }
        );
        if (res.data.success) {
          alert(res.data.message);
          this.loadVacations();
        }
      } catch (err) {
        console.error("연차 처리 오류:", err);
      }
    },

    openRejectModal(id) {
      this.selectedVacationId = id;
      this.showRejectModal = true;
    },
    closeRejectModal() {
      this.showRejectModal = false;
      this.selectedVacationId = null;
      this.rejectionReason = "";
    },

    async submitRejection() {
      if (!this.rejectionReason.trim()) {
        alert("반려 사유를 입력해주세요.");
        return;
      }
      try {
        const res = await this.$axios.post(
          `http://localhost:3000/api/manager/vacations/${this.selectedVacationId}/status`,
          { status: "반려", rejection_reason: this.rejectionReason },
          { withCredentials: true }
        );
        if (res.data.success) {
          alert("반려 처리 완료");
          this.closeRejectModal();
          this.loadVacations();
        }
      } catch (err) {
        console.error("반려 오류:", err);
      }
    },

    async applyAIResults() {
      try {
        const payload = [];
        for (const teamResult of this.aiResults) {
          for (const p of teamResult.priority) {
            const target = this.vacations.find(
              v =>
                v.user?.name === p.name &&
                v.startDate === p.startDate &&
                v.endDate === p.endDate
            );
            if (target) {
              payload.push({
                name: p.name,
  vacationId: target ? target.vacation_id : null,
  recommendation: p.recommendation,
  reason: p.reason,
              });
            }
          }
        }
        const res = await this.$axios.post(
          "http://localhost:3000/api/manager/vacations/ai-apply",
          { aiResults: payload },
          { withCredentials: true }
        );
        if (res.data.success) {
          alert("AI 추천이 적용되었습니다!");
          this.loadVacations();
        }
      } catch (err) {
        console.error(err);
        alert("서버 오류 발생");
      }
    },
  },
};
</script>

<style scoped>
/* ======================
   🔥 전체 관리자 레이아웃
====================== */
.manager-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* 🔥 최상단 고정 헤더 */
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

/* 🔥 헤더 아래 본문 전체 */
.layout-body {
  margin-top:  60px; /* 헤더 높이만큼 내려줌 */
  display: flex;
}

/* 🔥 페이지 전체 래퍼 (사이드바 포함) */
.page-wrapper {
  display: flex;
  width: 100%;
  transition: margin-left 0.3s ease;
}

/* 🔥 너의 기존 ManagerSidebar 기본 width가 220px이라고 가정 */
.page-wrapper {
  margin-left: 240pxpx;
}

/* 사이드바 숨김 */
.page-wrapper.sidebar-hidden {
  margin-left: 0;
}

/* 하이라이트 색상 */
.ai-row-approve {
  background-color: #e9f7ee !important;
}
.ai-row-reject {
  background-color: #fdecec !important;
}
.ai-row-manager-review {
  background-color: #fef3c7 !important; /* 노란색 */
}

/* 레이아웃 */
.layout-container {
  display: flex;
  gap: 2rem;
  width: 100%;
  justify-content: center;
}
.table-card {
  flex: 2;
  background: white;
  border-radius: 1.5rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  padding: 2rem;
  max-width: 900px;
}
.ai-panel {
  flex: 1;
  background: #ffffff;
  border-radius: 1.5rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  height: fit-content;
}
.ai-result-card {
  border-top: 1px solid #e5e7eb;
  padding-top: 1rem;
  margin-top: 1rem;
}
.ai-approve {
  color: #16a34a;
  font-weight: 600;
}
.ai-reject {
  color: #dc2626;
  font-weight: 600;
}
.ai-manager-review {
  color: #b45309; /* 진한 노랑 */
  font-weight: 600;
}
.ai-comment {
  margin-top: 0.5rem;
  font-style: italic;
  color: #6b7280;
}
.ai-empty {
  color: #9ca3af;
  font-size: 0.9rem;
  text-align: center;
  padding: 2rem 0;
}
.manager-vacation-page {
  min-height: 100vh;
  background-color: #f9fafb;
  display: flex;
  flex-direction: row;
  font-family: "Pretendard", "Noto Sans KR", sans-serif;
}
.content {
  flex: 1;
  padding: 3rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.header {
  text-align: center;
  margin-bottom: 2rem;
}
.header h1 {
  font-size: 2rem;
  color: #1f2937;
  font-weight: 700;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}
th, td {
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  text-align: left;
}
.status.대기 { color: #ca8a04; }
.status.승인 { color: #16a34a; }
.status.반려 { color: #dc2626; }
.btn {
  padding: 0.4rem 0.8rem;
  border: none;
  border-radius: 0.4rem;
  cursor: pointer;
  font-size: 0.85rem;
}
.btn.approve { background-color: #16a34a; color: white; }
.btn.reject { background-color: #dc2626; color: white; }
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
}
.modal {
  background: white;
  padding: 1.5rem;
  border-radius: 0.75rem;
  width: 90%;
  max-width: 400px;
}
.ai-icon {
  width: 40px;
  height: 40px;
  vertical-align: middle;
  margin-right: 6px;
}

</style>
