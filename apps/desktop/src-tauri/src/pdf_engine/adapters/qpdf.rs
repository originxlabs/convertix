use crate::pdf_engine::adapters::{run_tool, ToolConfig};
use crate::pdf_engine::errors::PdfEngineResult;

#[derive(Debug, Clone)]
pub struct QpdfAdapter {
    pub config: ToolConfig,
}

impl QpdfAdapter {
    pub async fn reorder(&self, input: &str, output: &str, pages: &str) -> PdfEngineResult<()> {
        let args = vec![input.to_string(), "--pages".to_string(), ".".to_string(), pages.to_string(), "--".to_string(), output.to_string()];
        run_tool("qpdf", &self.config, &args).await
    }
}
