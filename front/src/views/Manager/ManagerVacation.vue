<template>
  <div class="manager-layout">

    <!-- 🔥 최상단 고정 헤더 -->
    <ManagerHeader class="header-fixed" @toggle-sidebar="sidebarOpen = !sidebarOpen" />

    <div class="layout-body">

      <!-- 🔥 사이드바 -->
      <ManagerSidebar
        v-if="sidebarOpen"
        class="manager-sidebar-fixed"
      />

      <!-- 🔥 메인 페이지 -->
      <div class="page-wrapper" :class="{ 'sidebar-hidden': !sidebarOpen }">

        <!-- 메인 내용 -->
        <div class="content">
          <div class="header">
            <h1>연차 승인 관리</h1>
            <p>직원들의 연차 신청 내역을 확인하고 승인 또는 반려할 수 있습니다.</p>
          </div>

          <div class="layout-container">

            <!-- 왼쪽 연차 테이블 -->
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
                  <tr
                    v-for="vac in computedVacations"
                    :key="vac.vacation_id"
                    :class="getRowClass(vac)"
                  >
                    <!-- 🔥 이름 + 순위/그룹 표시 (그룹원 2명 이상일 때만 순위/그룹 노출) -->
                    <td>
                      <div class="name-cell">
                        <span class="user-name">{{ vac.user?.name }}</span>

                        <template v-if="getPriorityInfo(vac) && getPriorityInfo(vac).groupSize >= 2">
                          <span class="badge small">
                            {{ getPriorityInfo(vac).priorityRank ? getPriorityInfo(vac).priorityRank + '위' : '-' }}
                          </span>
                          <span class="badge small muted">
                            그룹 {{ getPriorityInfo(vac).group }}
                          </span>
                        </template>
                      </div>
                    </td>

                    <td>{{ vac.user?.Team?.name || '-' }}</td>
                    <td>{{ vac.startDate }} ~ {{ vac.endDate }}</td>
                    <td>{{ vac.reason }}</td>

                    <td>
                      <span :class="'status ' + vac.status">
                        {{ vac.status }}
                      </span>

                      <template v-if="vac.status === '반려' && vac.rejection_reason">
                        <br />
                        <small class="rejection-reason">
                          사유: {{ vac.rejection_reason }}
                        </small>
                      </template>
                    </td>

                    <td>
                      <template v-if="vac.status === '대기'">
                        <button class="btn approve" @click="updateStatus(vac.vacation_id, '승인')">
                          승인
                        </button>

                        <button class="btn reject" @click="openRejectModal(vac.vacation_id)">
                          반려
                        </button>
                      </template>

                      <template v-else>
                        <span class="processed">처리 완료</span>
                      </template>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 오른쪽 AI 패널 -->
            <div class="ai-panel">
              <h3>
                <img :src="aiIcon" alt="AI 아이콘" class="ai-icon" />
                AI 판단 결과
              </h3>

              <div v-if="Array.isArray(aiResults) && aiResults.length > 0">
                <div
                  v-for="teamResult in normalizedResults"
                  :key="teamResult.team"
                  class="ai-result-card"
                >
                  <h4 class="team-title">{{ teamResult.team }}</h4>

                  <!-- 그룹이 있으면 그룹 박스로, 없으면 priority 리스트로 -->
                  <div class="groups-wrapper">
                    <div
                      v-for="(group, gidx) in (teamResult.groups || [])"
                      :key="gidx"
                      class="group-box"
                    >
                      <div class="group-header">
                        <div class="group-title">그룹 {{ gidx + 1 }}</div>
                        <div class="group-sub">겹치는 연차: {{ group.length }}명</div>
                      </div>

                      <div class="group-members">
                        <div
                          v-for="member in group"
                          :key="member.name + member.startDate + member.endDate"
                          class="member-card"
                          :class="{
                            'member-approve': member.recommendation === '승인',
                            'member-reject': member.recommendation === '반려',
                            'member-review': member.recommendation === '팀장 판단 필요'
                          }"
                        >
                          <div class="member-top">
                            <div class="member-rank" v-if="group.length >= 2">
                              {{ member.priorityRank ? member.priorityRank + '위' : '-' }}
                            </div>
                            <div class="member-name">{{ member.name }}</div>
                            <div class="member-date">{{ member.startDate }} ~ {{ member.endDate }}</div>
                          </div>

                          <div class="member-body">
                            <div class="member-rec">→ {{ member.recommendation }}</div>
                            <div class="member-reason">{{ member.reason }}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- 그룹이 전혀 없거나 그룹만 있는 경우, 빈 처리 제외 -->
                    <div v-if="(!teamResult.groups || teamResult.groups.length === 0) && Array.isArray(teamResult.priority)">
                      <!-- fallback: show priority items one-by-one in single boxes -->
                      <div
                        v-for="(p, idx) in teamResult.priority"
                        :key="p.name + p.startDate + p.endDate"
                        class="group-box single-box"
                      >
                        <div class="group-header">
                          <div class="group-title">단건</div>
                        </div>

                        <div class="group-members">
                          <div class="member-card" :class="{
                            'member-approve': p.recommendation === '승인',
                            'member-reject': p.recommendation === '반려',
                            'member-review': p.recommendation === '팀장 판단 필요'
                          }">
                            <div class="member-top">
                              <div class="member-name">{{ p.name }}</div>
                              <div class="member-date">{{ p.startDate }} ~ {{ p.endDate }}</div>
                            </div>
                            <div class="member-body">
                              <div class="member-rec">→ {{ p.recommendation }}</div>
                              <div class="member-reason">{{ p.reason }}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
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

            <textarea
              v-model="rejectionReason"
              placeholder="반려 사유를 입력하세요"
            ></textarea>

            <div class="modal-actions">
              <button class="btn cancel" @click="closeRejectModal">취소</button>
              <button class="btn reject" @click="submitRejection">반려 처리</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
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
      aiResults: [],       // 원본 AI 결과 (server 반환)
      showRejectModal: false,
      selectedVacationId: null,
      rejectionReason: "",
      aiIcon,
      sidebarOpen: true,
    };
  },

  async created() {
    await this.loadVacations();
    await this.loadAIPredictions();
  },

  computed: {
    /* normalizedResults: aiResults를 기반으로, groups가 없으면 프론트에서 생성한 groups 포함한 결과 반환 */
    normalizedResults() {
      if (!Array.isArray(this.aiResults)) return [];

      return this.aiResults.map((team) => {
        // 1) server already provided groups -> normalize minor fields
        if (Array.isArray(team.groups) && team.groups.length > 0) {
          const normalizedGroups = team.groups.map((group) =>
            group.map((p, idx) => {
              // ensure required fields exist
              p.priorityRank = p.priorityRank != null ? p.priorityRank : (group.length >= 2 ? idx + 1 : null);
              p.group = p.group || null;
              p.urgencyLevel = p.urgencyLevel != null ? p.urgencyLevel : 0;
              return p;
            })
          );
          const flatPriority = normalizedGroups.flat();
          return {
            team: team.team,
            groups: normalizedGroups,
            priority: flatPriority,
          };
        }

        // 2) server gave priority array (no groups) -> build BFS full-overlap groups
        if (Array.isArray(team.priority)) {
          // make deep copy and ensure minimal fields
          const list = team.priority.map((p, idx) => ({
            ...p,
            _idx: idx,
            urgencyLevel: p.urgencyLevel != null ? p.urgencyLevel : 0,
            priorityRank: p.priorityRank != null ? p.priorityRank : null,
            startDate: p.startDate,
            endDate: p.endDate,
          }));

          // build groups using BFS full-overlap
          const groups = this.mergeOverlapGroups(list);

          // assign group numbers and ensure priorityRank exist inside group
          groups.forEach((g, gi) => {
            // sort by: server priorityRank (if exists) ascending, else urgencyLevel desc, else startDate asc
            g.sort((a, b) => {
              if (a.priorityRank != null && b.priorityRank != null) return a.priorityRank - b.priorityRank;
              if (a.priorityRank != null) return -1;
              if (b.priorityRank != null) return 1;
              if ((b.urgencyLevel || 0) - (a.urgencyLevel || 0) !== 0) return (b.urgencyLevel || 0) - (a.urgencyLevel || 0);
              return new Date(a.startDate) - new Date(b.startDate);
            });

            // generate priorityRank if not present
            if (g.length >= 2) {
              g.forEach((p, idx) => {
                p.priorityRank = p.priorityRank || idx + 1;
                p.group = gi + 1;
              });
            } else {
              g[0].priorityRank = null;
              g[0].group = gi + 1;
            }
          });

          const flatPriority = groups.flat();
          return {
            team: team.team,
            groups,
            priority: flatPriority,
          };
        }

        // fallback
        return { team: team.team, groups: [], priority: team.priority || [] };
      });
    },

    /* AI 추천 매핑 (name+기간 → recommendation) */
    aiRecommendationMap() {
      const map = {};
      for (const team of this.normalizedResults) {
        const lists = team.priority || team.groups?.flat() || [];
        for (const p of lists) {
          const key = `${p.name}_${p.startDate}_${p.endDate}`;
          map[key] = p.recommendation;
        }
      }
      return map;
    },

    /* 🔥 AI 순위/그룹 매핑 (priority 또는 groups 자동 처리) */
    aiPriorityMap() {
      const map = {};
      for (const team of this.normalizedResults) {
        if (Array.isArray(team.groups) && team.groups.length) {
          team.groups.forEach((group, groupIndex) => {
            group.forEach((p, rankIndex) => {
              const key = `${p.name}_${p.startDate}_${p.endDate}`;
              map[key] = {
                priorityRank: group.length >= 2 ? (p.priorityRank || rankIndex + 1) : null,
                group: groupIndex + 1,
                groupSize: group.length,
              };
            });
          });
        } else if (Array.isArray(team.priority)) {
          team.priority.forEach((p, idx) => {
            const key = `${p.name}_${p.startDate}_${p.endDate}`;
            map[key] = {
              priorityRank: p.priorityRank || null,
              group: p.group || null,
              groupSize: 1,
            };
          });
        }
      }
      return map;
    },

    /* 🔥 우선순위 정렬된 연차 리스트 (테이블에 표시되는 순서) */
    computedVacations() {
      return this.vacations.slice().sort((a, b) => {
        const keyA = `${a.user?.name}_${a.startDate}_${a.endDate}`;
        const keyB = `${b.user?.name}_${b.startDate}_${b.endDate}`;
        const recA = this.aiRecommendationMap[keyA] || "기타";
        const recB = this.aiRecommendationMap[keyB] || "기타";
        const order = { "반려": 0, "팀장 판단 필요": 1, "승인": 2, "기타": 3 };
        return order[recA] - order[recB];
      });
    },
  },

  methods: {
    /* 날짜 겹침 체크 (inclusive) */
    isOverlap(aStart, aEnd, bStart, bEnd) {
      const Astart = new Date(aStart);
      const Aend = new Date(aEnd);
      const Bstart = new Date(bStart);
      const Bend = new Date(bEnd);
      return !(Aend < Bstart || Bend < Astart);
    },

    /**
     * priority 배열에서 날짜 겹침 기준으로 그룹 생성 (단순 버전 -> 보조로 둠)
     * - 그룹 내부를 urgent(urgencyLevel) 기준 정렬
     * - 그룹 길이가 2 이상일 때 priorityRank 부여 (1..n)
     * - 반환: { groups: [...], flatPriority: [...] }
     */
    buildGroupsFromPriority(priorityArr) {
      // 안전 복사
      const list = (priorityArr || []).map((p) => ({ ...p }));

      // parse dates for safety
      list.forEach((p) => {
        p._start = new Date(p.startDate);
        p._end = new Date(p.endDate);
      });

      // sort by start date, then urgency desc
      list.sort((a, b) => {
        if (a._start - b._start !== 0) return a._start - b._start;
        return (b.urgencyLevel || 0) - (a.urgencyLevel || 0);
      });

      const used = Array(list.length).fill(false);
      const groups = [];

      for (let i = 0; i < list.length; i++) {
        if (used[i]) continue;

        const group = [list[i]];
        used[i] = true;

        for (let j = i + 1; j < list.length; j++) {
          if (used[j]) continue;
          if (this.isOverlap(list[i].startDate, list[i].endDate, list[j].startDate, list[j].endDate)) {
            group.push(list[j]);
            used[j] = true;
          }
        }
        groups.push(group);
      }

      // 정렬 및 순위 부여: 그룹 내 urgencyLevel desc
      const flatPriority = [];
      groups.forEach((group, gidx) => {
        group.sort((a, b) => (b.urgencyLevel || 0) - (a.urgencyLevel || 0));
        if (group.length >= 2) {
          group.forEach((p, idx) => {
            p.priorityRank = idx + 1;
            p.group = gidx + 1;
          });
        } else {
          group[0].priorityRank = null;
          group[0].group = gidx + 1;
        }
        flatPriority.push(...group);
      });

      return { groups, flatPriority };
    },

    /**
     * mergeOverlapGroups (BFS 완전 오버랩)
     * - 리스트의 모든 항목을 node로 보고, date-overlap 관계가 간접적이라도 연결되어 있으면 같은 그룹으로 묶음
     * - 반환: groups (array of arrays)
     */
    mergeOverlapGroups(list) {
      if (!list || list.length === 0) return [];

      // 내부 안전 ID 부여 (원본을 건드리지 않도록 사본 생성)
      const items = list.map((item, idx) => ({ ...item, _id: idx }));

      const isOverlap = (a, b) => {
        return !(
          new Date(a.endDate) < new Date(b.startDate) ||
          new Date(b.endDate) < new Date(a.startDate)
        );
      };

      const visited = new Set();
      const groups = [];

      for (let i = 0; i < items.length; i++) {
        if (visited.has(items[i]._id)) continue;

        const queue = [items[i]];
        const group = [];
        visited.add(items[i]._id);

        while (queue.length) {
          const cur = queue.shift();
          group.push(cur);

          for (let j = 0; j < items.length; j++) {
            const other = items[j];
            if (visited.has(other._id)) continue;
            if (isOverlap(cur, other)) {
              visited.add(other._id);
              queue.push(other);
            }
          }
        }

        groups.push(group);
      }

      // 그룹 내 정렬 및 priorityRank 보정
      groups.forEach((g) => {
        g.sort((a, b) => {
          // 1) 서버에서 온 priorityRank 있으면 그걸 우선
          if (a.priorityRank != null && b.priorityRank != null) return a.priorityRank - b.priorityRank;
          if (a.priorityRank != null) return -1;
          if (b.priorityRank != null) return 1;
          // 2) urgencyLevel 내림차순
          if ((b.urgencyLevel || 0) - (a.urgencyLevel || 0) !== 0) return (b.urgencyLevel || 0) - (a.urgencyLevel || 0);
          // 3) startDate 오름차순
          return new Date(a.startDate) - new Date(b.startDate);
        });

        if (g.length >= 2) {
          g.forEach((p, idx) => {
            p.priorityRank = p.priorityRank || idx + 1;
          });
        } else {
          g[0].priorityRank = null;
        }
      });

      return groups;
    },

    /* 이름 옆 표시용 → rank/group 조회 */
    getPriorityInfo(vac) {
      const key = `${vac.user?.name}_${vac.startDate}_${vac.endDate}`;
      return this.aiPriorityMap[key] || null;
    },

    getRowClass(vac) {
      if (vac.status !== "대기") return "";
      const key = `${vac.user?.name}_${vac.startDate}_${vac.endDate}`;
      const rec = this.aiRecommendationMap[key];
      if (rec === "승인") return "ai-row-approve";
      if (rec === "반려") return "ai-row-reject";
      if (rec === "팀장 판단 필요") return "ai-row-manager-review";
      return "";
    },

    /* 연차 목록 불러오기 */
    async loadVacations() {
      try {
        const res = await this.$axios.get(
          "http://localhost:3000/api/manager/vacations",
          { withCredentials: true }
        );
        if (res.data.success) this.vacations = res.data.vacations;
      } catch (err) {
        console.error("연차 목록 오류:", err);
      }
    },

    /* AI 판단 불러오기 & 정규화 */
    async loadAIPredictions() {
      try {
        const today = new Date().toISOString().split("T")[0];
        const res = await this.$axios.post(
          "http://localhost:3000/api/ai/vacations/ai-vacation-priority",
          { targetDate: today },
          { withCredentials: true }
        );

        if (res.data.results) {
          // 서버가 results 형태로 내려줄 때를 고려
          this.aiResults = Array.isArray(res.data.results)
            ? res.data.results
            : [res.data.results];
        } else if (res.data.teams) {
          // 혹시 서버에서 teams 라는 필드로 보낼 경우
          this.aiResults = Array.isArray(res.data.teams) ? res.data.teams : [res.data.teams];
        } else if (res.data) {
          // fallback
          this.aiResults = Array.isArray(res.data) ? res.data : [res.data];
        } else {
          this.aiResults = [];
        }

        // aiResults 설정 후: normalizedResults computed 프로퍼티가 groups를 자동 생성합니다.
      } catch (err) {
        console.error("AI 판단 불러오기 오류:", err);
      }
    },

    /* 승인/반려 */
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
          this.loadAIPredictions();
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
          this.loadAIPredictions();
        }
      } catch (err) {
        console.error("반려 오류:", err);
      }
    },

    /* AI 추천 자동 적용 */
    async applyAIResults() {
      try {
        const payload = [];

        for (const team of this.normalizedResults) {
          const lists = team.priority || team.groups?.flat() || [];

          for (const p of lists) {
            const target = this.vacations.find(
              v =>
                v.user?.name === p.name &&
                v.startDate === p.startDate &&
                v.endDate === p.endDate
            );

            if (target) {
              payload.push({
                name: p.name,
                vacationId: target.vacation_id,
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
          this.loadAIPredictions();
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
/* ===== 전체 관리자 레이아웃 ===== */
.manager-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

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

.layout-body {
  margin-top: 60px;
  display: flex;
}

.page-wrapper {
  display: flex;
  width: 100%;
  margin-left: 240px;
  transition: margin-left 0.3s ease;
}

.page-wrapper.sidebar-hidden {
  margin-left: 0;
}

.manager-sidebar-fixed {
  position: fixed;
  top: 60px;
  left: 0;
  width: 240px;
  height: calc(100vh - 60px);
  background: #ffffff;
  border-right: 1px solid #e5e7eb;
  overflow-y: auto;
  z-index: 150;
}

/* 테이블 하이라이트 */
.ai-row-approve {
  background-color: #e9f7ee !important;
}
.ai-row-reject {
  background-color: #fdecec !important;
}
.ai-row-manager-review {
  background-color: #fef3c7 !important;
}

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

.team-title {
  margin: 0 0 8px 0;
}

/* ===== 그룹 박스 스타일 ===== */
.groups-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 각 그룹을 박스로 묶음 */
.group-box {
  border: 1px solid #e6edf3;
  border-radius: 12px;
  padding: 12px;
  background: #fbfdff;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.03);
}

/* 단건(그룹이 아닌 단독 항목) 박스 */
.group-box.single-box {
  background: #ffffff;
}

/* 그룹 헤더 */
.group-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 10px;
}

.group-title {
  font-weight: 700;
  color: #0f172a;
}

.group-sub {
  font-size: 0.85rem;
  color: #6b7280;
}

/* 멤버 카드 */
.group-members {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.member-card {
  padding: 10px;
  border-radius: 8px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 6px;
  border: 1px solid #eef2f7;
}

.member-top {
  display: flex;
  gap: 12px;
  align-items: baseline;
}

.member-rank {
  font-weight: 800;
  color: #0f172a;
  min-width: 36px;
}

.member-name {
  font-weight: 700;
  color: #111827;
}

.member-date {
  margin-left: auto;
  color: #6b7280;
  font-size: 0.9rem;
}

.member-body {
  color: #374151;
  font-size: 0.92rem;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.member-rec {
  font-weight: 600;
}

.member-reason {
  color: #6b7280;
  font-size: 0.9rem;
}

/* 색상 변형 */
.member-approve { border-left: 4px solid #16a34a; }
.member-reject { border-left: 4px solid #dc2626; }
.member-review { border-left: 4px solid #b45309; }

/* 작은 배지(테이블 이름 옆) */
.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.75rem;
  margin-left: 6px;
}
.badge.small { font-size: 0.72rem; padding: 2px 6px; }
.badge.muted { background: #f3f4f6; color: #374151; }

/* 기타 */
.ai-approve {
  color: #16a34a;
  font-weight: 600;
}
.ai-reject {
  color: #dc2626;
  font-weight: 600;
}
.ai-manager-review {
  color: #b45309;
  font-weight: 600;
}

.ai-empty {
  color: #9ca3af;
  text-align: center;
  padding: 2rem 0;
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
  margin-right: 6px;
}

.ai-apply-btn {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: white;
  border: none;
  padding: 12px 18px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  display: inline-flex;
  align-items: center;
  gap: 8px;

  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25);
  transition: 0.2s ease;
}

.ai-apply-btn:hover {
  background: linear-gradient(135deg, #1e40af, #1d4ed8);
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(30, 64, 175, 0.35);
}

.ai-apply-btn:active {
  transform: translateY(0px);
  box-shadow: 0 3px 8px rgba(30, 64, 175, 0.25);
}



</style>
