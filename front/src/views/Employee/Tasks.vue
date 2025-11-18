<template>
  <div class="tasks-page">
    <div class="header">
      <h1>개발 업무 관리</h1>
      <p>AI가 업무 우선순위를 분석하여 추천합니다</p>
    </div>

    <!-- 오늘의 추천 업무 -->
    <div v-if="todayRecommendations.length > 0" class="card recommendation-card">
      <h2>⭐ 오늘의 추천 업무 TOP 3</h2>
      <div class="recommendation-list">
        <div v-for="(task, index) in todayRecommendations" :key="task.id" class="recommendation-item">
          <div class="rank-badge">{{ index + 1 }}</div>
          <div class="recommendation-content">
            <strong>{{ task.title }}</strong>
            <p class="meta">{{ getDday(task.deadline) }} · {{ task.estimatedTime }}분 · 중요도: {{ task.importance }}</p>
          </div>
        </div>
      </div>
      <p class="tip">💡 AI가 마감일과 중요도를 고려하여 선정했습니다</p>
    </div>


    <!-- 업무 요청서 AI 분석 -->
    <div class="card">
      <h2>📄 업무 요청서 AI 분석</h2>
      <p class="description">이미지, PDF 파일을 업로드하거나 텍스트를 직접 입력하세요</p>
      <p class="tip">💡 팁: 이메일 내용이나 회의록을 복사해서 붙여넣기 할 수 있습니다</p>

      <!-- 탭 선택 -->
      <div class="input-tabs">
        <button
          @click="inputMode = 'file'"
          :class="['tab-btn', { active: inputMode === 'file' }]"
        >
          📁 파일 업로드
        </button>
        <button
          @click="inputMode = 'text'"
          :class="['tab-btn', { active: inputMode === 'text' }]"
        >
          📝 텍스트 입력
        </button>
      </div>

      <!-- 파일 업로드 모드 -->
      <div v-if="inputMode === 'file'">
        <input
          type="file"
          ref="fileInput"
          @change="handleFileSelect"
          accept="image/*,application/pdf"
          multiple
          style="display: none"
        />

      <div v-if="selectedFiles.length > 0" class="file-list">
        <h4>선택된 파일 ({{ selectedFiles.length }}개)</h4>
        <div class="file-chips">
          <span v-for="(file, index) in selectedFiles" :key="index" class="file-chip">
            {{ file.name }}
            <button @click="removeFile(index)" class="remove-btn">×</button>
          </span>
        </div>
      </div>

        <button @click="$refs.fileInput.click()" class="btn-outline">파일 추가 선택</button>

        <div class="checkbox-group">
          <label>
            <input type="checkbox" v-model="mergeMultiplePages" />
            여러 이미지를 하나의 문서로 분석 (2장 이상일 때)
          </label>
        </div>

        <button
          @click="analyzeDocuments"
          class="submit-btn"
          :disabled="selectedFiles.length === 0 || isAnalyzing"
        >
          {{ isAnalyzing ? '분석 중...' : `AI 분석 시작 (${selectedFiles.length}개)` }}
        </button>
      </div>

      <!-- 텍스트 입력 모드 -->
      <div v-if="inputMode === 'text'" class="text-input-section">
        <div class="form-group">
          <label>업무 요청 내용</label>
          <textarea
            v-model="textInput"
            placeholder="예시:
[프로젝트] 사용자 로그인 기능 개발
마감일: 2025년 1월 20일
담당: 김개발
내용: OAuth 소셜 로그인 구현, JWT 토큰 인증, 세션 관리
우선순위: 높음

