<template> 

  <div class="manager-vacation-page"> 

    <div class="header"> 

      <h1>연차 승인 관리</h1> 

      <p>직원들의 연차 신청 내역을 확인하고 승인 또는 반려할 수 있습니다.</p> 

    </div> 

 

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

            <td>{{ vac.user?.team || '-' }}</td> 

            <td>{{ vac.startDate }} ~ {{ vac.endDate }}</td> 

            <td>{{ vac.reason }}</td> 

            <td> 

              <span :class="'status ' + vac.status">{{ vac.status }}</span> 

 

                <!-- ✅ 반려 사유 출력 --> 

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

export default {

  name: "ManagerVacation",

  data() {

    return {

      vacations: [],

      showRejectModal: false,

      selectedVacationId: null,

      rejectionReason: "",

    };

  },

  async created() {

    await this.loadVacations();

  },

  methods: {

    async loadVacations() {

      try {

        const res = await this.$axios.get("http://localhost:3000/api/manager/vacations");

        if (res.data.success) {

          this.vacations = res.data.vacations;

        } else {

          alert("데이터 불러오기 실패: " + res.data.message);

        }

      } catch (err) {

        console.error("연차 목록 불러오기 오류:", err);

      }

    },


    async updateStatus(vacationId, status) {

      if (!confirm(`해당 연차를 ${status}하시겠습니까?`)) return;

      try {

        const res = await this.$axios.post(

          `http://localhost:3000/api/manager/vacations/${vacationId}/status`,

          { status }

        );

        if (res.data.success) {

          alert(res.data.message);

          this.loadVacations();

        } else {

          alert("처리 실패: " + res.data.message);

        }

      } catch (err) {

        console.error("연차 처리 오류:", err);

      }

    },


    openRejectModal(vacationId) {

      this.selectedVacationId = vacationId;

      this.rejectionReason = "";

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

          {

            status: "반려",

            rejection_reason: this.rejectionReason,

          }

        );


        if (res.data.success) {

          alert("반려 처리 완료");

          this.closeRejectModal();

          this.loadVacations();

        } else {

          alert("처리 실패: " + res.data.message);

        }

      } catch (err) {

        console.error("반려 처리 오류:", err);

      }

    },

  },

};

</script> 

 

<style scoped> 

.manager-vacation-page { 

  min-height: 100vh; 

  background-color: #f9fafb; 

  padding: 3rem 1rem; 

  display: flex; 

  flex-direction: column; 

  align-items: center; 

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

 

.table-card { 

  background: white; 

  border-radius: 1.5rem; 

  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05); 

  padding: 2rem; 

  width: 100%; 

  max-width: 900px; 

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

 

/* 버튼 */ 

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

 

 

</style> 