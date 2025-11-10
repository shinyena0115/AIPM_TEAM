<template>
  <div class="vacation-page">
    <div class="header">
      <h1>연차 신청</h1>
      <p>근무일정 및 연차 내역을 확인하고 신청하세요.</p>
    </div>

    <!-- ✅ 연차 현황 확인하기 버튼 -->
    <div class="vacation-status-btn-box">
      <button class="vacation-status-btn" @click="$router.push('/employee/vacation-status')">
        연차 현황 확인하기
      </button>
    </div>

    <!-- 연차 신청 폼 -->
    <div class="form-card">
      <h2>새 연차 신청</h2>

      <div class="form-grid">
        <div class="form-group">
          <label>시작일</label>
          <input v-model="form.startDate" type="date" />
        </div>

        <div class="form-group">
          <label>종료일</label>
          <input v-model="form.endDate" type="date" />
        </div>
      </div>

      <div class="form-group">
        <label>사유</label>
        <textarea
          v-model="form.reason"
          placeholder="예: 가족행사, 휴식 등"
        ></textarea>
      </div>

      <button @click="submitVacation" class="submit-btn">연차 신청하기</button>
    </div>

    <!-- ✅ 연차 신청 내역 -->
    <div class="list-card">
      <h2>📋 연차 신청 내역</h2>

      <table>
        <thead>
          <tr>
            <th>신청일</th>
            <th>기간</th>
            <th>사유</th>
            <th>상태</th>
            <th>반려 사유</th> <!-- ✅ 추가 -->
          </tr>
        </thead>
        <tbody>
          <tr v-for="vac in vacations" :key="vac.vacation_id">
            <td>{{ formatDate(vac.createdAt) }}</td>
            <td>{{ vac.startDate }} ~ {{ vac.endDate }}</td>
            <td>{{ vac.reason }}</td>
            <td>
              <span :class="'status ' + vac.status">{{ vac.status }}</span>
            </td>
            <td>
              <!-- ✅ 반려일 때만 사유 표시 -->
              <span v-if="vac.status === '반려'">{{ vac.rejection_reason || '-' }}</span>
              <span v-else>-</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "EmployeeVacation",
  data() {
    return {
      form: {
        startDate: "",
        endDate: "",
        reason: "",
      },
      vacations: [],
    };
  },
  async created() {
    await this.loadVacations();
  },
  methods: {
    async loadVacations() {
      try {
        const response = await axios.get("http://localhost:3000/api/vacations/me", {
          withCredentials: true,
        });
        if (response.data.success) {
          this.vacations = response.data.vacations;
        }
      } catch (err) {
        console.error("연차 내역 불러오기 실패:", err);
      }
    },
    async submitVacation() {
      if (!this.form.startDate || !this.form.endDate || !this.form.reason) {
        alert("모든 항목을 입력해주세요.");
        return;
      }

      try {
        const response = await axios.post("http://localhost:3000/api/vacations", this.form, {
          withCredentials: true,
        });

        if (response.data.success) {
          alert("연차 신청이 완료되었습니다!");
          this.form = { startDate: "", endDate: "", reason: "" };
          this.loadVacations();
        } else {
          alert("연차 신청 실패: " + response.data.message);
        }
      } catch (err) {
        console.error("연차 신청 실패:", err);
      }
    },
    formatDate(date) {
      return new Date(date).toLocaleDateString();
    },
  },
};
</script>

<style scoped>
.vacation-page {
  min-height: 100vh;
  background-color: #f9fafb;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem 1rem;
  font-family: "Pretendard", "Noto Sans KR", sans-serif;
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

.vacation-status-btn-box {
  margin: 20px 0;
  text-align: left;
}

.vacation-status-btn {
  background-color: #4caf50;
  color: white;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.3s;
}

.vacation-status-btn:hover {
  background-color: #45a049;
}

.form-card,
.list-card {
  background: white;
  border-radius: 1.5rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  padding: 2rem;
  width: 100%;
  max-width: 800px;
  margin-bottom: 2rem;
}

.form-card h2,
.list-card h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

input,
textarea {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 0.6rem 0.8rem;
  font-size: 0.95rem;
}

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

.submit-btn {
  background-color: #10b981;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.6rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s;
}

.submit-btn:hover {
  background-color: #059669;
}

/* 📋 Table Style */
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
</style>