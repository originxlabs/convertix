use crate::pdf_engine::adapters::{run_tool, ToolConfig};
use crate::pdf_engine::errors::PdfEngineResult;

#[derive(Debug, Clone)]
pub struct GhostscriptAdapter {
    pub config: ToolConfig,
}

impl GhostscriptAdapter {
    pub async fn compress(&self, input: &str, output: &str, preset: &str) -> PdfEngineResult<()> {
        let args = vec![
            "-sDEVICE=pdfwrite".to_string(),
            format!("-dPDFSETTINGS=/{}", preset),
            "-dNOPAUSE".to_string(),
            "-dBATCH".to_string(),
            "-dSAFER".to_string(),
            format!("-sOutputFile={}", output),
            input.to_string(),
        ];
        run_tool("ghostscript", &self.config, &args).await
    }
}
