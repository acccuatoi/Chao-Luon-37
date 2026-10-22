/**
 * API Client kết nối động tới Backend Máy 1
 * Hỗ trợ tự động fallback Mock nếu Máy 1 chưa sẵn sàng
 */

import { CONFIG } from './config.js';
import { TideCloakService } from './tidecloak-service.js';
import { PROTECTED_VAULT_ASSETS } from './mock-data.js';

export class ApiClient {
  constructor() {
    this.localTideService = new TideCloakService();
    this.isBackendOnline = false;
    this.onStatusChange = null;
  }

  setAuditCallback(callback) {
    this.localTideService.onAuditLog(callback);
  }

  logLocalEvent(type, status, details, meta) {
    return this.localTideService.logEvent(type, status, details, meta);
  }

  /**
   * Kiểm tra tình trạng kết nối tới Backend Máy 1
   */
  async checkBackendHealth() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONFIG.CONNECT_TIMEOUT);

    try {
      const res = await fetch(`${CONFIG.BACKEND_URL}/api/health`, {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeout);

      this.isBackendOnline = res.ok;
    } catch (err) {
      clearTimeout(timeout);
      this.isBackendOnline = false;
    }

    if (this.onStatusChange) {
      this.onStatusChange(this.isBackendOnline, CONFIG.BACKEND_URL);
    }

    return this.isBackendOnline;
  }

  /**
   * Lấy danh sách tài sản trong Vault (ưu tiên lấy từ Máy 1)
   */
  async getVaultAssets() {
    if (this.isBackendOnline) {
      try {
        const res = await fetch(`${CONFIG.BACKEND_URL}/api/vault/assets`);
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn("Failed to fetch assets from Máy 1 backend, using local fallback", err);
      }
    }
    // Fallback dữ liệu chuẩn
    return JSON.parse(JSON.stringify(PROTECTED_VAULT_ASSETS));
  }

  /**
   * Thực thi hành động của Agent qua Backend Máy 1 hoặc Local Engine
   */
  async executeAgentAction(agentMode, prompt, action, targetAsset) {
    if (this.isBackendOnline) {
      try {
        const res = await fetch(`${CONFIG.BACKEND_URL}/api/agent/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            action,
            agentRole: agentMode.id,
            targetAssetId: targetAsset ? targetAsset.id : null
          })
        });

        if (res.ok) {
          const data = await res.json();
          // Đồng bộ log nếu backend trả về log
          if (data.logEntry) {
            this.localTideService.logEvent(
              data.logEntry.type || "BACKEND_EXEC",
              data.logEntry.status || "SUCCESS",
              data.logEntry.details || "Executed by Backend Máy 1"
            );
          }
          return data;
        }
      } catch (err) {
        console.warn("Backend error, falling back to local Tide engine", err);
      }
    }

    // Nếu chạy chế độ Mock/Standalone:
    return await this.localTideService.evaluateAgentAction(agentMode, action, targetAsset);
  }

  /**
   * Thu hồi hoặc cấp lại quyền
   */
  async toggleRevocation(asset, agentModeId) {
    if (this.isBackendOnline) {
      try {
        const res = await fetch(`${CONFIG.BACKEND_URL}/api/vault/revoke`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assetId: asset.id, agentRole: agentModeId })
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn("Backend error on toggleRevocation", err);
      }
    }

    return this.localTideService.toggleRevocation(asset, agentModeId);
  }
}
