<template>
  <div class="manager-vacation-page">
    <!-- ✅ 사이드바 -->
    <ManagerSidebar />

    <!-- ✅ 메인 컨텐츠 -->
    <div class="content">
      <div class="header">
        <h1>연차 승인 관리</h1>
        <p>직원들의 연차 신청 내역을 확인하고 승인 또는 반려할 수 있습니다.</p>
      </div>

      <div class="layout-container">
        <!-- ✅ 왼쪽: 연차 테이블 -->
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
              <tr v-for="vac in vacations" :key="vac.vacation_id">
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

        <!-- ✅ 오른쪽: AI 판단 결과 -->
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
                  :key="p.name"
                  :class="p.recommendation === '승인' ? 'ai-approve' : 'ai-reject'"
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
        </div>
      </div>
    </div>

    <!-- ✅ 반려 사유 모달 -->
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
  </div>
</template>

<script>
import axios from "axios";
import ManagerSidebar from "@/components/ManagerSidebar.vue";
import aiIcon from "@/assets/ai.png";
export default {
  name: "ManagerVacation",
  components: { ManagerSidebar },
  data() {
    return {
      vacations: [],
      aiResults: [], // ✅ 기본값: 빈 배열
      showRejectModal: false,
      selectedVacationId: null,
      rejectionReason: "",
       aiIcon, 
    };
  },
  async created() {
    await this.loadVacations();
    await this.loadAIPredictions();
  },
  methods: {
    // ✅ 연차 목록 불러오기
    async loadVacations() {
      try {
        const res = await axios.get("http://localhost:3000/api/manager/vacations", {
          withCredentials: true,
        });
        if (res.data.success) {
          this.vacations = res.data.vacations;
        }
      } catch (err) {
        console.error("연차 목록 불러오기 오류:", err);
      }
    },

    // ✅ AI 판단 결과 가져오기 (조건 수정 ✅)
    async loadAIPredictions() {
      try {
        const today = new Date().toISOString().split("T")[0];
        const res = await axios.post(
          "http://localhost:3000/api/ai/vacations/ai-vacation-priority",
          { targetDate: today },
          { withCredentials: true }
        );

        // ✅ success 없어도 results만 있으면 처리되게 수정
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
        const res = await axios.post(
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

    openRejectModal(vacationId) {
      this.selectedVacationId = vacationId;
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
        const res = await axios.post(
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
        console.error("반려 처리 오류:", err);
      }
    },
  },
};
</script>

<style scoped>
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

/* ✅ 오른쪽 AI 패널 */
.ai-panel {
  flex: 1;
  background: #ffffff;
  border-radius: 1.5rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  height: fit-content;
}

.ai-panel h3 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: #1f2937;
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

.header p {
  color: #6b7280;
  margin-top: 0.5rem;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

th,
td {
  padding: 0.75rem;
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

/* 버튼 스타일 */
.btn {
  padding: 0.4rem 0.8rem;
  border: none;
  border-radius: 0.4rem;
  cursor: pointer;
  font-size: 0.85rem;
  transition: 0.2s;
}

.btn.approve {
  background-color: #16a34a;
  color: white;
}

.btn.approve:hover {
  background-color: #15803d;
}

.btn.reject {
  background-color: #dc2626;
  color: white;
  margin-left: 0.4rem;
}

.btn.reject:hover {
  background-color: #b91c1c;
}

.btn.cancel {
  background-color: #9ca3af;
  color: white;
}

.btn.cancel:hover {
  background-color: #6b7280;
}

.processed {
  color: #6b7280;
  font-style: italic;
}

/* 상태 색상 */
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

/* ✅ 반려 사유 모달 */
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
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.modal h3 {
  margin-bottom: 1rem;
  font-size: 1.2rem;
  color: #111827;
}

textarea {
  width: 100%;
  height: 100px;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 0.5rem;
  resize: none;
  font-family: inherit;
}

.modal-actions {
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.rejection-reason {
  color: #6b7280;
  font-size: 0.85rem;
  font-style: italic;
}
.ai-icon {
  width: 40px;
  height: 40px;
  vertical-align: middle;
  margin-right: 6px;
}

</style>
