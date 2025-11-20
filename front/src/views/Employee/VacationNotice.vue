<template>
  <div style="padding: 20px; max-width: 900px; margin: 0 auto">
    <h1>연차 게시판</h1>

    <!-- 현재 사용자 (문자열) + 로그아웃 -->
    <fieldset style="margin:16px 0; padding:12px;">
      <legend>현재 사용자</legend>
      <label>현재 사용자 ID:
        <input
          v-model="uidInput"
          type="text"
          placeholder="예: sungsjae01 또는 이메일"
          style="width:240px; margin-left:8px;"
        />
      </label>
      <button :disabled="busy" style="margin-left:8px" @click="saveUid">
        저장
      </button>
      <button :disabled="busy || !isLoggedIn" style="margin-left:8px" @click="logout">
        로그아웃
      </button>
      <span style="margin-left:8px; color:#666">
        (지금은 임시 ID 저장 → 나중엔 로그인 토큰으로 자동 전환)
      </span>
      <button :disabled="busy" style="margin-left:8px" @click="resetAll">
        전체 초기화
      </button>
    </fieldset>

    <hr />

    <!-- 기능 1: 개인 복귀 업무 -->
    <section style="margin-top:20px;">
      <h2>① 개인 복귀 업무 (본인만 열람)</h2>

      <div style="display:flex; gap:8px; align-items:flex-start; flex-wrap:wrap;">
        <label>대상 날짜(YYYY-MM-DD):
          <input
            v-model="todoDate"
            placeholder="2025-11-04"
            style="width:140px; margin-left:6px;"
          />
        </label>
        <textarea
          v-model="todoText"
          rows="3"
          cols="60"
          placeholder="다음날 해야 할 일을 적어주세요"
        ></textarea>
        <button :disabled="busy || !isLoggedIn" @click="saveTodo">
          저장/수정
        </button>
        <button :disabled="busy || !isLoggedIn" @click="loadTodos">
          내 목록 불러오기
        </button>
      </div>

      <ul style="margin-top:12px;">
        <li
          v-for="t in todos"
          :key="t.ownerId + t.forDate + t.updatedAt"
          style="margin-bottom:6px;"
        >
          <b>{{ t.forDate }}</b>
          — <span style="white-space:pre-wrap">{{ t.content }}</span>
          <button
            :disabled="busy || !isLoggedIn"
            style="margin-left:8px"
            @click="prefillTodo(t)"
          >
            편집
          </button>
          <button
            :disabled="busy || !isLoggedIn"
            style="margin-left:4px"
            @click="deleteTodo(t.forDate)"
          >
            삭제
          </button>
        </li>
      </ul>
    </section>

    <hr />

    <!-- 기능 2: 업무 대체자 게시판 -->
    <section style="margin-top:20px;">
      <h2>② 업무 대체자 게시판</h2>

      <div style="margin-bottom:12px;">
        <p style="color:#555;">
          - 예: 내가 연차 갈 때 팀원이 내 업무를 대신 하는 내용 기록<br />
          - 작성자: 대체 업무를 맡은 사람(팀원)<br />
          - 연차자: 휴가 가는 사람
        </p>
      </div>

      <div
        style="display:flex; flex-direction:column; gap:8px; padding:10px; border:1px solid #ccc; border-radius:4px;"
      >
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <label>연차자 ID:
            <input
              v-model="leaverId"
              placeholder="연차 가는 사람 ID"
              style="width:200px; margin-left:6px;"
            />
          </label>
          <label>연차일(YYYY-MM-DD):
            <input
              v-model="leaveDate"
              placeholder="2025-11-05"
              style="width:140px; margin-left:6px;"
            />
          </label>
        </div>

        <textarea
          v-model="replacementText"
          rows="3"
          cols="60"
          placeholder="대체 업무 내용을 적어주세요"
        ></textarea>

        <div>
          <button :disabled="busy || !isLoggedIn" @click="submitReplacement">
            게시글 등록
          </button>
        </div>
      </div>

      <h3 style="margin-top:16px;">내가 열람(연차자 본인)</h3>
      <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
        <label>연차일(옵션):
          <input
            v-model="queryLeaveDate"
            placeholder="비우면 전체"
            style="width:140px; margin-left:6px;"
          />
        </label>
        <button :disabled="busy || !isLoggedIn" @click="loadMyReplacements">
          불러오기
        </button>
      </div>

      <ul style="margin-top:12px;">
        <li v-for="e in mine" :key="e.id" style="margin-bottom:6px;">
          <b>#{{ e.id }}</b>
          <b>{{ e.leaveDate }}</b>
          — [작성자 {{ e.authorId }} → 연차자 {{ e.leaverId }}]
          <span style="white-space:pre-wrap"> — {{ e.text }}</span>
          <button
            :disabled="busy || !isLoggedIn"
            style="margin-left:8px"
            @click="startEditReplacement(e)"
          >
            편집
          </button>
          <button
            :disabled="busy || !isLoggedIn"
            style="margin-left:4px"
            @click="deleteReplacement(e.id)"
          >
            삭제
          </button>
        </li>
      </ul>

      <div
        v-if="editId"
        style="margin-top:12px; padding:10px; border:1px solid #ccc;"
      >
        <h4>편집: #{{ editId }}</h4>
        <label>연차일(YYYY-MM-DD):
          <input
            v-model="editLeaveDate"
            style="width:140px; margin-left:6px;"
          />
        </label>
        <textarea
          v-model="editText"
          rows="3"
          cols="60"
          placeholder="수정할 내용"
        ></textarea>
        <button :disabled="busy || !isLoggedIn" @click="saveReplacementEdit">
          수정 저장
        </button>
        <button
          :disabled="busy"
          style="margin-left:6px;"
          @click="cancelEdit"
        >
          취소
        </button>
      </div>
    </section>
  </div>
