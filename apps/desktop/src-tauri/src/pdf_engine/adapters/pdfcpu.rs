use crate::pdf_engine::adapters::{run_tool, ToolConfig};
use crate::pdf_engine::errors::PdfEngineResult;

#[derive(Debug, Clone)]
pub struct PdfCpuAdapter {
    pub config: ToolConfig,
}

impl PdfCpuAdapter {
    pub async fn merge(&self, output: &str, inputs: &[String]) -> PdfEngineResult<()> {
        let mut args = vec!["merge".to_string(), "--".to_string(), output.to_string()];
        args.extend_from_slice(inputs);
        run_tool("pdfcpu", &self.config, &args).await
    }

    pub async fn split_span(&self, input: &str, output_dir: &str, span: u32) -> PdfEngineResult<()> {
        let args = vec![
            "split".to_string(),
            "-m".to_string(),
            "span".to_string(),
            "--".to_string(),
            input.to_string(),
            output_dir.to_string(),
            span.to_string(),
        ];
        run_tool("pdfcpu", &self.config, &args).await
    }

    pub async fn split_pages(&self, input: &str, output_dir: &str, pages: &[u32]) -> PdfEngineResult<()> {
        let mut args = vec![
            "split".to_string(),
            "-m".to_string(),
            "page".to_string(),
            "--".to_string(),
            input.to_string(),
            output_dir.to_string(),
        ];
        for page in pages {
            args.push(page.to_string());
        }
        run_tool("pdfcpu", &self.config, &args).await
    }

    pub async fn rotate(&self, input: &str, output: &str, degrees: i32, pages: Option<&str>) -> PdfEngineResult<()> {
        let mut args = vec!["rotate".to_string(), "--".to_string(), input.to_string(), output.to_string()];
        if let Some(pages) = pages {
            args.insert(1, "-p".to_string());
            args.insert(2, pages.to_string());
        }
        args.insert(1, degrees.to_string());
        run_tool("pdfcpu", &self.config, &args).await
    }

    pub async fn extract(&self, input: &str, output: &str, pages: &[u32]) -> PdfEngineResult<()> {
        let mut page_list = pages.iter().map(|p| p.to_string()).collect::<Vec<_>>().join(",");
        if page_list.is_empty() {
            page_list = "1".to_string();
        }
        let args = vec![
            "extract".to_string(),
            "-p".to_string(),
            page_list,
            "--".to_string(),
            input.to_string(),
            output.to_string(),
        ];
        run_tool("pdfcpu", &self.config, &args).await
    }

    pub async fn encrypt(&self, input: &str, output: &str, owner: &str, user: Option<&str>) -> PdfEngineResult<()> {
        let mut args = vec!["encrypt".to_string(), "-opw".to_string(), owner.to_string()];
        if let Some(user) = user {
            args.push("-upw".to_string());
            args.push(user.to_string());
        }
        args.extend_from_slice(&["--".to_string(), input.to_string(), output.to_string()]);
        run_tool("pdfcpu", &self.config, &args).await
    }

    pub async fn decrypt(&self, input: &str, output: &str, password: &str) -> PdfEngineResult<()> {
        let args = vec![
            "decrypt".to_string(),
            "-upw".to_string(),
            password.to_string(),
            "--".to_string(),
            input.to_string(),
            output.to_string(),
        ];
        run_tool("pdfcpu", &self.config, &args).await
    }

    pub async fn get_metadata(&self, input: &str, output: &str) -> PdfEngineResult<()> {
        let args = vec![
            "info".to_string(),
            "-json".to_string(),
            "--".to_string(),
            input.to_string(),
            output.to_string(),
        ];
        run_tool("pdfcpu", &self.config, &args).await
    }

    pub async fn set_metadata(&self, input: &str, output: &str, entries: &[String]) -> PdfEngineResult<()> {
        let mut args = vec!["properties".to_string()];
        args.extend_from_slice(entries);
        args.extend_from_slice(&["--".to_string(), input.to_string(), output.to_string()]);
        run_tool("pdfcpu", &self.config, &args).await
    }
}
