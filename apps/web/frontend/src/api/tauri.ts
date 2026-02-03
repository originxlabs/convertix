import { invoke } from "@tauri-apps/api/tauri";

export const tauriApi = {
  openFileDialog: () => invoke<string | null>("open_file_dialog"),
  saveFileDialog: (defaultName?: string) =>
    invoke<string | null>("save_file_dialog", { defaultName }),
  getOfflineStatus: () => invoke<boolean>("get_offline_status"),
  getCacheInfo: () => invoke("get_cache_info"),
  clearCache: () => invoke("clear_cache"),
  processLocalFile: (request: unknown) => invoke("process_local_file", { request }),
  enqueueJob: (payload: unknown) => invoke<string>("enqueue_job", { payload }),
  getJobStatus: (jobId: string) => invoke("get_job_status", { jobId }),
  cancelJob: (jobId: string) => invoke("cancel_job", { jobId }),
  pdfMerge: (inputs: string[], output: string) =>
    invoke<string>("pdf_merge", { inputs, output }),
  pdfSplit: (input: string, outputDir: string, mode: string, span?: number, pages?: number[]) =>
    invoke<string>("pdf_split", { input, outputDir, mode, span, pages }),
  pdfRotate: (input: string, output: string, pageRange: string | null, degrees: number) =>
    invoke<string>("pdf_rotate", { input, output, pageRange, degrees }),
  pdfCompress: (input: string, output: string, preset?: string) =>
    invoke<string>("pdf_compress", { input, output, preset }),
  pdfReorderPages: (input: string, output: string, pageOrder: number[]) =>
    invoke<string>("pdf_reorder_pages", { input, output, pageOrder }),
  pdfExtractPages: (input: string, output: string, pages: number[]) =>
    invoke<string>("pdf_extract_pages", { input, output, pages }),
  pdfEncrypt: (input: string, output: string, userPassword: string | null, ownerPassword: string) =>
    invoke<string>("pdf_encrypt", { input, output, userPassword, ownerPassword }),
  pdfDecrypt: (input: string, output: string, password: string) =>
    invoke<string>("pdf_decrypt", { input, output, password }),
  pdfGetMetadata: (input: string) => invoke<string>("pdf_get_metadata", { input }),
  pdfSetMetadata: (
    input: string,
    output: string,
    title?: string,
    author?: string,
    subject?: string,
    keywords?: string
  ) => invoke<string>("pdf_set_metadata", { input, output, title, author, subject, keywords }),
  pdfGetJobStatus: (jobId: string) => invoke<string>("pdf_get_job_status", { jobId }),
  pdfCancelJob: (jobId: string) => invoke("pdf_cancel_job", { jobId }),
  getTier: () => invoke<string>("get_tier"),
  activateLicense: (
    userId: string,
    activationKey: string,
    deviceId: string,
    plan: string,
    authToken: string
  ) =>
    invoke<string>("activate_license", { userId, activationKey, deviceId, plan, authToken }),
  getUsage: () => invoke<string>("get_usage"),
  consumeCredits: (amount: number) => invoke<number>("consume_credits", { amount }),
  syncUsage: (userId: string, authToken: string) =>
    invoke("sync_usage", { userId, authToken }),
  syncCredits: (userId: string, authToken: string) =>
    invoke("sync_credits", { userId, authToken })
};
