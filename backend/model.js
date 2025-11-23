const { Sequelize, DataTypes } = require("sequelize");

function define(connection) {
    // ✅ 사용자 테이블
    const User = connection.define(
        "users",
        {
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
                // unique: true, // 자동 인덱스 생성 방지를 위해 주석 처리
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
                defaultValue: "active",
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
            vacation_status: {
                type: DataTypes.ENUM("근무중", "연차중"),
                defaultValue: "근무중",
                comment: "현재 연차 상태",
            },
            current_vacation_start: {
                type: DataTypes.DATEONLY,
                allowNull: true,
                comment: "현재 연차 시작일",
            },
            current_vacation_end: {
                type: DataTypes.DATEONLY,
                allowNull: true,
                comment: "현재 연차 종료일",
            },
        },
        {
            indexes: [], // 자동 인덱스 생성 완전히 비활성화
        }
    );

    // ✅ 부서 테이블
    const Department = connection.define(
        "departments",
        {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            name: { type: DataTypes.STRING(100), allowNull: false }, // unique 제거
            createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
            updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        },
        {
            indexes: [], // 자동 인덱스 생성 완전히 비활성화
        }
    );

    // ✅ 팀 테이블
    const Team = connection.define(
        "teams",
        {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            name: { type: DataTypes.STRING(100), allowNull: false },
            department_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: "departments", key: "id" },
            },
            createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
            updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        },
        {
            indexes: [], // 자동 인덱스 생성 완전히 비활성화
        }
    );

    // ✅ 업무(Task) 테이블
    const Task = connection.define(
        "tasks",
        {
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
                type: DataTypes.ENUM("기획", "개발", "버그수정", "회의"),
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
        },
        {
            indexes: [], // 자동 인덱스 생성 완전히 비활성화
        }
    );

    const Vacation = connection.define(
        "Vacation",
        {
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
            ai_comment: { type: DataTypes.STRING(255), allowNull: true, comment: "AI 판단 코멘트" }

        },
        {
            indexes: [], // 자동 인덱스 생성 완전히 비활성화
        }
    );

    // ✅ 출퇴근(Attendance) 테이블
    const Attendance = connection.define("attendances", {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "users", key: "user_id" },
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            defaultValue: Sequelize.NOW,
        },
        check_in: {
            type: DataTypes.TIME,
            allowNull: true,
        },
        check_out: {
            type: DataTypes.TIME,
            allowNull: true,
        },
         // 🆕 출퇴근 상태 컬럼
    status: {
        type: DataTypes.STRING, // "정상", "지각", "조퇴", "야근"
        allowNull: true,
    },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    });

    // ✅ Peer Review(동료 평가) 테이블
    const PeerReview = connection.define("peer_reviews", {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

        reviewer_id: {
            // 평가자
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "users", key: "user_id" },
        },

        reviewee_id: {
            // 평가 대상자
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "users", key: "user_id" },
        },

        teamwork: {
            // 협업
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "1~5점 척도",
        },

        communication: {
            // 커뮤니케이션
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        responsibility: {
            // 책임감
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        comment: {
            // 추가 코멘트
            type: DataTypes.TEXT,
            allowNull: true,
        },

        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    });

    // ✅ 개인 복귀 업무 테이블
    const NextDayTodo = connection.define("next_day_todos", {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        owner_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "users", key: "user_id" },
        },
        for_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    });

    // ✅ 업무 대체자 게시판 테이블
    const ReplacementEntry = connection.define("replacement_entries", {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        leaver_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "users", key: "user_id" },
            comment: "연차자 ID",
        },
        leave_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            comment: "연차 날짜",
        },
        author_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "users", key: "user_id" },
            comment: "작성자 ID",
        },
        text: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: "대체 업무 내용",
        },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    });

    // ✅ 관계 설정
    User.hasMany(PeerReview, { foreignKey: "reviewer_id", as: "GivenReviews" });
    User.hasMany(PeerReview, { foreignKey: "reviewee_id", as: "ReceivedReviews" });
    PeerReview.belongsTo(User, { foreignKey: "reviewer_id", as: "Reviewer" });
    PeerReview.belongsTo(User, { foreignKey: "reviewee_id", as: "Reviewee" });

    // ✅ NextDayTodo 관계 설정
    User.hasMany(NextDayTodo, { foreignKey: "owner_id", as: "NextDayTodos" });
    NextDayTodo.belongsTo(User, { foreignKey: "owner_id", as: "Owner" });

    // ✅ ReplacementEntry 관계 설정
    User.hasMany(ReplacementEntry, { foreignKey: "leaver_id", as: "ReceivedReplacements" });
    User.hasMany(ReplacementEntry, { foreignKey: "author_id", as: "WrittenReplacements" });
    ReplacementEntry.belongsTo(User, { foreignKey: "leaver_id", as: "Leaver" });
    ReplacementEntry.belongsTo(User, { foreignKey: "author_id", as: "Author" });

    // ✅ 관계 설정
    User.hasMany(Attendance, { foreignKey: "user_id", as: "Attendances" });
    Attendance.belongsTo(User, { foreignKey: "user_id", as: "User" });

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
    // alter: true는 인덱스 중복 문제를 일으킬 수 있어서 주석 처리
    //connection.sync({ alter: true });

    // ======================
    // ✅ 동기화 (테이블 초기화)
    // ======================
    //connection.sync({ force: true })
    //.then(() => console.log("✅ DB 초기화 완료 (모든 테이블 재생성됨)"))
    //.catch(err => console.error("❌ DB 초기화 오류:", err));

    return { User, Department, Team, Task, Vacation, Attendance, PeerReview, NextDayTodo, ReplacementEntry };
}

module.exports = define;
