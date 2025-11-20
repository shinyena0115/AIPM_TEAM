<template>
  <div class="employee-layout">
    <!-- ✅ 상단 고정 헤더 -->
    <EmployeeHeader class="header-fixed" @toggle-sidebar="toggleSidebar" />

    <!-- ✅ 사이드바 + 메인 콘텐츠 -->
    <div class="content-area">
      <!-- ✅ 왼쪽 사이드바 -->
      <EmployeeSidebar v-show="showSidebar" class="sidebar" />

      <!-- ✅ 오른쪽 메인 영역 -->
      <div class="main-content" :class="{ 'sidebar-hidden': !showSidebar }">
        <!-- ✅ 상단 네비게이션 -->
        <div class="page-nav">
          <button
            @click="$router.push('/employee/vacation')"
            :class="['nav-btn', { active: $route.path === '/employee/vacation' }]"
          >
            연차 신청
          </button>
          <button
            @click="$router.push('/employee/vacation-status')"
            :class="['nav-btn', { active: $route.path === '/employee/vacation-status' }]"
          >
            연차 현황
          </button>
          <button
            @click="$router.push('/employee/vacation-notice')"
            :class="['nav-btn', { active: $route.path === '/employee/vacation-notice' }]"
          >
            연차 게시판
          </button>
        </div>

        <!-- ✅ 연차 게시판 페이지 -->
        <div class="vacation-notice-page">
          <div class="header">
            <h1>연차자 업무 전달 게시판</h1>
            <p>연차 간 동료를 위해 업무 전달 메모를 남기고, 내가 받은 메모를 확인하세요</p>
          </div>

          <!-- ① 업무 전달 메모 작성 -->
          <div class="card">
            <h2>📝 업무 전달 메모 작성</h2>

            <div class="info-box">
              <p>
                동료가 연차로 자리를 비운 동안 그 동료에게 전달된 업무가 있다면 메모로 남겨주세요.<br />
                복귀한 동료가 확인할 수 있습니다.
              </p>
            </div>

            <div class="form-group">
              <label>연차 간 동료 선택:</label>
              <div style="display: flex; gap: 8px; margin-bottom: 0.5rem;">
                <button
                  type="button"
                  @click="filterVacationOnly = false"
                  :class="['filter-btn', { active: !filterVacationOnly }]"
                >
                  전체 동료
                </button>
                <button
                  type="button"
                  @click="filterVacationOnly = true"
                  :class="['filter-btn', { active: filterVacationOnly }]"
                >
                  🏖️ 연차중만 보기
                </button>
              </div>
              <select v-model="selectedLeaver" class="form-select">
                <option value="">-- 연차자를 선택하세요 --</option>
                <option
                  v-for="user in filteredTeamMembers"
                  :key="user.user_id"
                  :value="user.user_id"
                >
                  {{ user.vacation_status === '연차중' ? '🏖️ ' : '' }}{{ user.name }} ({{ user.email }}){{ user.vacation_status === '연차중' ? ' - 연차중' : '' }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>연차 날짜:</label>
              <input
                v-model="leaveDate"
                type="date"
                placeholder="2025-11-05"
              />
            </div>

            <div class="form-group">
              <label>전달받은 업무 내용:</label>
              <textarea
                v-model="messageText"
                rows="4"
                placeholder="예: 김철수 과장님께서 전화하셔서 내일 회의 일정 변경 요청하셨습니다."
              ></textarea>
            </div>

            <button :disabled="busy" class="btn-primary" @click="submitMessage">
              메모 등록
            </button>
          </div>

          <!-- ② 내가 받은 업무 전달 -->
          <div class="card">
            <h2>📬 내가 받은 업무 전달 (연차 복귀 시 확인)</h2>

            <div style="display: flex; gap: 8px; align-items: flex-end; margin-bottom: 1rem;">
              <div class="form-group" style="margin: 0; flex: 1; max-width: 200px;">
                <label>날짜 필터:</label>
                <input
                  v-model="queryReceivedDate"
                  type="date"
                  placeholder="전체 조회"
                />
              </div>
              <button :disabled="busy" class="btn-secondary" @click="loadReceivedMessages">
                불러오기
              </button>
            </div>

            <ul v-if="receivedMessages.length > 0">
              <li v-for="msg in receivedMessages" :key="msg.id">
                <div class="message-header">
                  <span class="message-date">📅 {{ msg.leave_date }}</span>
                  <span v-if="msg.Author" class="message-author">
                    작성자: {{ msg.Author.name }}
                  </span>
                </div>
                <div class="message-content">{{ msg.text }}</div>
                <div class="message-time">등록: {{ formatDateTime(msg.createdAt) }}</div>
              </li>
            </ul>
            <p v-else class="tip">받은 업무 전달 메모가 없습니다.</p>
          </div>

          <!-- ③ 내가 작성한 업무 전달 -->
          <div class="card">
            <h2>📤 내가 작성한 업무 전달</h2>

            <div style="display: flex; gap: 8px; align-items: flex-end; margin-bottom: 1rem;">
              <div class="form-group" style="margin: 0; flex: 1; max-width: 200px;">
                <label>날짜 필터:</label>
                <input
                  v-model="querySentDate"
                  type="date"
                  placeholder="전체 조회"
                />
              </div>
              <button :disabled="busy" class="btn-secondary" @click="loadSentMessages">
                불러오기
              </button>
            </div>

            <ul v-if="sentMessages.length > 0">
              <li v-for="msg in sentMessages" :key="msg.id">
                <div class="message-header">
                  <span class="message-date">📅 {{ msg.leave_date }}</span>
                  <span v-if="msg.Leaver" class="message-recipient">
                    수신자: {{ msg.Leaver.name }}
                  </span>
                </div>
                <div class="message-content">{{ msg.text }}</div>
                <div class="message-actions">
                  <button
                    :disabled="busy"
                    class="btn-edit"
                    @click="startEdit(msg)"
                  >
                    편집
                  </button>
                  <button
                    :disabled="busy"
                    class="btn-delete"
                    @click="deleteMessage(msg.id)"
                  >
                    삭제
                  </button>
                </div>
              </li>
            </ul>
            <p v-else class="tip">작성한 업무 전달 메모가 없습니다.</p>

            <!-- 편집 폼 -->
            <div v-if="editingMessage" class="edit-box">
              <h4>메모 편집</h4>
              <div class="form-group">
                <label>연차 날짜:</label>
                <input
                  v-model="editLeaveDate"
                  type="date"
                />
              </div>
              <div class="form-group">
                <label>메모 내용:</label>
                <textarea
                  v-model="editText"
                  rows="4"
                  placeholder="메모 내용을 수정하세요"
                ></textarea>
              </div>
              <div style="display: flex; gap: 8px;">
                <button :disabled="busy" class="btn-primary" @click="saveEdit">
                  저장
                </button>
                <button :disabled="busy" class="btn-secondary" @click="cancelEdit">
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import EmployeeSidebar from '@/components/EmployeeSidebar.vue';
import EmployeeHeader from '@/components/EmployeeHeader.vue';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default {
  name: 'VacationNotice',
  components: {
    EmployeeSidebar,
    EmployeeHeader
  },
  data() {
    return {
      busy: false,
      showSidebar: true,
      currentUser: null,
      teamMembers: [],

      // 메모 작성
      selectedLeaver: '',
      leaveDate: '',
      messageText: '',
      filterVacationOnly: false,

      // 받은 메모
      queryReceivedDate: '',
      receivedMessages: [],

      // 보낸 메모
      querySentDate: '',
      sentMessages: [],

      // 편집
      editingMessage: null,
      editLeaveDate: '',
      editText: '',
    };
  },
  computed: {
    filteredTeamMembers() {
      if (this.filterVacationOnly) {
        return this.teamMembers.filter(user => user.vacation_status === '연차중');
      }
      return this.teamMembers;
    }
  },
  async mounted() {
    if (window.innerWidth <= 1024) {
      this.showSidebar = false;
    }

    await this.loadCurrentUser();
    await this.loadTeamMembers();
  },
  methods: {
    toggleSidebar() {
      this.showSidebar = !this.showSidebar;
    },

    async loadCurrentUser() {
      try {
        const response = await this.$axios.get('http://localhost:3000/api/info', {
          withCredentials: true,
        });
        if (response.data.isLogin) {
          this.currentUser = response.data.user;
        } else {
          this.$router.push('/login');
        }
      } catch (error) {
        console.error('사용자 정보 불러오기 실패:', error);
        this.$router.push('/login');
      }
    },

    async loadTeamMembers() {
      if (!this.currentUser) return;

      try {
        const response = await this.$axios.get(
          'http://localhost:3000/api/vacation-notice/team-members',
          { withCredentials: true }
        );
        this.teamMembers = response.data.filter(
          user => user.user_id !== this.currentUser.user_id
        );
      } catch (error) {
        console.error('팀원 목록 불러오기 실패:', error);
      }
    },

    alertErr(e, fallback = '요청 실패') {
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        e?.message ||
        fallback;
      alert(msg);
    },

    formatDateTime(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleString('ko-KR');
    },

    // ================= 메모 작성 =================
    async submitMessage() {
      if (!this.selectedLeaver) {
        return alert('연차 간 동료를 선택하세요');
      }
      if (!DATE_RE.test(this.leaveDate)) {
        return alert('연차 날짜를 선택하세요');
      }
      if (!this.messageText.trim()) {
        return alert('전달할 업무 내용을 입력하세요');
      }

      this.busy = true;
      try {
        await this.$axios.post(
          'http://localhost:3000/api/vacation-notice/messages',
          {
            leaverId: this.selectedLeaver,
            leaveDate: this.leaveDate,
            text: this.messageText,
          },
          { withCredentials: true }
        );
        alert('메모가 등록되었습니다');
        this.selectedLeaver = '';
        this.leaveDate = '';
        this.messageText = '';
        await this.loadSentMessages();
      } catch (e) {
        this.alertErr(e);
      } finally {
        this.busy = false;
      }
    },

    // ================= 받은 메모 =================
    async loadReceivedMessages() {
      this.busy = true;
      try {
        const res = await this.$axios.get(
          'http://localhost:3000/api/vacation-notice/received',
          {
            params: {
              leaveDate: this.queryReceivedDate || undefined,
            },
            withCredentials: true,
          }
        );
        this.receivedMessages = res.data;
      } catch (e) {
        this.alertErr(e);
      } finally {
        this.busy = false;
      }
    },

    // ================= 보낸 메모 =================
    async loadSentMessages() {
      this.busy = true;
      try {
        const res = await this.$axios.get(
          'http://localhost:3000/api/vacation-notice/sent',
          {
            params: {
              leaveDate: this.querySentDate || undefined,
            },
            withCredentials: true,
          }
        );
        this.sentMessages = res.data;
      } catch (e) {
        this.alertErr(e);
      } finally {
        this.busy = false;
      }
    },

    // ================= 편집 =================
    startEdit(msg) {
      this.editingMessage = msg;
      this.editLeaveDate = msg.leave_date;
      this.editText = msg.text;
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    },

    cancelEdit() {
      this.editingMessage = null;
      this.editLeaveDate = '';
      this.editText = '';
    },

    async saveEdit() {
      if (!this.editingMessage) return;
      if (!DATE_RE.test(this.editLeaveDate)) {
        return alert('올바른 날짜를 입력하세요');
      }

      this.busy = true;
      try {
        await this.$axios.put(
          `http://localhost:3000/api/vacation-notice/messages/${this.editingMessage.id}`,
          {
            leaveDate: this.editLeaveDate,
            text: this.editText,
          },
          { withCredentials: true }
        );
        alert('수정되었습니다');
        await this.loadSentMessages();
        this.cancelEdit();
      } catch (e) {
        this.alertErr(e);
      } finally {
        this.busy = false;
      }
    },

    async deleteMessage(id) {
      if (!confirm('이 메모를 삭제하시겠습니까?')) return;

      this.busy = true;
      try {
        await this.$axios.delete(
          `http://localhost:3000/api/vacation-notice/messages/${id}`,
          { withCredentials: true }
        );
        alert('삭제되었습니다');
        await this.loadSentMessages();
      } catch (e) {
        this.alertErr(e);
      } finally {
        this.busy = false;
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

.content-area {
  display: flex;
  margin-top: 64px;
  min-height: calc(100vh - 64px);
}

.sidebar {
  position: fixed;
  top: 64px;
  left: 0;
  width: 240px;
  height: calc(100vh - 64px);
  background-color: #fff;
  border-right: 1px solid #e5e7eb;
  box-shadow: 2px 0 6px rgba(0, 0, 0, 0.05);
  z-index: 20;
  transition: all 0.3s ease;
}

.main-content {
  flex: 1;
  margin-left: 240px;
  padding: 2rem;
  transition: all 0.3s ease;
}

.main-content.sidebar-hidden {
  margin-left: 0;
}

/* ===== 네비게이션 ===== */
.page-nav {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.8rem;
}

.nav-btn {
  background-color: transparent;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 0.45rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-btn:hover,
.nav-btn.active {
  background-color: #10b981;
  border-color: #10b981;
  color: white;
}

/* ===== 본문 ===== */
.vacation-notice-page {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
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
  font-size: 0.95rem;
}

/* ===== 카드 ===== */
.card {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  padding: 2rem;
  margin-bottom: 2rem;
}

.card h2 {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: #1f2937;
}

.card h4 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #374151;
}

/* ===== 폼 그룹 ===== */
.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.form-group input,
.form-group textarea,
.form-select {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 0.6rem 0.8rem;
  font-size: 0.95rem;
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
}

.info-box {
  background-color: #f0f9ff;
  border-left: 4px solid #3b82f6;
  padding: 1rem;
  margin-bottom: 1.5rem;
  border-radius: 0.5rem;
}

.info-box p {
  color: #1e40af;
  font-size: 0.9rem;
  line-height: 1.6;
  margin: 0;
}

.edit-box {
  margin-top: 1.5rem;
  padding: 1.5rem;
  border: 2px solid #10b981;
  border-radius: 0.75rem;
  background-color: #f0fdf4;
}

.tip {
  color: #9ca3af;
  font-size: 0.9rem;
  text-align: center;
  padding: 2rem;
}

/* ===== 메시지 리스트 ===== */
ul {
  list-style: none;
  padding: 0;
}

li {
  background: #ffffff;
  padding: 1rem;
  border-radius: 0.75rem;
  margin-bottom: 0.75rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #f3f4f6;
}

.message-date {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.95rem;
}

.message-author,
.message-recipient {
  color: #6b7280;
  font-size: 0.85rem;
}

.message-content {
  white-space: pre-wrap;
  line-height: 1.6;
  color: #374151;
  margin-bottom: 0.5rem;
  padding: 0.75rem;
  background-color: #f9fafb;
  border-radius: 0.5rem;
}

.message-time {
  font-size: 0.8rem;
  color: #9ca3af;
  text-align: right;
}

.message-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid #f3f4f6;
}

/* ===== 버튼 ===== */
.btn-primary,
.btn-secondary,
.btn-edit,
.btn-delete {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.btn-primary {
  background-color: #10b981;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #059669;
}

.btn-secondary {
  background-color: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #4b5563;
}

.btn-edit {
  padding: 0.4rem 0.75rem;
  font-size: 0.85rem;
  background-color: #3b82f6;
  color: white;
}

.btn-edit:hover:not(:disabled) {
  background-color: #2563eb;
}

.btn-delete {
  padding: 0.4rem 0.75rem;
  font-size: 0.85rem;
  background-color: #ef4444;
  color: white;
}

.btn-delete:hover:not(:disabled) {
  background-color: #dc2626;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ===== 필터 버튼 ===== */
.filter-btn {
  padding: 0.4rem 0.8rem;
  border-radius: 0.4rem;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid #d1d5db;
  background-color: white;
  color: #374151;
  transition: all 0.2s ease;
}

.filter-btn:hover {
  border-color: #10b981;
  color: #10b981;
}

.filter-btn.active {
  background-color: #10b981;
  border-color: #10b981;
  color: white;
}
</style>
