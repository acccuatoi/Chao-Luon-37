/**
 * Chao-Luon-37 | SentinelAgent Client App
 * Streamlined, modular logic supporting dynamic backend integration with Machine 1
 */

import { CONFIG } from './config.js';
import { ApiClient } from './api.js';
import { AGENT_MODES, PRESET_AGENT_SCENARIOS } from './mock-data.js';

class SentinelAgentApp {
  constructor() {
    this.api = new ApiClient();
    this.activeAgent = AGENT_MODES[0];
    this.vaultAssets = [];
    this.decryptedStates = {};
    this.isPipelineRunning = false;

    this.initDOMElements();
    this.initAuditTerminal();
    this.initBackendStatus();
    this.renderAgentTabs();
    this.renderScenarios();
    this.loadAndRenderAssets();
    this.attachEventListeners();
  }

  initDOMElements() {
    this.agentTabsContainer = document.getElementById('agent-tabs-container');
    this.activeAgentDesc = document.getElementById('active-agent-desc');
    this.activeAgentBadge = document.getElementById('active-agent-badge');
    this.scenariosBtnGroup = document.getElementById('scenarios-btn-group');
    this.customPromptInput = document.getElementById('agent-custom-prompt');
    this.btnRunPrompt = document.getElementById('btn-run-prompt');
    this.vaultItemsList = document.getElementById('vault-items-list');
    this.auditTerminal = document.getElementById('terminal-audit-stream');
    this.btnClearLogs = document.getElementById('btn-clear-logs');
    this.btnAdminBypass = document.getElementById('btn-admin-bypass');

    // Pipeline elements
    this.pipelinePromptText = document.getElementById('pipeline-prompt-text');
    this.pipelineToolText = document.getElementById('pipeline-tool-text');
    this.pipelineQuorumText = document.getElementById('pipeline-quorum-text');
    this.pipelineResultText = document.getElementById('pipeline-result-text');
  }

  initAuditTerminal() {
    this.api.setAuditCallback((entry) => {
      this.appendAuditEntry(entry);
    });

    this.api.logLocalEvent(
      "SYSTEM_BOOT",
      "INFO",
      "SentinelAgent UI initialized. Zero-Master-Key guardrail active."
    );
  }

  appendAuditEntry(entry) {
    if (!this.auditTerminal) return;

    const row = document.createElement('div');
    row.className = 'log-row';

    let tagClass = 'tag-info';
    if (entry.status === 'SUCCESS' || entry.status === 'QUORUM_VERIFIED') tagClass = 'tag-success';
    else if (entry.status === 'BLOCKED' || entry.status === 'SECURITY_ALERT') tagClass = 'tag-danger';
    else if (entry.status === 'DENIED') tagClass = 'tag-warning';

    row.innerHTML = `
      <span class="log-time">[${entry.timestamp}]</span>
      <span class="log-tag ${tagClass}">${entry.status}</span>
      <span class="log-msg">${this.escapeHtml(entry.details)}</span>
    `;

    this.auditTerminal.appendChild(row);
    this.auditTerminal.scrollTop = this.auditTerminal.scrollHeight;
  }

  async initBackendStatus() {
    await this.api.checkBackendHealth();
  }

  renderAgentTabs() {
    if (!this.agentTabsContainer) return;
    this.agentTabsContainer.innerHTML = '';

    AGENT_MODES.forEach(mode => {
      const btn = document.createElement('button');
      btn.className = `agent-pill-btn ${this.activeAgent.id === mode.id ? 'active' : ''}`;
      btn.innerHTML = `<span>${mode.name}</span>`;

      btn.addEventListener('click', () => {
        this.selectAgent(mode);
      });

      this.agentTabsContainer.appendChild(btn);
    });

    this.updateActiveAgentDisplay();
  }

  selectAgent(mode) {
    this.activeAgent = mode;
    this.renderAgentTabs();
    this.updateActiveAgentDisplay();
    this.renderVaultAssets();

    this.api.logLocalEvent(
      "AGENT_ROLE_CHANGE",
      "INFO",
      `Switched active agent capability profile to [${mode.name}].`
    );
  }

  updateActiveAgentDisplay() {
    if (this.activeAgentDesc) {
      this.activeAgentDesc.textContent = this.activeAgent.description;
    }
    if (this.activeAgentBadge) {
      this.activeAgentBadge.textContent = this.activeAgent.name;
    }
  }

