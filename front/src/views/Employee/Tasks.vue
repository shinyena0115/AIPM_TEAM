<template> 

  <v-container> 

    <h1>TaskAI - AI 업무 우선순위 시스템</h1> 

 

    <!-- 오늘의 추천 업무 --> 

    <v-card v-if="todayRecommendations.length > 0" class="my-4"> 

      <v-card-title>오늘의 추천 업무 TOP 3</v-card-title> 

      <v-card-text> 

        <div v-for="(task, index) in todayRecommendations" :key="task.id" class="mb-3"> 

          <strong>{{ index + 1 }}. {{ task.title }}</strong> 

          <div class="text-caption"> 

            {{ getDday(task.deadline) }} | {{ task.estimatedTime }}분 | 중요도: {{ task.importance }} 

          </div> 

        </div> 

        <p class="text-caption text-grey mt-2">💡 AI가 마감일과 중요도를 고려하여 선정했습니다</p> 

      </v-card-text> 

    </v-card> 

 

    <!-- 협조문 업로드 --> 

    <v-card class="my-4"> 

      <v-card-title>협조문 AI 분석</v-card-title> 

      <v-card-text> 

        <p class="mb-3">협조문 이미지를 업로드하면 AI가 자동으로 분석합니다 (최대 10개)</p> 

        <p class="text-caption text-grey mb-3"> 

          💡 팁: 협조문이 여러 장인 경우, 모든 페이지를 함께 선택하세요. AI가 자동으로 하나의 업무로 합쳐서 분석합니다. 

        </p> 

         

        <!-- 파일 선택 버튼 (숨김) --> 

        <input  

          type="file"  

          ref="fileInput" 

          @change="handleFileSelect" 

          accept="image/*" 

          multiple 

          style="display: none" 

        /> 

         

        <!-- 선택된 파일 목록 --> 

        <div v-if="selectedFiles.length > 0" class="mb-3"> 

          <h4>선택된 파일 ({{ selectedFiles.length }}개)</h4> 

          <v-chip 

            v-for="(file, index) in selectedFiles" 

            :key="index" 

            class="ma-1" 

            closable 

            @click:close="removeFile(index)" 

          > 

            {{ file.name }} 

          </v-chip> 

        </div> 

 

        <!-- 파일 추가 버튼 --> 

        <v-btn 

          @click="$refs.fileInput.click()" 

          variant="outlined" 

          block 

          class="mb-3" 

        > 

          파일 추가 선택 

        </v-btn> 

 

        <v-checkbox 

          v-model="mergeMultiplePages" 

          label="여러 이미지를 하나의 협조문으로 분석 (2장 이상일 때)" 

          density="compact" 

          hide-details 

          class="mb-3" 

        ></v-checkbox> 

 

        <v-btn 

          @click="analyzeDocuments" 

          color="primary" 

          block 

          :disabled="selectedFiles.length === 0" 

          :loading="isAnalyzing" 

        > 

          AI 분석 시작 ({{ selectedFiles.length }}개) 

        </v-btn> 

      </v-card-text> 

    </v-card> 

 

    <!-- AI 분석 결과 --> 

    <v-card v-if="analyzedTasks.length > 0" class="my-4"> 

      <v-card-title>AI 분석 결과 ({{ analyzedTasks.length }}개) - 확인 후 저장</v-card-title> 

      <v-card-text> 

        <div v-for="(task, index) in analyzedTasks" :key="index" class="mb-4 pa-3 task-box"> 

          <h3 class="mb-3">{{ index + 1 }}. {{ task.fileName }}</h3> 

           

          <v-text-field 

            v-model="task.title" 

            label="업무 제목" 

            variant="outlined" 

            density="compact" 

          ></v-text-field> 

 

          <v-row> 

            <v-col cols="6"> 

              <v-text-field 

                v-model="task.deadlineDate" 

                label="마감 날짜" 

                type="date" 

                variant="outlined" 

                density="compact" 

              ></v-text-field> 

            </v-col> 

            <v-col cols="6"> 

              <v-text-field 

                v-model="task.deadlineTime" 

                label="마감 시간" 

                type="time" 

                variant="outlined" 

                density="compact" 

              ></v-text-field> 

            </v-col> 

          </v-row> 

 

          <v-row> 

            <v-col cols="4"> 

              <v-text-field 

                v-model.number="task.estimatedTime" 

                label="소요시간 (분)" 

                type="number" 

                variant="outlined" 

                density="compact" 

              ></v-text-field> 

            </v-col> 

            <v-col cols="4"> 

              <v-select 

                v-model="task.difficulty" 

                label="난이도" 

                :items="['쉬움', '보통', '어려움']" 

                variant="outlined" 

                density="compact" 

              ></v-select> 

            </v-col> 

            <v-col cols="4"> 

              <v-select 

                v-model="task.importance" 

                label="중요도" 

                :items="['낮음', '중간', '높음']" 

                variant="outlined" 

                density="compact" 

              ></v-select> 

            </v-col> 

          </v-row> 

 

          <v-select 

            v-model="task.taskType" 

            label="업무 유형" 

            :items="['전화', '이메일', '문서작업', '대면업무']" 

            variant="outlined" 

            density="compact" 

          ></v-select> 

 

          <v-alert type="info" density="compact"> 

            AI 판단: {{ task.reason }} 

          </v-alert> 

        </div> 

 

        <v-btn @click="saveAllAnalyzedTasks" color="success" block class="mt-3"> 

          모든 업무 저장 ({{ analyzedTasks.length }}개) 

        </v-btn> 

        <v-btn @click="analyzedTasks = []" color="error" block class="mt-2"> 

          취소 

        </v-btn> 

      </v-card-text> 

    </v-card> 

 

    <!-- 수동 업무 추가 --> 

    <v-card class="my-4"> 

      <v-card-title>수동 업무 추가</v-card-title> 

      <v-card-text> 

        <v-text-field 

          v-model="newTask.title" 

          label="업무 제목" 

          variant="outlined" 

        ></v-text-field> 

 

        <v-row> 

          <v-col cols="6"> 

            <v-text-field 

              v-model="newTask.deadlineDate" 

              label="마감 날짜" 

              type="date" 

              variant="outlined" 

            ></v-text-field> 

          </v-col> 

          <v-col cols="6"> 

            <v-text-field 

              v-model="newTask.deadlineTime" 

              label="마감 시간" 

              type="time" 

              variant="outlined" 

            ></v-text-field> 

          </v-col> 

        </v-row> 

 

        <v-text-field 

          v-model.number="newTask.estimatedTime" 

          label="예상 소요시간 (분)" 

          type="number" 

          variant="outlined" 

        ></v-text-field> 

 

        <v-select 

          v-model="newTask.difficulty" 

          label="난이도" 

          :items="['쉬움', '보통', '어려움']" 

          variant="outlined" 

        ></v-select> 

 

        <v-select 

          v-model="newTask.taskType" 

          label="업무 유형" 

          :items="['전화', '이메일', '문서작업', '대면업무']" 

          variant="outlined" 

        ></v-select> 

 

        <v-select 

          v-model="newTask.importance" 

          label="중요도" 

          :items="['낮음', '중간', '높음']" 

          variant="outlined" 

        ></v-select> 

 

        <v-btn @click="addTask" color="primary" block>업무 추가</v-btn> 

      </v-card-text> 

    </v-card> 

 

    <!-- AI 우선순위 추천 --> 

    <v-card class="my-4" v-if="incompleteTasks.length > 0"> 

      <v-card-title>AI 우선순위 추천</v-card-title> 

      <v-card-text> 

        <v-btn 

          @click="getAIPriority" 

          color="primary" 

          block 

          :loading="isRecommending" 

        > 

          {{ incompleteTasks.length }}개 업무 추천받기 

        </v-btn> 

 

        <v-card v-if="aiResult" class="mt-4" variant="outlined"> 

          <v-card-text> 

            <pre class="ai-result">{{ aiResult }}</pre> 

          </v-card-text> 

        </v-card> 

      </v-card-text> 

    </v-card> 

 

    <!-- 타임라인 --> 

    <v-card v-if="incompleteTasks.length > 0" class="my-4"> 

      <v-card-title>타임라인 (마감일 기준)</v-card-title> 

      <v-card-text> 

        <!-- 급함 --> 

        <div v-if="urgentTasks.length > 0" class="mb-4"> 

          <h3 class="urgent-header">급함 (24시간 이내)</h3> 

          <v-card 

            v-for="task in urgentTasks" 

            :key="task.id" 

            class="mb-2 urgent-border" 

            variant="outlined" 

          > 

            <v-card-text> 

              <div class="d-flex justify-space-between align-center"> 

                <div> 

                  <strong>{{ task.title }}</strong> 

                  <p class="text-caption">{{ getDday(task.deadline) }} | {{ task.estimatedTime }}분 | {{ task.difficulty }} | 중요도: {{ task.importance }}</p> 

                </div> 

                <v-chip color="red" size="small">{{ formatTime(task.deadline) }}</v-chip> 

              </div> 

            </v-card-text> 

          </v-card> 

        </div> 

 

        <!-- 보통 --> 

        <div v-if="soonTasks.length > 0" class="mb-4"> 

          <h3 class="soon-header">보통 (1-3일 이내)</h3> 

          <v-card 

            v-for="task in soonTasks" 

            :key="task.id" 

            class="mb-2 soon-border" 

            variant="outlined" 

          > 

            <v-card-text> 

              <div class="d-flex justify-space-between align-center"> 

                <div> 

                  <strong>{{ task.title }}</strong> 

                  <p class="text-caption">{{ getDday(task.deadline) }} | {{ task.estimatedTime }}분 | {{ task.difficulty }}</p> 

                </div> 

                <v-chip color="orange" size="small">{{ formatTime(task.deadline) }}</v-chip> 

              </div> 

            </v-card-text> 

          </v-card> 

        </div> 

 

        <!-- 여유 --> 

        <div v-if="laterTasks.length > 0"> 

          <h3 class="later-header">여유 (3일 이상)</h3> 

          <v-card 

            v-for="task in laterTasks" 

            :key="task.id" 

            class="mb-2 later-border" 

            variant="outlined" 

          > 

            <v-card-text> 

              <div class="d-flex justify-space-between align-center"> 

                <div> 

                  <strong>{{ task.title }}</strong> 

                  <p class="text-caption">{{ getDday(task.deadline) }} | {{ task.estimatedTime }}분 | {{ task.difficulty }}</p> 

                </div> 

                <v-chip color="green" size="small">{{ formatTime(task.deadline) }}</v-chip> 

              </div> 

            </v-card-text> 

          </v-card> 

        </div> 

      </v-card-text> 

    </v-card> 

 

    <!-- 업무 목록 --> 

    <v-card class="my-4"> 

      <v-card-title>업무 목록 ({{ tasks.length }}개)</v-card-title> 

      <v-card-text> 

        <div v-if="tasks.length === 0"> 

          등록된 업무가 없습니다 

        </div> 

 

        <!-- 진행 중 --> 

        <div v-if="incompleteTasks.length > 0"> 

          <h3>진행 중 ({{ incompleteTasks.length }}개)</h3> 

          <v-card 

            v-for="task in incompleteTasks" 

            :key="task.id" 

            class="my-2" 

            variant="outlined" 

          > 

            <v-card-text> 

              <h4>{{ task.title }}</h4> 

              <p>마감: {{ formatDate(task.deadline) }}</p> 

              <p>소요시간: {{ task.estimatedTime }}분 | 난이도: {{ task.difficulty }} | 유형: {{ task.taskType }}</p> 

            </v-card-text> 

            <v-card-actions> 

              <v-btn @click="completeTask(task.id)" color="success">완료</v-btn> 

              <v-btn @click="deleteTask(task.id)" color="error">삭제</v-btn> 

            </v-card-actions> 

          </v-card> 

        </div> 

 

        <!-- 완료됨 --> 

        <div v-if="completedTasks.length > 0" class="mt-4"> 

          <h3>완료됨 ({{ completedTasks.length }}개)</h3> 

          <v-card 

            v-for="task in completedTasks" 

            :key="task.id" 

            class="my-2" 

            variant="outlined" 

          > 

            <v-card-text> 

              <h4>{{ task.title }}</h4> 

              <p>완료: {{ formatDate(task.completedAt) }}</p> 

            </v-card-text> 

            <v-card-actions> 

              <v-btn @click="deleteTask(task.id)" color="error">삭제</v-btn> 

            </v-card-actions> 

          </v-card> 

        </div> 

      </v-card-text> 

    </v-card> 

  </v-container> 

