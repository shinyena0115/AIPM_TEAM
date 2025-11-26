/* =========================================================
   AI Task Analysis API

   이 파일은 OpenAI GPT를 활용한 업무 분석 기능만 제공합니다.
   업무 CRUD는 /api/tasks (routes/employee/tasks.js)를 사용하세요.

   제공 기능:
   - POST /api/ai/analyze-documents      : 이미지/PDF 문서 AI 분석
   - POST /api/ai/tasks/ai-priority      : AI 업무 우선순위 추천
   - POST /api/ai/analyze-simple-task    : 간단 업무 AI 분석
========================================================= */

var express = require('express');
var router = express.Router();
var OpenAI = require('openai');
var openaiClient = new OpenAI();
var multer = require('multer');
var fs = require('fs');
var path = require('path');
var pdfParse = require('pdf-parse');
const Task = global.Task;


// 이미지 저장 디렉토리
var uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer 설정 (이미지 + PDF 업로드)
var upload = multer({
  dest: uploadDir,
  fileFilter: (req, file, cb) => {
    // 이미지와 PDF 허용
    var allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('JPG, PNG 이미지 또는 PDF 파일만 업로드 가능합니다'), false);
    }
  }
});

// CORS 설정
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:8080');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

/* =========================================================
   AI 업무 분석 API
   - 문서 분석 (이미지/PDF)
   - AI 우선순위 추천
   - 간단 업무 분석
========================================================= */

