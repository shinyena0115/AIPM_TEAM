<template> 

  <div class="admin-layout"> 

    <!-- ✅ 왼쪽 관리자 사이드바 --> 

    <AdminSidebar /> 

 

    <!-- ✅ 메인 컨텐츠 영역 --> 

    <div class="page-container"> 

      <header class="header"> 

        <h1>부서 및 팀 관리</h1> 

        <button class="add-btn" @click="showDeptModal = true">부서 등록하기</button> 

      </header> 

 

      <main class="main-content"> 

        <div class="department-card" v-for="dep in departments" :key="dep.id"> 

          <div class="info"> 

            <span class="name">🏢 {{ dep.name }}</span> 

            <button class="delete-btn" @click="deleteDepartment(dep)">삭제</button> 

          </div> 

 

          <!-- 팀 목록 --> 

          <ul class="team-list"> 

            <li v-for="team in dep.Teams" :key="team.id"> 

              • {{ team.name }} 

              <button class="team-del" @click="deleteTeam(team.id)">x</button> 

            </li> 

          </ul> 

 

          <button class="add-team-btn" @click="openTeamModal(dep)">+ 팀 추가</button> 

        </div> 

      </main> 

 

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

  </div> 

</template> 

 

<script> 

import AdminSidebar from "@/components/AdminSidebar.vue"; 

 

export default { 

  name: "DepartmentTeamManage", 

  components: { AdminSidebar }, 

  data() { 

    return { 

      departments: [], 

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

      if (!this.newTeamName.trim() || !this.selectedDept) return; 

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

.admin-layout { 

  display: flex; 

  min-height: 100vh; 

  background: #f9fafb; 

  font-family: 'Pretendard', sans-serif; 

} 

 

.page-container { 

  flex: 1; 

  padding: 48px 60px; 

  overflow-y: auto; 

} 

 

.header { 

  display: flex; 

  justify-content: space-between; 

  align-items: center; 

  margin-bottom: 32px; 

} 

.header h1 { 

  font-size: 1.6rem; 

  font-weight: 700; 

  color: #111827; 

} 

.add-btn { 

  background: #2563eb; 

  color: #fff; 

  border: none; 

  border-radius: 8px; 

  padding: 9px 16px; 

  font-size: 0.9rem; 

  font-weight: 600; 

  cursor: pointer; 

  transition: 0.2s; 

} 

.add-btn:hover { 

  background: #1e40af; 

} 

 

/* ✅ 부서 카드 - 플랫하고 깔끔하게 */ 

.department-card { 

  background: #ffffff; 

  border: 1px solid #e5e7eb; 

  border-radius: 10px; 

  padding: 20px 22px; 

  margin-bottom: 16px; 

  transition: 0.15s ease; 

} 

.department-card:hover { 

  border-color: #cbd5e1; 

  background: #fdfdfd; 

} 

 

.info { 

  display: flex; 

  justify-content: space-between; 

  align-items: center; 

  margin-bottom: 10px; 

} 

.name { 

  font-size: 1rem; 

  font-weight: 600; 

  color: #1f2937; 

} 

.delete-btn { 

  background: none; 

  border: none; 

  color: #ef4444; 

  font-size: 0.9rem; 

  cursor: pointer; 

  transition: 0.15s; 

} 

.delete-btn:hover { 

  text-decoration: underline; 

} 

 

/* ✅ 팀 리스트 */ 

.team-list { 

  list-style: none; 

  padding-left: 0; 

  margin-top: 10px; 

} 

.team-list li { 

  display: flex; 

  justify-content: space-between; 

  align-items: center; 

  padding: 6px 10px; 

  margin-bottom: 6px; 

  border: 1px solid #e5e7eb; 

  border-radius: 6px; 

  background: #f9fafb; 

  font-size: 0.9rem; 

  color: #374151; 

} 

.team-del { 

  color: #ef4444; 

  border: none; 

  background: none; 

  cursor: pointer; 

  font-size: 0.9rem; 

  transition: 0.15s; 

} 

.team-del:hover { 

  color: #b91c1c; 

} 

 

.add-team-btn { 

  margin-top: 8px; 

  background: #f3f4f6; 

  border: 1px solid #d1d5db; 

  color: #374151; 

  border-radius: 6px; 

  padding: 6px 10px; 

  cursor: pointer; 

  font-size: 0.85rem; 

  font-weight: 500; 

  transition: 0.2s; 

} 

.add-team-btn:hover { 

  background: #e5e7eb; 

  color: #111827; 

} 

 

/* ✅ 모달 */ 

.modal { 

  position: fixed; 

  inset: 0; 

  background: rgba(0,0,0,0.4); 

  display: flex; 

  justify-content: center; 

  align-items: center; 

  z-index: 100; 

} 

.modal-content { 

  background: white; 

  border-radius: 12px; 

  padding: 28px; 

  min-width: 320px; 

  box-shadow: 0 8px 24px rgba(0,0,0,0.1); 

} 

.modal-content h2 { 

  font-size: 1.1rem; 

  font-weight: 700; 

  color: #111827; 

  margin-bottom: 12px; 

} 

.modal-content input { 

  width: 100%; 

  padding: 8px 10px; 

  border: 1px solid #d1d5db; 

  border-radius: 6px; 

  font-size: 0.9rem; 

  outline: none; 

} 

.modal-content input:focus { 

  border-color: #2563eb; 

} 

.modal-buttons { 

  margin-top: 16px; 

  display: flex; 

  justify-content: flex-end; 

  gap: 8px; 

} 

.modal-buttons button { 

  border: none; 

  border-radius: 6px; 

  padding: 8px 12px; 

  font-weight: 600; 

  cursor: pointer; 

  font-size: 0.9rem; 

} 

.modal-buttons button:first-child { 

  background: #2563eb; 

  color: #fff; 

} 

.modal-buttons button:first-child:hover { 

  background: #1e40af; 

} 

.modal-buttons button:last-child { 

  background: #e5e7eb; 

  color: #374151; 

} 

.modal-buttons button:last-child:hover { 

  background: #d1d5db; 

} 

</style> 