import { tauriApi } from "../api/tauri";

type JobStatus = {
  id: string;
  kind: string;
  progress: number;
  state: string;
};

class AppStateStore {
  online = true;
  jobs: JobStatus[] = [];
  cacheInfo: { cache_dir: string; bytes_used: number; limit_bytes: number } | null = null;

  async init() {
    await this.refreshNetwork();
    await this.refreshCache();
  }

  async refreshNetwork() {
    const offline = await tauriApi.getOfflineStatus();
    this.online = !offline;
  }

  async refreshCache() {
    this.cacheInfo = (await tauriApi.getCacheInfo()) as typeof this.cacheInfo;
  }
}

export const appState = new AppStateStore();