// 여러 협조문 파일 분석 (이미지, PDF, 텍스트 지원)
router.post('/analyze-documents', upload.array('documents', 10), async (req, res) => {
  // ✅ (1) 로그인 세션 확인
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "로그인이 필요합니다.",
      });
    }

    const userId = user.id; // 로그인된 사용자 id
    console.log("✅ 로그인된 사용자 ID:", userId);

  try {
    var documentFiles = req.files;
    var mergePages = req.body.mergePages === 'true';
    var textInput = req.body.textInput; // 텍스트 직접 입력

    // 파일도 없고 텍스트도 없으면 에러
    if ((!documentFiles || documentFiles.length === 0) && !textInput) {
      return res.json({
        success: false,
        error: '파일을 업로드하거나 텍스트를 입력해주세요'
      });
    }

    var analyses = [];

    // ===== 텍스트 직접 입력 처리 =====
    if (textInput && textInput.trim()) {
      console.log('📝 텍스트 직접 입력 분석 시작');
      try {
        var textAnalysisPrompt = `이 업무 요청 내용을 분석하여 다음 정보를 추출해주세요:

업무 내용:
${textInput}

1. 업무 제목 (제목 또는 주요 내용을 간단명료하게)
2. 마감일 (YYYY-MM-DD 형식) - "제출 기한", "회신 기한" 등의 키워드 찾기
3. 마감 시간 (HH:MM 형식, 없으면 "17:00"로 설정)
4. 중요도 (낮음/중간/높음)
5. 난이도 (쉬움/보통/어려움)
6. 예상 소요시간 (분 단위, 숫자만)
7. 업무 유형 (기획/개발/버그수정/회의)
8. 판단 근거`;

        var textResponse = await openaiClient.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "당신은 웹개발자의 업무 요청을 분석하는 전문가입니다. 텍스트에서 마감일과 중요 정보를 정확하게 추출합니다."
            },
            {
              role: "user",
              content: textAnalysisPrompt
            }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "document_analysis",
              schema: {
                type: "object",
                properties: {
                  title: { type: "string", description: "업무 제목" },
                  deadlineDate: { type: "string", description: "마감 날짜 YYYY-MM-DD" },
                  deadlineTime: { type: "string", description: "마감 시간 HH:MM" },
                  importance: { type: "string", enum: ["낮음", "중간", "높음"] },
                  difficulty: { type: "string", enum: ["쉬움", "보통", "어려움"] },
                  estimatedTime: { type: "number", description: "예상 소요시간(분)" },
                  taskType: { type: "string", enum: ["기획", "개발", "버그수정", "회의"] },
                  reason: { type: "string", description: "판단 근거" }
                },
                required: ["title", "deadlineDate", "deadlineTime", "importance", "difficulty", "estimatedTime", "taskType", "reason"],
                additionalProperties: false
              }
            }
          }
        });

        var textAnalysis = JSON.parse(textResponse.choices[0].message.content);
        console.log('✅ 텍스트 분석 완료:', textAnalysis);

        analyses.push({
          fileName: '텍스트 입력',
          ...textAnalysis
        });
      } catch (textError) {
        console.error('❌ 텍스트 분석 실패:', textError);
        analyses.push({
          fileName: '텍스트 입력',
          error: '분석 실패: ' + textError.message
        });
      }
    }

    // ===== 파일 업로드 처리 =====
    if (documentFiles && documentFiles.length > 0) {
      console.log('📁 업로드된 파일:', documentFiles.length, '개');
      console.log('여러 페이지 합치기:', mergePages);
      console.log('원본 파일명들:', documentFiles.map(f => Buffer.from(f.originalname, 'latin1').toString('utf8')));

    // 여러 페이지를 하나로 합치는 경우
    if (mergePages && documentFiles.length > 1) {
      try {
        var allFileNames = documentFiles.map(f => Buffer.from(f.originalname, 'latin1').toString('utf8')).join(', ');
        console.log('여러 페이지 협조문 분석:', allFileNames);
        
        // 모든 이미지를 하나의 메시지로 전송
        var imageContents = [];
        for (var file of documentFiles) {
          var base64 = fs.readFileSync(file.path, { encoding: 'base64' });
          imageContents.push({
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64}`
            }
          });
        }
        
        // 텍스트 프롬프트 추가
        imageContents.push({
          type: "text",
          text: `이 ${documentFiles.length}장의 이미지는 하나의 협조문입니다. 모든 페이지를 함께 분석하여 업무 정보를 추출해주세요.

1. 업무 제목 (제목 또는 주요 내용을 간단명료하게)

2. ⭐⭐⭐ 마감일 (YYYY-MM-DD 형식) - 매우 중요! ⭐⭐⭐
   여러 날짜가 있을 경우, 다음 우선순위로 찾으세요:
   1순위: "제출 기한", "제출 마감", "회신 기한", "까지 준수" 옆의 날짜
   2순위: 일정 표에서 "조사 제출", "제출 기간"의 마지막 날짜
   3순위: 가장 늦은 날짜
   
   ❌ 주의: "계획 수립", "안내", "공문", "점검일" 날짜는 마감일이 아닙니다!

3. 마감 시간 (HH:MM 형식, 없으면 "17:00"로 설정)
4. 중요도 (낮음/중간/높음 중 선택)
5. 난이도 (쉬움/보통/어려움 중 선택)
6. 예상 소요시간 (분 단위, 숫자만)
7. 업무 유형 (전화/이메일/문서작업/대면업무 중 선택)
8. 판단 근거`
        });
        
        var mergedResponse = await openaiClient.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `당신은 웹개발자의 업무 요청서를 분석하는 전문가입니다.
여러 페이지로 구성된 문서를 분석할 때는 모든 페이지를 종합적으로 검토하여 정확한 마감일을 찾아야 합니다.

마감일 찾기 규칙:
1. "제출 기한", "회신 기한", "까지 준수", "까지 회신" 키워드 옆 날짜가 최우선
2. 일정표에서 "제출", "회신", "완료"가 포함된 가장 마지막 날짜
3. "점검일", "실시일", "안내일", "공문일"은 마감일이 아님`
            },
            {
              role: "user",
              content: imageContents
            }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "document_analysis",
              schema: {
                type: "object",
                properties: {
                  title: { type: "string", description: "업무 제목" },
                  deadlineDate: { type: "string", description: "마감 날짜 YYYY-MM-DD" },
                  deadlineTime: { type: "string", description: "마감 시간 HH:MM" },
                  importance: { type: "string", enum: ["낮음", "중간", "높음"] },
                  difficulty: { type: "string", enum: ["쉬움", "보통", "어려움"] },
                  estimatedTime: { type: "number", description: "예상 소요시간(분)" },
                  taskType: { type: "string", enum: ["기획", "개발", "버그수정", "회의"] },
                  reason: { type: "string", description: "판단 근거" }
                },
                required: ["title", "deadlineDate", "deadlineTime", "importance", "difficulty", "estimatedTime", "taskType", "reason"],
                additionalProperties: false
              }
            }
          }
        });

        var analysis = JSON.parse(mergedResponse.choices[0].message.content);
        console.log('합쳐진 협조문 AI 분석 결과:', analysis);

        analyses.push({
          fileName: `${allFileNames} (총 ${documentFiles.length}장)`,
          ...analysis
        });

        // 모든 파일 삭제
        documentFiles.forEach(file => fs.unlinkSync(file.path));

      } catch (mergeError) {
        console.error('여러 페이지 분석 실패:', mergeError);
        documentFiles.forEach(file => {
          try {
            fs.unlinkSync(file.path);
          } catch (e) {
            console.error('파일 삭제 실패:', e);
          }
        });
        
        analyses.push({
          fileName: '여러 페이지 협조문',
          error: '분석 실패: ' + mergeError.message
        });
      }
    } else {
      // 각 파일을 개별적으로 분석
      for (var documentFile of documentFiles) {
        try {
          // 한글 파일명 디코딩
          var originalFileName = Buffer.from(documentFile.originalname, 'latin1').toString('utf8');
          console.log('처리 중인 파일:', originalFileName);

          var contentForAI = null;
          var isPDF = documentFile.mimetype === 'application/pdf';

          // PDF 파일 처리
          if (isPDF) {
            console.log('📄 PDF 파일 처리 중:', originalFileName);
            var dataBuffer = fs.readFileSync(documentFile.path);
            var pdfData = await pdfParse(dataBuffer);
            contentForAI = pdfData.text; // PDF에서 추출한 텍스트
            console.log('PDF 텍스트 추출 완료:', contentForAI.substring(0, 200) + '...');
          } else {
            // 이미지 파일 처리
            console.log('🖼️ 이미지 파일 처리 중:', originalFileName);
            contentForAI = fs.readFileSync(documentFile.path, { encoding: 'base64' });
          }
          
          // PDF와 이미지에 따라 다른 프롬프트 구성
          var analysisPrompt = isPDF
            ? `이 업무 요청서 내용을 분석하여 다음 정보를 추출해주세요:

업무 내용:
${contentForAI}

1. 업무 제목 (제목 또는 주요 내용을 간단명료하게)
2. 마감일 (YYYY-MM-DD 형식)
3. 마감 시간 (HH:MM 형식, 없으면 "17:00"로 설정)
4. 중요도 (낮음/중간/높음)
5. 난이도 (쉬움/보통/어려움)
6. 예상 소요시간 (분 단위, 숫자만)
7. 업무 유형 (기획/개발/버그수정/회의)
8. 판단 근거`
            : `이 업무 요청서 이미지를 정확하게 읽고 분석하여 다음 정보를 추출해주세요:

1. 업무 제목 (제목 또는 주요 내용을 간단명료하게)
2. 마감일 (YYYY-MM-DD 형식) - "제출 기한", "회신 기한" 등의 키워드 찾기
3. 마감 시간 (HH:MM 형식, 없으면 "17:00"로 설정)
4. 중요도 (낮음/중간/높음)
5. 난이도 (쉬움/보통/어려움)
6. 예상 소요시간 (분 단위, 숫자만)
7. 업무 유형 (기획/개발/버그수정/회의)
8. 판단 근거`;

          // PDF일 때는 텍스트만, 이미지일 때는 이미지 + 텍스트
          var messageContent = isPDF
            ? analysisPrompt
            : [
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${contentForAI}`
                  }
                },
                {
                  type: "text",
                  text: analysisPrompt
                }
              ];

          var fileResponse = await openaiClient.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "당신은 웹개발자의 업무 요청을 분석하는 전문가입니다. 텍스트나 이미지에서 마감일과 중요 정보를 정확하게 추출합니다."
              },
              {
                role: "user",
                content: messageContent
              }
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "document_analysis",
                schema: {
                  type: "object",
                  properties: {
                    title: { type: "string", description: "업무 제목" },
                    deadlineDate: { type: "string", description: "마감 날짜 YYYY-MM-DD" },
                    deadlineTime: { type: "string", description: "마감 시간 HH:MM" },
                    importance: { type: "string", enum: ["낮음", "중간", "높음"] },
                    difficulty: { type: "string", enum: ["쉬움", "보통", "어려움"] },
                    estimatedTime: { type: "number", description: "예상 소요시간(분)" },
                    taskType: { type: "string", enum: ["기획", "개발", "버그수정", "회의"] },
                    reason: { type: "string", description: "판단 근거" }
                  },
                  required: ["title", "deadlineDate", "deadlineTime", "importance", "difficulty", "estimatedTime", "taskType", "reason"],
                  additionalProperties: false
                }
              }
            }
          });

          var analysis = JSON.parse(fileResponse.choices[0].message.content);

          console.log('AI 분석 결과:', analysis);

          analyses.push({
            fileName: originalFileName,
            ...analysis
          });

          // 파일 삭제 (분석 완료 후)
          fs.unlinkSync(documentFile.path);

        } catch (fileError) {
          console.error('파일 분석 실패:', Buffer.from(documentFile.originalname, 'latin1').toString('utf8'), fileError);
          
          // 실패한 파일도 삭제
          try {
            fs.unlinkSync(documentFile.path);
          } catch (unlinkError) {
            console.error('파일 삭제 실패:', unlinkError);
          }

          analyses.push({
            fileName: Buffer.from(documentFile.originalname, 'latin1').toString('utf8'),
            error: '분석 실패: ' + fileError.message
          });
        }
      }
    }
    }

    res.json({
      success: true,
      analyses: analyses
    });

  } catch (error) {
    console.error('문서 분석 에러:', error);
    
    // 에러 발생 시 업로드된 모든 파일 삭제
    if (req.files) {
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (unlinkError) {
          console.error('파일 삭제 실패:', unlinkError);
        }
      });
    }

    res.json({
      success: false,
      error: '문서 분석에 실패했습니다: ' + error.message
    });
  }
});