이메일 내용이나 회의록을 여기에 붙여넣으세요."
            rows="10"
          ></textarea>
          <p class="char-count">{{ textInput.length }}자</p>
        </div>

        <button
          @click="analyzeText"
          class="submit-btn"
          :disabled="!textInput.trim() || isAnalyzing"
        >
          {{ isAnalyzing ? '분석 중...' : 'AI 텍스트 분석 시작' }}
        </button>
      </div>
    </div>

    <!-- AI 분석 결과 -->
    <div v-if="analyzedTasks.length > 0" class="card">
      <h2>✅ AI 분석 결과 ({{ analyzedTasks.length }}개) - 확인 후 저장</h2>

      <div v-for="(task, index) in analyzedTasks" :key="index" class="analysis-result">
        <h3>{{ index + 1 }}. {{ task.fileName }}</h3>

        <div class="form-group">
          <label>업무 제목</label>
          <input v-model="task.title" type="text" />
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label>마감 날짜</label>
            <input v-model="task.deadlineDate" type="date" />
          </div>
          <div class="form-group">
            <label>마감 시간</label>
            <input v-model="task.deadlineTime" type="time" />
          </div>
        </div>

        <div class="form-grid-3">
          <div class="form-group">
            <label>소요시간 (분)</label>
            <input v-model.number="task.estimatedTime" type="number" />
          </div>
          <div class="form-group">
            <label>난이도</label>
            <select v-model="task.difficulty">
              <option>쉬움</option>
              <option>보통</option>
              <option>어려움</option>
            </select>
          </div>
          <div class="form-group">
            <label>중요도</label>
            <select v-model="task.importance">
              <option>낮음</option>
              <option>중간</option>
              <option>높음</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>업무 유형</label>
          <select v-model="task.taskType">
            <option>기획</option>
            <option>개발</option>
            <option>버그수정</option>
            <option>회의</option>
          </select>
        </div>

        <div class="ai-reason">
          <strong>AI 판단:</strong> {{ task.reason }}
        </div>
      </div>

      <button @click="saveAllAnalyzedTasks" class="submit-btn">모든 업무 저장 ({{ analyzedTasks.length }}개)</button>
      <button @click="analyzedTasks = []" class="btn-outline cancel-btn">취소</button>
    </div>

    <!-- 수동 업무 추가 -->
    <div class="card">
      <h2>➕ 수동 업무 추가</h2>

      <div class="form-group">
        <label>업무 제목</label>
        <input v-model="newTask.title" type="text" placeholder="업무 제목을 입력하세요" />
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label>마감 날짜</label>
          <input v-model="newTask.deadlineDate" type="date" />
        </div>
        <div class="form-group">
          <label>마감 시간</label>
          <input v-model="newTask.deadlineTime" type="time" />
        </div>
      </div>

      <div class="form-group">
        <label>예상 소요시간 (분)</label>
        <input v-model.number="newTask.estimatedTime" type="number" placeholder="예: 120" />
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label>난이도</label>
          <select v-model="newTask.difficulty">
            <option value="">선택하세요</option>
            <option>쉬움</option>
            <option>보통</option>
            <option>어려움</option>
          </select>
        </div>
        <div class="form-group">
          <label>업무 유형</label>
          <select v-model="newTask.taskType">
            <option value="">선택하세요</option>
            <option>기획</option>
            <option>개발</option>
            <option>버그수정</option>
            <option>회의</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label>중요도</label>
        <select v-model="newTask.importance">
          <option value="">선택하세요</option>
          <option>낮음</option>
          <option>중간</option>
          <option>높음</option>
        </select>
      </div>

      <button @click="addTask" class="submit-btn">업무 추가</button>
    </div>

    <!-- AI 우선순위 추천 -->
    <div v-if="incompleteTasks.length > 0" class="card">
      <h2>🤖 AI 우선순위 추천</h2>
      <button @click="getAIPriority" class="submit-btn" :disabled="isRecommending">
        {{ isRecommending ? '분석 중...' : `${incompleteTasks.length}개 업무 추천받기` }}
      </button>

      <div v-if="aiResult" class="ai-result-box">
        <pre>{{ aiResult }}</pre>
      </div>
    </div>

    <!-- 타임라인 -->
    <div v-if="incompleteTasks.length > 0" class="card">
      <h2>⏰ 타임라인 (마감일 기준)</h2>

      <!-- 급함 -->
      <div v-if="urgentTasks.length > 0" class="timeline-section">
        <h3 class="timeline-header urgent">🔴 급함 (24시간 이내)</h3>
        <div v-for="task in urgentTasks" :key="task.id" class="timeline-item urgent-item">
          <strong>{{ task.title }}</strong>
          <p class="meta">{{ getDday(task.deadline) }} · {{ task.estimatedTime }}분 · {{ task.difficulty }} · 중요도: {{ task.importance }}</p>
          <span class="time-badge urgent-badge">{{ formatTime(task.deadline) }}</span>
        </div>
      </div>

      <!-- 보통 -->
      <div v-if="soonTasks.length > 0" class="timeline-section">
        <h3 class="timeline-header soon">🟡 보통 (1-3일 이내)</h3>
        <div v-for="task in soonTasks" :key="task.id" class="timeline-item soon-item">
          <strong>{{ task.title }}</strong>
          <p class="meta">{{ getDday(task.deadline) }} · {{ task.estimatedTime }}분 · {{ task.difficulty }}</p>
          <span class="time-badge soon-badge">{{ formatTime(task.deadline) }}</span>
        </div>
      </div>

      <!-- 여유 -->
      <div v-if="laterTasks.length > 0" class="timeline-section">
        <h3 class="timeline-header later">🟢 여유 (3일 이상)</h3>
        <div v-for="task in laterTasks" :key="task.id" class="timeline-item later-item">
          <strong>{{ task.title }}</strong>
          <p class="meta">{{ getDday(task.deadline) }} · {{ task.estimatedTime }}분 · {{ task.difficulty }}</p>
          <span class="time-badge later-badge">{{ formatTime(task.deadline) }}</span>
        </div>
      </div>
    </div>

    <!-- 업무 목록 -->
    <div class="card">
      <h2>📋 업무 목록 ({{ tasks.length }}개)</h2>

      <div v-if="tasks.length === 0" class="empty-state">
        등록된 업무가 없습니다
      </div>

      <!-- 진행 중 -->
      <div v-if="incompleteTasks.length > 0">
        <h3 class="section-title">🔄 진행 중 ({{ incompleteTasks.length }}개)</h3>
        <div class="task-table">
          <div v-for="task in incompleteTasks" :key="task.id" class="task-row">
            <div class="task-info">
              <h4>{{ task.title }}</h4>
              <p class="task-meta">마감: {{ formatDate(task.deadline) }}</p>
              <p class="task-meta">소요시간: {{ task.estimatedTime }}분 | 난이도: {{ task.difficulty }} | 유형: {{ task.taskType }}</p>
            </div>
            <div class="task-actions">
              <button @click="completeTask(task.id)" class="btn-complete">완료</button>
              <button @click="deleteTask(task.id)" class="btn-delete">삭제</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 완료됨 -->
      <div v-if="completedTasks.length > 0" class="completed-section">
        <h3 class="section-title">✅ 완료됨 ({{ completedTasks.length }}개)</h3>
        <div class="task-table">
          <div v-for="task in completedTasks" :key="task.id" class="task-row completed">
            <div class="task-info">
              <h4>{{ task.title }}</h4>
              <p class="task-meta">완료: {{ formatDate(task.completedAt) }}</p>
            </div>
            <div class="task-actions">
              <button @click="deleteTask(task.id)" class="btn-delete">삭제</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import CalendarComponent from '@/components/CalendarComponent.vue';

