const { Sequelize, DataTypes } = require("sequelize");

function define(connection) {
  // ✅ 사용자 테이블
  const User = connection.define("users", {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("Employee", "Manager", "Admin"),
      defaultValue: "Employee",
    },
    status: {
      type: DataTypes.ENUM("pending", "active", "rejected"),
      defaultValue: "pending",
    },
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "departments", key: "id" },
    },
    team_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "teams", key: "id" },
    },
  });

  // ✅ 부서 테이블
  const Department = connection.define("departments", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  });

  // ✅ 팀 테이블
  const Team = connection.define("teams", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "departments", key: "id" },
    },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  });

  // ✅ 업무(Task) 테이블
const Task = connection.define("tasks", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "users", key: "user_id" },
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  estimated_time: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  difficulty: {
    type: DataTypes.ENUM("쉬움", "보통", "어려움"),
    allowNull: false,
  },
  taskType: {
    type: DataTypes.ENUM("전화", "이메일", "문서작업", "대면업무"),
    allowNull: false,
  },
  importance: {
    type: DataTypes.ENUM("낮음", "중간", "높음"),
    allowNull: false,
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

const Vacation = connection.define("Vacation", {
    vacation_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    startDate: { type: DataTypes.DATEONLY, allowNull: false },
    endDate: { type: DataTypes.DATEONLY, allowNull: false },
    reason: { type: DataTypes.STRING(255), allowNull: false },
    status: { type: DataTypes.STRING(20), defaultValue: "대기" },
    // ✅ 반려 사유 컬럼 추가
  rejection_reason: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: "매니저가 반려할 때 입력한 사유",
  },
  });




  // ✅ 관계 설정 (1:N, 명시적 별칭)
  Department.hasMany(Team, { foreignKey: "department_id", as: "Teams" });
  Team.belongsTo(Department, { foreignKey: "department_id", as: "Department" });

  Department.hasMany(User, { foreignKey: "department_id", as: "Users" });
  Team.hasMany(User, { foreignKey: "team_id", as: "Users" });

  User.belongsTo(Department, { foreignKey: "department_id", as: "Department" });
  User.belongsTo(Team, { foreignKey: "team_id", as: "Team" });

  // ✅ 사용자 ↔ 업무 관계 (1:N)
  User.hasMany(Task, { foreignKey: "user_id", as: "Tasks" });
  Task.belongsTo(User, { foreignKey: "user_id", as: "User" });



  
// ✅ 사용자 ↔ 연차 관계 (1:N)
User.hasMany(Vacation, { foreignKey: "user_id", as: "Vacations" });
Vacation.belongsTo(User, { foreignKey: "user_id", as: "user" }); // 👈 as 추가




  // ✅ 테이블 생성 (force: false → 기존 데이터 유지)
  //connection.sync({ alter: true });

    // ======================
  // ✅ 동기화 (테이블 초기화)
  // ======================
 //connection.sync({ force: true })
  //.then(() => console.log("✅ DB 초기화 완료 (모든 테이블 재생성됨)"))
  //.catch(err => console.error("❌ DB 초기화 오류:", err));

  


    return { User, Department, Team, Task, Vacation  };
}

module.exports = define;
