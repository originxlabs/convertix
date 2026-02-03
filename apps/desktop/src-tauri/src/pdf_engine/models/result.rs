use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JobResult {
    pub job_id: String,
    pub output_path: Option<String>,
    pub metadata: Option<serde_json::Value>,
}
