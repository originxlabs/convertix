use crate::pdf_engine::models::job::{JobState, PdfJob};
use serde::Serialize;
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::PathBuf;

#[derive(Debug, Serialize)]
pub struct AuditEvent<'a> {
    pub job_id: &'a str,
    pub state: &'a JobState,
    pub stage: &'a str,
    pub timestamp_ms: u64,
    pub message: Option<&'a str>,
}

pub fn write_audit(log_path: &PathBuf, job: &PdfJob, message: Option<&str>) {
    let event = AuditEvent {
        job_id: &job.id,
        state: &job.state,
        stage: &job.progress.stage,
        timestamp_ms: job.updated_at,
        message,
    };

    if let Ok(serialized) = serde_json::to_string(&event) {
        if let Ok(mut file) = OpenOptions::new().create(true).append(true).open(log_path) {
            let _ = writeln!(file, "{}", serialized);
        }
    }
}

pub fn ensure_audit_dir(dir: &PathBuf) {
    let _ = fs::create_dir_all(dir);
}