</template>

<script>
import axios from 'axios';
import {
  getAuth,
  setUserId,
  clearAuth,
  getAuthHeaders,
} from './vacationAuth';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function api() {
  // AIPM 백엔드에 우리가 추가한 라우터 베이스 URL
  const instance = axios.create({
    baseURL: 'http://localhost:3000/api/vacation-notice',
  });
  instance.interceptors.request.use((config) => {
    config.headers = { ...(config.headers || {}), ...getAuthHeaders() };
    return config;
  });
  return instance;
}

export default {
  name: 'VacationNotice',
  data() {
    const { userId } = getAuth();
    return {
      busy: false,

      // 로그인 비슷한거
      uidInput: userId || '',

      // 기능 1
      todoDate: '',
      todoText: '',
      todos: [],

      // 기능 2
      leaverId: '',
      leaveDate: '',
      replacementText: '',
      queryLeaveDate: '',
      mine: [],

      // 편집용
      editId: null,
      editLeaveDate: '',
      editText: '',
    };
  },
  computed: {
    isLoggedIn() {
      const { userId, token } = getAuth();
      return Boolean((userId && userId.trim()) || (token && token.trim()));
    },
  },
  methods: {
    alertErr(e, fallback = '요청 실패') {
      try {
        const msg =
          e?.response?.data?.error ||
          e?.response?.data?.message ||
          e?.message ||
          fallback;
        alert(msg);
      } catch {
        alert(fallback);
      }
    },

    // ================= 공통: 사용자 저장/로그아웃/리셋 =================
    saveUid() {
      const v = (this.uidInput || '').trim();
      if (!v) {
        alert('ID를 입력하세요.');
        return;
      }
      setUserId(v);
      alert(`ID 저장: ${v}`);
    },
    logout() {
      clearAuth();
      this.uidInput = '';
      this.todoDate = '';
      this.todoText = '';
      this.todos = [];
      this.leaverId = '';
      this.leaveDate = '';
      this.replacementText = '';
      this.queryLeaveDate = '';
      this.mine = [];
      this.editId = null;
      this.editLeaveDate = '';
      this.editText = '';
      alert('로그아웃되었습니다.');
    },

    // ================= 기능 1: 개인 복귀 업무 =================
    async saveTodo() {
      if (!this.isLoggedIn) return alert('먼저 사용자 ID를 저장하세요.');
      if (!DATE_RE.test(this.todoDate))
        return alert('날짜 형식은 YYYY-MM-DD');

      this.busy = true;
      try {
        await api().post('/next-day-todos', {
          forDate: this.todoDate,
          content: this.todoText,
        });
        await this.loadTodos();
      } catch (e) {
        this.alertErr(e);
      } finally {
        this.busy = false;
      }
    },
    async loadTodos() {
      if (!this.isLoggedIn)
        return alert('먼저 사용자 ID를 저장하세요.');
      this.busy = true;
      try {
        const res = await api().get('/next-day-todos');
        this.todos = res.data;
      } catch (e) {
        this.alertErr(e);
      } finally {
        this.busy = false;
      }
    },
    async deleteTodo(forDate) {
      if (!confirm(forDate + ' 항목을 삭제할까요?')) return;
      this.busy = true;
      try {
        await api().delete('/next-day-todos', {
          params: { forDate },
        });
        await this.loadTodos();
      } catch (e) {
        this.alertErr(e);
      } finally {
        this.busy = false;
      }
    },
    prefillTodo(t) {
      this.todoDate = t.forDate;
      this.todoText = t.content;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // ================= 기능 2: 대체자 게시판 =================
    async submitReplacement() {
      if (!this.isLoggedIn)
        return alert('먼저 사용자 ID를 저장하세요.');
      if (!(this.leaverId || '').trim())
        return alert('연차자ID를 입력하세요.');
      if (!DATE_RE.test(this.leaveDate))
        return alert('연차일 형식은 YYYY-MM-DD');

      this.busy = true;
      try {
        await api().post('/replacement', {
          leaverId: this.leaverId,
          leaveDate: this.leaveDate,
          text: this.replacementText,
        });
        this.replacementText = '';
        await this.loadMyReplacements();
      } catch (e) {
        this.alertErr(e);
      } finally {
        this.busy = false;
      }
    },

    async loadMyReplacements() {
      if (!this.isLoggedIn)
        return alert('먼저 사용자 ID를 저장하세요.');
      this.busy = true;
      try {
        const res = await api().get('/replacement', {
          params: {
            leaveDate: this.queryLeaveDate || undefined,
          },
        });
        this.mine = res.data;
      } catch (e) {
        this.alertErr(e);
      } finally {
        this.busy = false;
      }
    },

    startEditReplacement(row) {
      this.editId = row.id;
      this.editLeaveDate = row.leaveDate;
      this.editText = row.text;
    },
    cancelEdit() {
      this.editId = null;
      this.editLeaveDate = '';
      this.editText = '';
    },

    async saveReplacementEdit() {
      if (!this.editId) return;
      if (!DATE_RE.test(this.editLeaveDate))
        return alert('연차일 형식은 YYYY-MM-DD');

      this.busy = true;
      try {
        await api().put(`/replacement/${this.editId}`, {
          leaveDate: this.editLeaveDate,
          text: this.editText,
        });
        await this.loadMyReplacements();
        this.cancelEdit();
      } catch (e) {
        this.alertErr(e);
      } finally {
        this.busy = false;
      }
    },

    async deleteReplacement(id) {
      if (!confirm(`#${id} 을(를) 삭제할까요?`)) return;
      this.busy = true;
      try {
        await api().delete(`/replacement/${id}`);
        await this.loadMyReplacements();
      } catch (e) {
        this.alertErr(e);
      } finally {
        this.busy = false;
      }
    },

    // ================= 전체 초기화(데모용) =================
    async resetAll() {
      if (
        !confirm('정말 전체 초기화할까요? 되돌릴 수 없습니다.')
      )
        return;
      this.busy = true;
      try {
        await api().delete('/all');
        this.todos = [];
        this.mine = [];
        alert('모두 삭제되었습니다.');
      } catch (e) {
        this.alertErr(e);
      } finally {
        this.busy = false;
      }
    },
  },
};
</script>
