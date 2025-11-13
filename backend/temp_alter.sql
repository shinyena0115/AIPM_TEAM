ALTER TABLE tasks MODIFY COLUMN taskType ENUM('기획', '개발', '버그수정', '회의') NOT NULL;
