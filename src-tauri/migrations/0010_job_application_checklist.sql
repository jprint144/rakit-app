ALTER TABLE job_applications
  ADD COLUMN cv_ready INTEGER NOT NULL DEFAULT 0;

ALTER TABLE job_applications
  ADD COLUMN portfolio_ready INTEGER NOT NULL DEFAULT 0;

ALTER TABLE job_applications
  ADD COLUMN cover_letter_ready INTEGER NOT NULL DEFAULT 0;

ALTER TABLE job_applications
  ADD COLUMN follow_up_sent INTEGER NOT NULL DEFAULT 0;
