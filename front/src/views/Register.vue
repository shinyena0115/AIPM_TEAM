<template> 
  <div class="register-page"> 
    <h1>직원 회원가입</h1> 
    <form @submit.prevent="submitForm" class="register-form"> 
      <input v-model="form.name" type="text" placeholder="이름" required /> 
      <input v-model="form.email" type="email" placeholder="이메일" required /> 
      <input v-model="form.password" type="password" placeholder="비밀번호" required /> 
      <select v-model="form.department_id" @change="filterTeams" required> 
        <option value="">부서를 선택하세요</option> 
        <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option> 
      </select> 
      <select v-model="form.team_id" :disabled="!filteredTeams.length"> 
        <option value="">팀 선택</option> 
        <option v-for="t in filteredTeams" :key="t.id" :value="t.id">{{ t.name }}</option> 
      </select> 
      <button type="submit" class="submit-btn">회원가입</button> 
    </form> 
  </div> 
</template> 

<script> 
import axios from "axios"; 
export default { 
  name: "Register", 
  data() { 
    return { 
      departments: [], 
      filteredTeams: [], 
      form: { 
        name: "", 
        email: "", 
        password: "", 
        department_id: "", 
        team_id: "", 
      }, 
    }; 
  }, 

  async mounted() { 
    const res = await axios.get("/api/register/options"); 
    if (res.data.success) this.departments = res.data.departments; 
  }, 

  methods: { 
    filterTeams() { 
      const selected = this.departments.find((d) => d.id === this.form.department_id); 
      this.filteredTeams = selected ? selected.Teams : []; 
      this.form.team_id = ""; 
    }, 

    async submitForm() { 
      if (!this.form.name || !this.form.email || !this.form.password) { 
        return alert("모든 필드를 입력해주세요."); 
      } 

      try { 
        const res = await axios.post("/api/register", this.form); 
        if (res.data.success) { 
          alert("회원가입 신청이 완료되었습니다."); 
          this.$router.push("/login"); 
        } else { 
          alert("회원가입 실패: " + res.data.message); 
        } 
      } catch (err) { 
        console.error(err); 
        alert("서버 오류가 발생했습니다."); 
      } 
    }, 
  }, 
}; 

</script> 
<style scoped> 

.register-page { 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  padding: 60px 20px; 
  background: #f8fafc; 
  min-height: 100vh; 
} 

h1 { 
  color: #2c3e50; 
  font-size: 1.8rem; 
  margin-bottom: 30px; 
} 

.register-form { 
  display: flex; 
  flex-direction: column; 
  gap: 14px; 
  background: white; 
  padding: 30px; 
  border-radius: 10px; 
  box-shadow: 0 3px 10px rgba(0,0,0,0.1); 
  width: 360px; 
} 

.register-form input, 
.register-form select { 
  padding: 12px; 
  border: 1px solid #ccc; 
  border-radius: 8px; 
  font-size: 0.95rem; 
} 

.submit-btn { 
  background: #007bff; 
  color: white; 
  padding: 12px; 
  border: none; 
  border-radius: 8px; 
  cursor: pointer; 
  font-weight: 600; 
  transition: 0.2s; 
} 

.submit-btn:hover { 
  background: #0056b3; 
} 
</style> 