  renderScenarios() {
    if (!this.scenariosBtnGroup) return;
    this.scenariosBtnGroup.innerHTML = '';

    PRESET_AGENT_SCENARIOS.forEach(sc => {
      const btn = document.createElement('button');
      btn.className = 'chip-btn';
      btn.textContent = sc.title;

      btn.addEventListener('click', () => {
        this.runScenario(sc);
      });

      this.scenariosBtnGroup.appendChild(btn);
    });
  }

  async runScenario(sc) {
    if (this.isPipelineRunning) return;

    const matchedMode = AGENT_MODES.find(m => m.id === sc.agentMode);
    if (matchedMode && matchedMode.id !== this.activeAgent.id) {
      this.selectAgent(matchedMode);
    }

    if (this.customPromptInput) {
      this.customPromptInput.value = sc.prompt;
    }

    const targetAsset = this.vaultAssets.find(a => a.id === sc.targetAssetId);
    await this.executeAgentPipeline(sc.prompt, sc.action, targetAsset);
  }

  async loadAndRenderAssets() {
    this.vaultAssets = await this.api.getVaultAssets();
    this.renderVaultAssets();
  }

  renderVaultAssets() {
    if (!this.vaultItemsList) return;
    this.vaultItemsList.innerHTML = '';

    this.vaultAssets.forEach(asset => {
      const isAuthorized = asset.authorizedModes && asset.authorizedModes.includes(this.activeAgent.id);
      const isRevoked = asset.revokedModes && asset.revokedModes.includes(this.activeAgent.id);
      const decrypted = this.decryptedStates[asset.id];

      const item = document.createElement('div');
      item.className = `vault-item ${decrypted ? 'decrypted' : ''} ${isRevoked ? 'revoked' : ''}`;

      item.innerHTML = `
        <div class="vault-item-header">
          <div>
            <div class="vault-item-cat">${asset.category}</div>
            <div class="vault-item-title">${asset.title}</div>
          </div>
          <span class="vault-badge ${isRevoked ? 'badge-revoked' : isAuthorized ? 'badge-auth' : 'badge-lock'}">
            ${isRevoked ? 'Revoked' : isAuthorized ? 'Authorized' : 'Restricted'}
          </span>
        </div>

        <div class="vault-item-body">
          ${decrypted ? this.renderDecryptedPayload(decrypted.decryptedData) : this.renderCiphertextPayload(asset.ciphertext)}
        </div>

        <div class="vault-item-footer">
          <button class="btn-vault-action btn-decrypt" data-id="${asset.id}">
            ${decrypted ? 'Re-Verify' : 'Agent Request Decrypt'}
          </button>
          <button class="btn-vault-action btn-revoke" data-id="${asset.id}">
            ${isRevoked ? 'Restore Access' : 'Instant Revoke'}
          </button>
        </div>
      `;

      item.querySelector('.btn-decrypt').addEventListener('click', () => {
        const action = isAuthorized ? 'READ_AUTHORIZED_ASSET' : 'EXTRACT_MASTER_SECRETS';
        this.executeAgentPipeline(`Decrypt ${asset.title}`, action, asset);
      });

      item.querySelector('.btn-revoke').addEventListener('click', async () => {
        await this.api.toggleRevocation(asset, this.activeAgent.id);
        delete this.decryptedStates[asset.id];
        this.renderVaultAssets();
      });

      this.vaultItemsList.appendChild(item);
    });
  }

  renderCiphertextPayload(ciphertext) {
    return `<div class="ciphertext-strip"><code>${ciphertext}</code></div>`;
  }

  renderDecryptedPayload(data) {
    let rows = '';
    for (const [k, v] of Object.entries(data)) {
      rows += `<div><strong>${this.formatKey(k)}:</strong> ${this.escapeHtml(String(v))}</div>`;
    }
    return `<div class="plaintext-panel">${rows}</div>`;
  }

  formatKey(str) {
    return str.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
  }