// AI 우선순위 추천 (개선된 버전)
router.post('/tasks/ai-priority', async (req, res) => {
  var taskList = req.body.tasks;

  if (!taskList || taskList.length === 0) {
    return res.json({
      success: false,
      error: '추천할 업무가 없습니다'
    });
  }

  // 현재 시각 기준 긴급도 계산
  var now = new Date();
  var tasksWithUrgency = taskList.map((task, index) => {
    var deadline = new Date(task.deadline);
    var hoursLeft = (deadline - now) / (1000 * 60 * 60);
    var daysLeft = Math.floor(hoursLeft / 24);

    var urgencyLevel = '';
    if (hoursLeft < 0) urgencyLevel = '⚠️ 지연됨';
    else if (hoursLeft <= 24) urgencyLevel = '🔴 긴급 (24시간 이내)';
    else if (hoursLeft <= 48) urgencyLevel = '🟠 급함 (48시간 이내)';
    else if (daysLeft <= 7) urgencyLevel = '🟡 임박 (1주일 이내)';
    else urgencyLevel = '🟢 여유 있음';

    return {
      ...task,
      index: index + 1,
      hoursLeft: hoursLeft,
      daysLeft: daysLeft,
      urgencyLevel: urgencyLevel
    };
  });

  // 업무 목록을 상세하게 텍스트로 변환
  var taskText = tasksWithUrgency.map((task) => {
    var descriptionText = task.description ? `\n   📝 상세: ${task.description}` : '';
    return `${task.index}. 【${task.taskType}】 ${task.title}${descriptionText}
   ⏰ 마감: ${task.deadline} ${task.urgencyLevel}
   ⚡ 중요도: ${task.importance} | 난이도: ${task.difficulty} | 소요시간: ${task.estimatedTime}분`;
  }).join('\n\n');

  console.log('=== AI 우선순위 분석 요청 ===');
  console.log(taskText);
  console.log('============================');

  var prompt = `당신은 소프트웨어 개발팀의 업무 관리 전문가입니다.
아래 업무들을 종합적으로 분석하여 가장 효율적인 처리 순서를 추천해주세요.

📋 **업무 목록** (총 ${taskList.length}개):
${taskText}

⏱️ **현재 시각**: ${now.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}

---

🎯 **우선순위 결정 기준**:

1. **긴급도 & 마감일** (최우선)
   - 24시간 이내 마감 업무는 즉시 처리 필요
   - 지연된 업무는 최우선 처리
   - 마감일이 가까울수록 우선순위 상승

2. **중요도** (핵심 기준)
   - "높음": 비즈니스 임팩트가 큰 업무, 다른 업무를 블로킹하는 업무
   - "중간": 일반적인 업무
   - "낮음": 늦어져도 큰 영향이 없는 업무

3. **업무 유형별 특성**:

   🔹 **회의 (Meeting)**
   - 회의 내용/참석자의 중요도 분석 필수
   - CEO/임원 참석 회의 = 최우선
   - 의사결정 회의 > 정기 보고 회의
   - 준비 시간 고려 (자료 준비 필요 시 더 일찍 시작)

   🔹 **개발 (Development)**
   - 다른 팀원을 블로킹하는 작업인지 확인
   - 배포/릴리즈와 연관성 체크
   - 코드 리뷰 시간 고려

   🔹 **버그수정 (Bug Fix)**
   - 프로덕션 이슈 = 최우선
   - 사용자 영향도 평가 (많은 사용자 영향 = 긴급)
   - Hot-fix 필요 여부 판단

   🔹 **기획 (Planning)**
   - 다른 업무의 선행 작업인지 확인
   - 의사결정 필요 여부

4. **난이도 & 소요시간**
   - 어려운 업무는 집중력이 높은 시간대(오전)에 배치
   - 짧은 업무(15-30분)는 틈새 시간에 처리 가능
   - 긴 업무(2시간+)는 방해받지 않는 시간대에

5. **업무 간 의존성**
   - 이 업무가 완료되어야 다른 업무를 시작할 수 있는가?
   - 다른 팀원의 업무를 블로킹하고 있는가?
   - 외부 의존성(API, 디자인, 기획서 등) 확인

---

📝 **응답 형식** (모든 업무에 대해):

**1순위: [업무명]**
⭐ 선정 이유:
- 긴급도: [지금 처리해야 하는 이유]
- 중요도: [비즈니스/팀에 미치는 영향]
- 업무 특성: [이 업무 유형의 특별한 고려사항]
- 의존성: [다른 업무와의 관계]

**2순위: [업무명]**
⭐ 선정 이유:
- 긴급도: ...
- 중요도: ...
- 업무 특성: ...
- 의존성: ...

(모든 업무에 대해 순위 부여)

---

💡 **전체 업무 처리 전략**:
[시간대별 권장사항, 주의사항, 실용적인 팁을 포함한 종합 조언]`;

  try {
    var response = await openaiClient.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "당신은 10년 경력의 소프트웨어 개발팀 프로젝트 매니저입니다. 업무의 맥락을 깊이 이해하고, 팀의 생산성을 최대화하는 실용적인 조언을 제공합니다."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    var recommendation = response.choices[0].message.content;

    console.log('✅ AI 우선순위 추천 완료');

    res.json({
      success: true,
      recommendation: recommendation
    });

  } catch (error) {
    console.error('❌ AI 추천 에러:', error);
    res.json({
      success: false,
      error: 'AI 추천에 실패했습니다: ' + error.message
    });
  }
});