export default {
  name: 'TaskView',
  components: {
    CalendarComponent
  },
  data() {
    return {
      currentUser: null,
      tasks: [],
      newTask: {
        title: '',
        deadlineDate: '',
        deadlineTime: '',
        estimatedTime: null,
        difficulty: '',
        taskType: '',
        importance: ''
      },
      aiResult: '',
      selectedFiles: [],
      analyzedTasks: [],
      isAnalyzing: false,
      inputMode: 'file', // 'file' 또는 'text'
      textInput: '', // 텍스트 직접 입력
      isRecommending: false,
      mergeMultiplePages: false
    };
  },
  mounted() {
    this.loadCurrentUser();
    this.loadTasks();
  },
  computed: {
    incompleteTasks() {
      return this.tasks.filter(t => !t.completed);
    },
    completedTasks() {
      return this.tasks.filter(t => t.completed);
    },
    todayRecommendations() {
      return this.incompleteTasks
        .map(task => ({
          ...task,
          score: this.calculateTaskScore(task)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
    },
    urgentTasks() {
      return this.incompleteTasks.filter(task => {
        var hoursLeft = this.getHoursLeft(task.deadline);
        return hoursLeft <= 24 && hoursLeft >= 0;
      }).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    },
    soonTasks() {
      return this.incompleteTasks.filter(task => {
        var hoursLeft = this.getHoursLeft(task.deadline);
        return hoursLeft > 24 && hoursLeft <= 72;
      }).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    },
    laterTasks() {
      return this.incompleteTasks.filter(task => {
        var hoursLeft = this.getHoursLeft(task.deadline);
        return hoursLeft > 72;
      }).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    }
  },
  methods: {
    async loadCurrentUser() {
      try {
        var response = await this.$axios.get('http://localhost:3000/api/info');
        if (response.data.isLogin) {
          this.currentUser = response.data.user;
        } else {
          this.$router.push('/login');
        }
      } catch (error) {
        console.error('로그인 정보 불러오기 실패:', error);
        this.$router.push('/login');
      }
    },
    async loadTasks() {
      try {
        var response = await this.$axios.get('http://localhost:3000/api/tasks');
        if (response.data.success) {
          this.tasks = response.data.tasks;
          console.log('업무 로드 완료:', this.tasks.length, '개');
        }
      } catch (error) {
        console.error('업무 불러오기 실패:', error);
      }
    },
    calculateTaskScore(task) {
      var score = 0;

      if (task.importance === '높음') score += 100;
      else if (task.importance === '중간') score += 50;
      else score += 10;

      var hoursLeft = this.getHoursLeft(task.deadline);
      if (hoursLeft < 0) {
        score += 200;
      } else if (hoursLeft <= 24) {
        score += 80;
      } else if (hoursLeft <= 72) {
        score += 40;
      } else {
        score += 10;
      }

      if (task.difficulty === '어려움') score += 15;
      else if (task.difficulty === '보통') score += 10;
      else score += 5;

      return score;
    },
    async addTask() {
      if (!this.newTask.title || !this.newTask.deadlineDate || !this.newTask.deadlineTime || !this.newTask.estimatedTime || !this.newTask.difficulty || !this.newTask.taskType || !this.newTask.importance) {
        alert('모든 항목을 입력해주세요');
        return;
      }

      var deadline = this.newTask.deadlineDate + 'T' + this.newTask.deadlineTime;

      var response = await this.$axios.post('http://localhost:3000/api/tasks', {
        title: this.newTask.title,
        deadline: deadline,
        estimated_time: this.newTask.estimatedTime,
        difficulty: this.newTask.difficulty,
        taskType: this.newTask.taskType,
        importance: this.newTask.importance
      }, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data.success) {
        this.tasks.push(response.data.task);
        this.newTask = {
          title: '',
          deadlineDate: '',
          deadlineTime: '',
          estimatedTime: null,
          difficulty: '',
          taskType: '',
          importance: ''
        };
        alert('업무가 추가되었습니다');
      }
    },
    async getAIPriority() {
      this.isRecommending = true;

      try {
        var response = await this.$axios.post('http://localhost:3000/api/tasks/ai-priority', {
          tasks: this.incompleteTasks
        });

        if (response.data.success) {
          this.aiResult = response.data.recommendation;
        } else {
          alert('AI 추천 실패: ' + response.data.error);
        }
      } finally {
        this.isRecommending = false;
      }
    },
    async completeTask(id) {
      var response = await this.$axios.patch(`http://localhost:3000/api/tasks/${id}/complete`);
      if (response.data.success) {
        var task = this.tasks.find(t => t.id === id);
        if (task) {
          task.completed = true;
          task.completedAt = response.data.task.completedAt;
        }
        this.aiResult = '';
      }
    },
    async deleteTask(id) {
      if (!confirm('정말 삭제하시겠습니까?')) {
        return;
      }

      var response = await this.$axios.delete(`http://localhost:3000/api/tasks/${id}`);
      if (response.data.success) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.aiResult = '';
      }
    },
    formatDate(dateString) {
      if (!dateString) return '';
      var date = new Date(dateString);
      return date.toLocaleString('ko-KR');
    },
    getHoursLeft(deadline) {
      var now = new Date();
      var deadlineDate = new Date(deadline);
      var diff = deadlineDate - now;
      return diff / (1000 * 60 * 60);
    },
    getDday(deadline) {
      var hoursLeft = this.getHoursLeft(deadline);

      if (hoursLeft < 0) {
        return '마감 지남';
      } else if (hoursLeft < 1) {
        var minutesLeft = Math.floor(hoursLeft * 60);
        return `${minutesLeft}분 남음`;
      } else if (hoursLeft < 24) {
        var hours = Math.floor(hoursLeft);
        return `${hours}시간 남음`;
      } else {
        var days = Math.floor(hoursLeft / 24);
        return `D-${days}`;
      }
    },
    formatTime(deadline) {
      var date = new Date(deadline);
      var month = date.getMonth() + 1;
      var day = date.getDate();
      var hours = date.getHours();
      var minutes = date.getMinutes();
      return `${month}/${day} ${hours}:${minutes.toString().padStart(2, '0')}`;
    },
    handleFileSelect(event) {
      var newFiles = Array.from(event.target.files);

      newFiles.forEach(newFile => {
        var isDuplicate = this.selectedFiles.some(existingFile =>
          existingFile.name === newFile.name && existingFile.size === newFile.size
        );

        if (!isDuplicate) {
          this.selectedFiles.push(newFile);
        }
      });

      if (this.selectedFiles.length > 10) {
        alert('최대 10개 파일까지만 선택할 수 있습니다');
        this.selectedFiles = this.selectedFiles.slice(0, 10);
      }

      event.target.value = '';
    },
    removeFile(index) {
      this.selectedFiles.splice(index, 1);
    },
    async analyzeDocuments() {
      if (this.selectedFiles.length === 0) {
        alert('파일을 선택해주세요');
        return;
      }

      if (this.mergeMultiplePages && this.selectedFiles.length > 1) {
        alert('여러 이미지를 하나의 문서로 분석합니다.\n분석 시간이 조금 더 걸릴 수 있습니다.');
      }

      var formData = new FormData();
      this.selectedFiles.forEach(file => {
        formData.append('documents', file);
      });

      formData.append('mergePages', this.mergeMultiplePages);

      this.isAnalyzing = true;

      try {
        var response = await this.$axios.post(
          'http://localhost:3000/api/ai/analyze-documents',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        if (response.data.success) {
          this.analyzedTasks = response.data.analyses.filter(a => !a.error);
          var failedCount = response.data.analyses.filter(a => a.error).length;

          this.selectedFiles = [];
          this.mergeMultiplePages = false;

          if (failedCount > 0) {
            alert(`${this.analyzedTasks.length}개 파일 분석 완료! (${failedCount}개 실패)\n내용을 확인하고 저장해주세요.`);
          } else {
            alert(`${this.analyzedTasks.length}개 파일 분석 완료!\n내용을 확인하고 저장해주세요.`);
          }
        } else {
          alert('분석 실패: ' + response.data.error);
        }
      } catch (error) {
        console.error('분석 에러:', error);
        alert('문서 분석에 실패했습니다');
      } finally {
        this.isAnalyzing = false;
      }
    },
    async analyzeText() {
      if (!this.textInput.trim()) {
        alert('텍스트를 입력해주세요');
        return;
      }

      this.isAnalyzing = true;

      try {
        var formData = new FormData();
        formData.append('textInput', this.textInput);

        var response = await this.$axios.post(
          'http://localhost:3000/api/ai/analyze-documents',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        if (response.data.success) {
          this.analyzedTasks = response.data.analyses.filter(a => !a.error);
          this.textInput = ''; // 입력 필드 초기화
          alert(`텍스트 분석 완료!\n내용을 확인하고 저장해주세요.`);
        } else {
          alert('분석 실패: ' + response.data.error);
        }
      } catch (error) {
        console.error('텍스트 분석 에러:', error);
        alert('텍스트 분석에 실패했습니다');
      } finally {
        this.isAnalyzing = false;
      }
    },
    async saveAllAnalyzedTasks() {
      if (!this.currentUser) {
        alert('사용자 정보가 없습니다. 로그인 후 시도해주세요.');
        return;
      }

      var savedCount = 0;

      for (var task of this.analyzedTasks) {
        var taskData = {
          user_id: this.currentUser.id,
          title: task.title,
          description: task.reason,
          deadline: new Date(`${task.deadlineDate}T${task.deadlineTime}`),
          estimated_time: task.estimatedTime,
          difficulty: task.difficulty,
          taskType: task.taskType,
          importance: task.importance
        };

        try {
          var response = await this.$axios.post('http://localhost:3000/api/tasks', taskData);

          if (response.data.success) {
            this.tasks.push(response.data.task);
            savedCount++;
          }
        } catch (err) {
          console.error('업무 저장 실패:', err.response?.data || err);
        }
      }

      this.analyzedTasks = [];
      alert(`${savedCount}개 업무가 저장되었습니다!`);
    }
  }
};
</script>

<style scoped>
.tasks-page {
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

.card {
  background: white;
  border-radius: 1.5rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  padding: 2rem;
  width: 100%;
  max-width: 800px;
  margin-bottom: 2rem;
}

.card h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: #1f2937;
}

.description {
  color: #6b7280;
  margin-bottom: 1rem;
  font-size: 0.95rem;
}

.tip {
  color: #9ca3af;
  font-size: 0.85rem;
  margin-top: 0.5rem;
}

/* 추천 업무 */
.recommendation-card {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.recommendation-card h2 {
  color: white;
}

.recommendation-list {
  margin: 1.5rem 0;
}

.recommendation-item {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.2);
  padding: 1rem;
  border-radius: 0.75rem;
  margin-bottom: 0.75rem;
}

.rank-badge {
  width: 36px;
  height: 36px;
  background: white;
  color: #10b981;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  margin-right: 1rem;
  flex-shrink: 0;
}

.recommendation-content strong {
  display: block;
  margin-bottom: 0.25rem;
}

.recommendation-content .meta {
  font-size: 0.85rem;
  opacity: 0.9;
}

.recommendation-card .tip {
  color: rgba(255, 255, 255, 0.8);
}

/* 폼 스타일 */
.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

input,
textarea,
select {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 0.6rem 0.8rem;
  font-size: 0.95rem;
  font-family: inherit;
}

input:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
}

textarea {
  resize: none;
  height: 100px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-grid-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
}

/* 파일 목록 */
.file-list {
  margin: 1rem 0;
}

.file-list h4 {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.file-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.file-chip {
  background: #e5e7eb;
  padding: 0.4rem 0.8rem;
  border-radius: 1rem;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.remove-btn {
  background: none;
  border: none;
  color: #6b7280;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.remove-btn:hover {
  color: #dc2626;
}

/* 체크박스 */
.checkbox-group {
  margin: 1rem 0;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  font-weight: normal;
  cursor: pointer;
}

.checkbox-group input[type="checkbox"] {
  width: auto;
  margin-right: 0.5rem;
}

/* 버튼 */
.submit-btn {
  background-color: #10b981;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.6rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s;
  width: 100%;
  font-weight: 500;
}

.submit-btn:hover:not(:disabled) {
  background-color: #059669;
}

.submit-btn:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.btn-outline {
  background: white;
  color: #10b981;
  border: 2px solid #10b981;
  padding: 0.75rem 1.5rem;
  border-radius: 0.6rem;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  width: 100%;
  font-weight: 500;
  margin-bottom: 1rem;
}

.btn-outline:hover {
  background: #10b981;
  color: white;
}

.cancel-btn {
  margin-top: 0.5rem;
  background: white;
  color: #dc2626;
  border: 2px solid #dc2626;
}

.cancel-btn:hover {
  background: #dc2626;
  color: white;
}

/* 분석 결과 */
.analysis-result {
  background: #f9fafb;
  padding: 1.5rem;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  border: 1px solid #e5e7eb;
}

.analysis-result h3 {
  font-size: 1rem;
  margin-bottom: 1rem;
  color: #374151;
}

.ai-reason {
  background: #e0f2fe;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  margin-top: 1rem;
  color: #0c4a6e;
}

.ai-result-box {
  margin-top: 1rem;
  background: #f3f4f6;
  padding: 1rem;
  border-radius: 0.5rem;
}

.ai-result-box pre {
  white-space: pre-wrap;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  color: #374151;
  margin: 0;
}

/* 타임라인 */
.timeline-section {
  margin-bottom: 1.5rem;
}

.timeline-header {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.timeline-header.urgent {
  color: #dc2626;
}

.timeline-header.soon {
  color: #f59e0b;
}

.timeline-header.later {
  color: #10b981;
}

.timeline-item {
  background: white;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
  border-left: 4px solid;
  position: relative;
}

.urgent-item {
  border-left-color: #dc2626;
  background: #fef2f2;
}

.soon-item {
  border-left-color: #f59e0b;
  background: #fffbeb;
}

.later-item {
  border-left-color: #10b981;
  background: #f0fdf4;
}

.timeline-item strong {
  display: block;
  margin-bottom: 0.25rem;
  color: #1f2937;
}

.meta {
  font-size: 0.85rem;
  color: #6b7280;
  margin: 0;
}

.time-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: white;
}

.urgent-badge {
  background: #dc2626;
}

.soon-badge {
  background: #f59e0b;
}

.later-badge {
  background: #10b981;
}

/* 업무 목록 */
.section-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #374151;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #9ca3af;
}

.task-table {
  margin-bottom: 2rem;
}

.task-row {
  background: #f9fafb;
  padding: 1rem;
  border-radius: 0.75rem;
  margin-bottom: 0.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid #e5e7eb;
}

.task-row.completed {
  opacity: 0.6;
}

.task-info h4 {
  font-size: 1rem;
  margin-bottom: 0.5rem;
  color: #1f2937;
}

/* 탭 스타일 */
.input-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.tab-btn {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 0.5rem;
  font-size: 0.95rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active {
  background: #10b981;
  border-color: #10b981;
  color: white;
}

.tab-btn:hover:not(.active) {
  border-color: #10b981;
  color: #10b981;
}

/* 텍스트 입력 섹션 */
.text-input-section {
  margin-top: 1rem;
}

.text-input-section textarea {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 0.75rem;
  font-size: 0.95rem;
  font-family: 'Pretendard', 'Noto Sans KR', sans-serif;
  resize: vertical;
  min-height: 200px;
}

.text-input-section textarea:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
}

.char-count {
  text-align: right;
  font-size: 0.85rem;
  color: #9ca3af;
  margin-top: 0.5rem;
}

.task-meta {
  font-size: 0.85rem;
  color: #6b7280;
  margin: 0.25rem 0;
}

.task-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-complete,
.btn-delete {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
}

.btn-complete {
  background: #10b981;
  color: white;
}

.btn-complete:hover {
  background: #059669;
}

.btn-delete {
  background: #dc2626;
  color: white;
}

.btn-delete:hover {
  background: #b91c1c;
}

.completed-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

/* 캘린더 카드 */
.calendar-card {
  position: relative;
}

.calendar-card .description {
  font-size: 0.9rem;
  color: #6b7280;
  margin-bottom: 1.5rem;
}
</style>
