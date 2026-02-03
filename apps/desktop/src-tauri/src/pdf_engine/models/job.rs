use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum JobState {
    Queued,
    Running,
    Completed,
    Failed,
    Canceled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JobProgress {
    pub percent: u8,
    pub stage: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PdfJobKind {
    Merge {
        inputs: Vec<String>,
        output: String,
    },
    Split {
        input: String,
        output_dir: String,
        mode: String,
        span: Option<u32>,
        pages: Option<Vec<u32>>,
    },
    Rotate {
        input: String,
        output: String,
        page_range: Option<String>,
        degrees: i32,
    },
    Compress {
        input: String,
        output: String,
        preset: Option<String>,
    },
    Reorder {
        input: String,
        output: String,
        page_order: Vec<u32>,
    },
    Extract {
        input: String,
        output: String,
        pages: Vec<u32>,
    },
    Encrypt {
        input: String,
        output: String,
        user_password: Option<String>,
        owner_password: String,
    },
    Decrypt {
        input: String,
        output: String,
        password: String,
    },
    GetMetadata {
        input: String,
    },
    SetMetadata {
        input: String,
        output: String,
        title: Option<String>,
        author: Option<String>,
        subject: Option<String>,
        keywords: Option<String>,
    },
    // Phase 2 stubs
    Watermark,
    Redact,
    Sign,
    Ocr,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PdfJob {
    pub id: String,
    pub kind: PdfJobKind,
    pub state: JobState,
    pub progress: JobProgress,
    pub created_at: u64,
    pub updated_at: u64,
    pub error: Option<String>,
}

impl PdfJob {
    pub fn new(kind: PdfJobKind, now_ms: u64) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            kind,
            state: JobState::Queued,
            progress: JobProgress {
                percent: 0,
                stage: "queued".to_string(),
            },
            created_at: now_ms,
            updated_at: now_ms,
            error: None,
        }
    }
}