// ===== 간단 업무 분석 (제목 + 마감일만으로 AI 분석) =====
router.post('/analyze-simple-task', async (req, res) => {
  try {
    const { title, deadline } = req.body;

    if (!title || !deadline) {
      return res.json({
        success: false,
        error: '제목과 마감일을 입력해주세요'
      });
    }

    const prompt = `다음 업무를 분석해주세요:

업무 제목: ${title}
마감일: ${deadline}

이 업무의 다음 항목을 판단해주세요:
1. 난이도 (쉬움/보통/어려움)
   - 업무의 기술적 복잡도와 요구되는 전문성을 고려
2. 업무 유형 (기획/개발/버그수정/회의)
   - 업무 제목에서 가장 적합한 유형 선택
3. 중요도 (낮음/중간/높음)
   - 마감일 임박도와 업무의 영향도를 고려
   - 거래처, 고객, 핵심 기능 관련은 중요도 높음
4. 예상 소요시간 (분 단위, 숫자만)
   - 일반적인 개발자 기준으로 예상되는 시간
5. 판단 근거
   - 위 판단의 이유를 간단히 설명`;

    const response = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "당신은 웹개발 업무를 분석하는 전문가입니다. 업무 제목과 마감일을 보고 적절한 난이도, 유형, 중요도를 판단합니다."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "simple_task_analysis",
          schema: {
            type: "object",
            properties: {
              difficulty: {
                type: "string",
                enum: ["쉬움", "보통", "어려움"],
                description: "업무 난이도"
              },
              taskType: {
                type: "string",
                enum: ["기획", "개발", "버그수정", "회의"],
                description: "업무 유형"
              },
              importance: {
                type: "string",
                enum: ["낮음", "중간", "높음"],
                description: "업무 중요도"
              },
              estimatedTime: {
                type: "number",
                description: "예상 소요시간(분)"
              },
              reason: {
                type: "string",
                description: "판단 근거"
              }
            },
            required: ["difficulty", "taskType", "importance", "estimatedTime", "reason"],
            additionalProperties: false
          }
        }
      }
    });

    const analysis = JSON.parse(response.choices[0].message.content);
    console.log('✅ 간단 업무 AI 분석 완료:', analysis);

    res.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('❌ 간단 업무 분석 실패:', error);
    res.json({
      success: false,
      error: 'AI 분석에 실패했습니다: ' + error.message
    });
  }
});


module.exports = router;