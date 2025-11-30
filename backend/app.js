var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var { Sequelize } = require("sequelize");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const cors = require("cors");

var app = express();

// ======================================
// ✅ 1. MySQL & Sequelize 연결
// ======================================
require('dotenv').config();
var connection = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: "localhost",
  dialect: "mysql",
  logging: false, // SQL 로그 숨김
});

// ======================================
// ✅ 2. 모델 불러오기 및 정의 실행
// ======================================
var define = require("./model.js");
const { User, Department, Team, Task, Vacation, Attendance, PeerReview, NextDayTodo, ReplacementEntry, PerformanceEvaluation } = define(connection);

// ✅ 전역 모델 등록 (라우터에서 바로 사용 가능)
global.User = User;
global.Department = Department;
global.Team = Team;
global.Task = Task;
global.Vacation = Vacation;
global.Attendance = Attendance;
global.PeerReview = PeerReview;
global.NextDayTodo = NextDayTodo;
global.ReplacementEntry = ReplacementEntry; 
global.PerformanceEvaluation = PerformanceEvaluation;
// ======================================
// ✅ 3. 세션 설정 (MySQL 세션 저장소)
// ======================================
const sessionStore = new MySQLStore({
  host: "localhost",
  port: 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

// ======================================
// ✅ 4. 미들웨어 설정
// ======================================
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// ✅ CORS (Vue 개발 서버 연결 허용)
app.use(
  cors({
    origin: "http://localhost:8080",
    credentials: true,
  })
);

// ✅ 세션 등록 (라우터보다 위)
app.use(
  session({
    key: "session_cookie_name",
    secret: "secret_key",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 }, // 1시간
  })
);

// ======================================
// ✅ 5. 라우터 등록
// ======================================
var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var loginRouter = require("./routes/login");
var departmentRouter = require("./routes/admin/department");
var registerRouter = require("./routes/register");
var userManageRouter = require("./routes/admin/userManage");
var vacationRouter = require("./routes/employee/vacation");
var managerVacations = require("./routes/manager/vacations");

// employee tasks 라우터
var employeeTasksRouter = require("./routes/employee/tasks");
// employee calendar 라우터
var employeeCalendarRouter = require("./routes/employee/calendar");
var vacationNoticeRouter = require("./routes/employee/VacationNotice");
// AI 분석용 라우터
var aiTaskRouter = require("./routes/api/apiTask");
var aiVacationRouter = require("./routes/api/apiVacation");


var attendanceRouter = require("./routes/employee/attendance");
var peerReviewRouter = require("./routes/employee/peerReview");
var teamTaskDashboard = require("./routes/manager/teamTaskDashboard");


// ✅ 절대경로로 calendar.js 확실하게 로드
const calendarRouterPath = path.join(__dirname, "routes", "manager", "calendar.js");
console.log("📁 Calendar Router 경로:", calendarRouterPath);
try {
  var calendarRouter = require(calendarRouterPath);
  console.log("✅ Manager Calendar Router 로드 완료!");
} catch (err) {
  console.error("❌ Calendar Router 로드 실패:", err.message);
}

// ======================================
// ✅ 6. View 엔진 설정
// ======================================
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

// ======================================
// ✅ 7. 실제 라우터 적용
// ======================================
app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/api", loginRouter);
app.use("/api/department", departmentRouter);
app.use("/api/register", registerRouter);
app.use("/admin/users", userManageRouter);
app.use("/api/vacations", vacationRouter);
app.use("/api/manager/vacations", managerVacations);
app.use("/api/vacation-notice", vacationNoticeRouter);

app.use("/api/ai", aiTaskRouter);        // AI 분석용
app.use("/api/tasks", employeeTasksRouter);
app.use("/api/calendar", employeeCalendarRouter);  // 팀원용 캘린더
// ✅ 추가: AI 연차 판단 엔드포인트 등록
app.use("/api/ai/vacations", aiVacationRouter);


app.use("/api/attendance", attendanceRouter);
app.use("/api/peer-review", peerReviewRouter);
app.use("/api/manager", teamTaskDashboard);

app.use("/api/manager", require("./routes/manager/team"));
app.use("/api/ai/performance", require("./routes/api/aiPerformance"));
app.use("/api/ai/performance", require("./routes/manager/save-evaluation"));

// ✅ Calendar 라우터 등록
if (calendarRouter) {
  app.use("/api/calendar", calendarRouter);
} else {
  console.warn("⚠️ calendarRouter가 로드되지 않아 /api/calendar 비활성화됨");
}

// ======================================
// ✅ 8. 오류 처리
// ======================================
app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  console.error("❌ 서버 오류:", err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message,
  });
});

module.exports = app;
