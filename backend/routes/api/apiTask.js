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

// 메모리에 업무 저장
var tasks = [];
var nextId = 1;



// 업무 추가
router.post('/tasks', (req, res) => {
  var newTask = {
    id: nextId++,
    user_id: req.body.user_id,   // 👈 로그인한 사용자 ID 추가
    title: req.body.title,
    deadline: req.body.deadline,
    estimatedTime: req.body.estimatedTime,
    difficulty: req.body.difficulty,
    taskType: req.body.taskType,
    importance: req.body.importance, 
    createdAt: new Date(),
    completed: false
  };
  
  tasks.push(newTask);
  
  res.json({ 
    success: true, 
    task: newTask 
  });
});
// 모든 업무 조회
router.get('/tasks', (req, res) => {
 const userId = req.query.user_id;
  const userTasks = tasks.filter(t => t.user_id == userId); // 👈 user_id 없으면 빈 배열
  res.json({ 
    success: true, 
    tasks: userTasks 
  });
});

// 업무 완료 처리
router.patch('/tasks/:id/complete', (req, res) => {
  var taskId = parseInt(req.params.id);
  var task = tasks.find(t => t.id === taskId);
  
  if (task) {
    task.completed = true;
    task.completedAt = new Date();
    res.json({ success: true, task: task });
  } else {
    res.json({ success: false, error: '업무를 찾을 수 없습니다' });
  }
});

// 업무 삭제
router.delete('/tasks/:id', (req, res) => {
  var taskId = parseInt(req.params.id);
  tasks = tasks.filter(t => t.id !== taskId);
  res.json({ success: true });
});

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

// AI 우선순위 추천
router.post('/tasks/ai-priority', async (req, res) => {
  var taskList = req.body.tasks;
  
  if (!taskList || taskList.length === 0) {
    return res.json({ 
      success: false, 
      error: '추천할 업무가 없습니다' 
    });
  }

  // 업무 목록을 텍스트로 변환
  var taskText = taskList.map((task, index) => {
    return `${index + 1}. ${task.title}
   - 마감: ${task.deadline}
   - 예상 소요시간: ${task.estimatedTime}분
   - 난이도: ${task.difficulty}
   - 유형: ${task.taskType}
   - 중요도: ${task.importance}`;
  }).join('\n\n');

  console.log('=== 전송된 업무 데이터 ===');
  console.log(taskText);
  console.log('========================');

  var prompt = `당신은 업무 관리 전문가입니다.
아래 업무들을 분석하여 가장 효율적인 처리 순서를 추천해주세요.

업무 목록:
${taskText}

현재 시각: ${new Date().toLocaleString('ko-KR')}

우선순위 결정 기준 (중요도 순):
1. **중요도**: 높음 > 중간 > 낮음 (가장 중요한 기준!)
   - 중요도 "높음"은 절대 늦어지면 안 되는 업무
   - 중요도 "낮음"은 늦어져도 큰 리스크가 없는 업무
2. **마감일**: 임박한 순서대로
3. **소요시간**: 짧은 업무를 먼저 처리하면 심리적 부담 감소
4. **난이도**: 어려운 업무는 집중력이 높은 시간대에
5. **업무 유형**: 전화는 업무시간, 문서작업은 조용한 시간

중요: 같은 마감일이어도 중요도가 높은 업무를 반드시 먼저 추천하세요!

다음 형식으로 답변해주세요:

1순위: [업무명]
이유: [중요도를 언급하며 이 업무를 먼저 처리해야 하는 구체적인 이유]

2순위: [업무명]
이유: [중요도를 언급하며 구체적인 이유]

3순위: [업무명]
이유: [중요도를 언급하며 구체적인 이유]

추가 조언: [전체적인 업무 처리에 대한 실용적인 팁]`;

  try {
    // 올바른 Chat Completions API 사용
    var response = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "당신은 웹개발자의 업무를 돕는 업무 관리 전문가입니다. 업무의 중요도를 최우선으로 고려하여 추천합니다."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });

    var recommendation = response.choices[0].message.content;
    
    console.log('AI 추천 완료:', recommendation);
    
    res.json({ 
      success: true, 
      recommendation: recommendation 
    });

  } catch (error) {
    console.error('AI 추천 에러:', error);
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