  async executeAgentPipeline(promptText, action, targetAsset) {
    if (this.isPipelineRunning) return;
    this.isPipelineRunning = true;

    this.setStep('step-prompt', 'active', `"${this.escapeHtml(promptText)}"`);
    this.setStep('step-thought', 'pending', 'Planning tool invocation...');
    this.setStep('step-quorum', 'pending', 'Awaiting Quorum validation...');
    this.setStep('step-result', 'pending', 'Awaiting outcome...');

    await this.sleep(350);

    // Step 2: Tool Planning
    const tool = action || 'EVALUATE_ACTION';
    this.setStep('step-prompt', 'done');
    this.setStep('step-thought', 'active', `Emitting: <code>${tool}</code>`);

    await this.sleep(400);

    // Step 3: Quorum check
    this.setStep('step-thought', 'done');
    this.setStep('step-quorum', 'active', `Tide Quorum (4 Nodes) validating policy...`);

    const evalResult = await this.api.executeAgentAction(this.activeAgent, promptText, tool, targetAsset);

    // Step 4: Outcome
    this.setStep('step-quorum', 'done');
    this.setStep('step-result', 'active');

    if (evalResult.permitted) {
      this.setStep('step-result', 'done', `<span class="text-success">✓ Ephemeral Key Synthesized (Session: ${evalResult.sessionToken || 'active'})</span>`);
      if (targetAsset) {
        this.decryptedStates[targetAsset.id] = { decryptedData: evalResult.decryptedData };
        this.renderVaultAssets();
      }
    } else {
      this.setStep('step-result', 'error', `<span class="text-danger">✕ Refused: ${evalResult.reason || 'Quorum Refused'}</span>`);
    }

    this.isPipelineRunning = false;
  }

  setStep(stepId, state, desc) {
    const el = document.getElementById(stepId);
    if (!el) return;
    el.className = `pipeline-node ${state}`;
    if (desc) {
      const descEl = el.querySelector('.node-desc');
      if (descEl) descEl.innerHTML = desc;
    }
  }

  attachEventListeners() {
    if (this.btnRunPrompt) {
      this.btnRunPrompt.addEventListener('click', () => this.handleCustomPrompt());
    }
    if (this.customPromptInput) {
      this.customPromptInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.handleCustomPrompt();
      });
    }

    if (this.btnClearLogs) {
      this.btnClearLogs.addEventListener('click', () => {
        if (this.auditTerminal) this.auditTerminal.innerHTML = '';
      });
    }

    if (this.btnAdminBypass) {
      this.btnAdminBypass.addEventListener('click', () => {
        this.executeAgentPipeline("Host operator executes direct memory dump / kernel bypass to force decrypt token.", "SYNTHESIZE_UNILATERAL_KEY", this.vaultAssets[0]);
      });
    }
  }

  handleCustomPrompt() {
    const text = this.customPromptInput.value.trim();
    if (!text) return;

    let action = 'GENERAL_QUERY';
    let targetAsset = this.vaultAssets[0];

    const lower = text.toLowerCase();
    if (lower.includes('drain') || lower.includes('loop') || lower.includes('slicing') || lower.includes('4500') || lower.includes('4,500') || lower.includes('unverified')) {
      action = 'RAPID_LOOP_DRAIN_ATTACK';
      targetAsset = this.vaultAssets.find(a => a.id === 'asset-01') || this.vaultAssets[0];
    } else if (lower.includes('25000') || lower.includes('over') || lower.includes('limit') || lower.includes('override')) {
      action = 'OVERRIDE_PAYMENT_LIMIT';
      targetAsset = this.vaultAssets.find(a => a.id === 'asset-01') || this.vaultAssets[0];
    } else if (lower.includes('dump') || lower.includes('pii') || lower.includes('leak') || lower.includes('exfiltrat')) {
      action = 'EXPORT_PII_DATABASE';
      targetAsset = this.vaultAssets.find(a => a.id === 'asset-03') || this.vaultAssets[0];
    } else if (lower.includes('secret') || lower.includes('k8s') || lower.includes('kube') || lower.includes('root')) {
      action = 'EXTRACT_ROOT_CREDENTIALS';
      targetAsset = this.vaultAssets.find(a => a.id === 'asset-02') || this.vaultAssets[0];
    } else if (lower.includes('medical') || lower.includes('patient') || lower.includes('cardio') || lower.includes('health')) {
      action = 'READ_CONSENTED_MEDICAL_RECORD';
      targetAsset = this.vaultAssets.find(a => a.id === 'asset-04') || this.vaultAssets[0];
    } else if (lower.includes('pay') || lower.includes('invoice') || lower.includes('transfer') || lower.includes('payout')) {
      action = 'EXECUTE_PAYMENT_UNDER_LIMIT';
      targetAsset = this.vaultAssets.find(a => a.id === 'asset-01') || this.vaultAssets[0];
    }

    this.executeAgentPipeline(text, action, targetAsset);
  }

  escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.app = new SentinelAgentApp();
});