</template> 

 

<script> 

import axios from 'axios'; 

 

export default { 

  name: 'TaskView', 

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

      isRecommending: false, 

      mergeMultiplePages: false 

    }; 

  }, 

  mounted() { 

    // 페이지 로드 시 백엔드에서 업무 목록 불러오기 

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

      // loadTasks() 

var response =  await axios.get('http://localhost:3000/api/info', { params: { user_id: this.currentUser?.id } }); 

 

      this.currentUser = response.data.user; // { user_id, name, email ... } 

    } catch (error) { 

      console.error('로그인 정보 불러오기 실패:', error); 

    } 

  }, 

    // 백엔드에서 업무 목록 불러오기 

 

    async loadTasks() { 

      try { 

        var response = await axios.get('http://localhost:3000/api/tasks'); 

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

 

    getUrgencyColor(task) { 

      var hoursLeft = this.getHoursLeft(task.deadline); 

      if (hoursLeft <= 24) return 'red'; 

      if (hoursLeft <= 72) return 'orange'; 

      return 'green'; 

    }, 

 
    async addTask() { 

      if (!this.newTask.title || !this.newTask.deadlineDate || !this.newTask.deadlineTime || !this.newTask.estimatedTime || !this.newTask.difficulty || !this.newTask.taskType || !this.newTask.importance) { 

        alert('모든 항목을 입력해주세요'); 

        return; 

      } 

 

      var deadline = this.newTask.deadlineDate + 'T' + this.newTask.deadlineTime; 

 

      var response = await axios.post('http://localhost:3000/api/tasks', { 

         

        title: this.newTask.title, 

        deadline: deadline, 

        estimated_time: this.newTask.estimatedTime, 

        difficulty: this.newTask.difficulty, 

        taskType: this.newTask.taskType, 

        importance: this.newTask.importance 

      },{ 

    withCredentials: true, // ✅ 세션 쿠키 포함 필수!! 

    headers: { 'Content-Type': 'application/json' } 

  } 

      ); 

 

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

        var response = await axios.post('http://localhost:3000/api/tasks/ai-priority', { 

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

      var response = await axios.patch(`http://localhost:3000/api/tasks/${id}/complete`); 

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

 

      var response = await axios.delete(`http://localhost:3000/api/tasks/${id}`); 

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

        alert('여러 이미지를 하나의 협조문으로 분석합니다.\n분석 시간이 조금 더 걸릴 수 있습니다.'); 

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

      var response = await axios.post('http://localhost:3000/api/tasks', taskData); 

 

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

.ai-result { 

  white-space: pre-wrap; 

} 

 

.task-box { 

  border: 1px solid #ddd; 

  border-radius: 4px; 

} 

 

.urgent-header { 

  color: #c62828; 

  margin-bottom: 12px; 

} 

 

.soon-header { 

  color: #ef6c00; 

  margin-bottom: 12px; 

} 

 

.later-header { 

  color: #2e7d32; 

  margin-bottom: 12px; 

} 

 

.urgent-border { 

  border-left: 4px solid #f44336; 

} 

 

.soon-border { 

  border-left: 4px solid #ff9800; 

} 

 

.later-border { 

  border-left: 4px solid #4caf50; 

} 

</style> 