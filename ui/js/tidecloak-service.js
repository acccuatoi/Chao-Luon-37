/**
 * TideCloak Service Layer for SentinelAgent
 * Simulates Emergent Authority, Decentralized Quorum (4 Nodes), and Smart Quota Defenses
 */

export class TideCloakService {
  constructor() {
    this.nodes = [
      { id: "node-1", name: "Tide-Alpha (SG-Region)", status: "ONLINE", latency: "14ms" },
      { id: "node-2", name: "Tide-Beta (AU-Melbourne)", status: "ONLINE", latency: "28ms" },
      { id: "node-3", name: "Tide-Gamma (US-West)", status: "ONLINE", latency: "42ms" },
      { id: "node-4", name: "Tide-Delta (EU-Frankfurt)", status: "ONLINE", latency: "51ms" }
    ];
    this.auditListeners = [];
    this.quorumThreshold = 4;
  }

  onAuditLog(callback) {
    this.auditListeners.push(callback);
  }

  logEvent(type, status, details, meta = {}) {
    const entry = {
      id: "log_" + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }) + '.' + Math.floor(Math.random() * 900 + 100),
      type,
      status, // 'SUCCESS', 'DENIED', 'QUORUM_VERIFIED', 'BLOCKED', 'SECURITY_ALERT'
      details,
      meta
    };
    this.auditListeners.forEach(listener => listener(entry));
    return entry;
  }

  /**
   * Evaluates an Autonomous AI Agent's action request through Emergent Authority.
   */
  async evaluateAgentAction(agentMode, action, targetAsset) {
    this.logEvent(
      "AGENT_REQUEST",
      "PENDING",
      `AI Agent [${agentMode.name}] invoked action "${action}" targeting asset "${targetAsset ? targetAsset.title : 'Global'}"`
    );

    await new Promise(r => setTimeout(r, 450));

    // Case 1: Infrastructure Root Admin attempting unilateral bypass
    if (action === "SYNTHESIZE_UNILATERAL_KEY") {
      this.logEvent(
        "CONSENSUS_PROBE",
        "SECURITY_ALERT",
        "🚨 UNILATERAL OVERRIDE DETECTED: Cloud host attempted to synthesize Master Key directly from memory."
      );

      await new Promise(r => setTimeout(r, 200));

      this.logEvent(
        "EMERGENT_AUTHORITY",
        "BLOCKED",
        "REFUSED: Zero Master-Key Invariant enforced. No master key exists anywhere on the host server.",
        { consensus: "0/4 Approvals" }
      );

      return {
        permitted: false,
        reason: "Zero Master-Key Invariant: No single administrator, server, or cloud operator holds unilateral override capability.",
        nodeSignatures: 0,
        quorumStatus: "FAILED (0/4 Nodes)"
      };
    }

    // Case 2: Smart FinTech Defense - Rapid Slicing / Loop Drain Attack
    if (action === "RAPID_LOOP_DRAIN_ATTACK" || action === "OVERRIDE_PAYMENT_LIMIT") {
      this.logEvent(
        "VELOCITY_BREACH",
        "SECURITY_ALERT",
        "⚠️ CIRCUIT BREAKER TRIPPED: Detected rapid slicing transfers. Cumulative 24h total ($13,500) breaches $5,000 rolling cap. Destination is unwhitelisted."
      );

      await new Promise(r => setTimeout(r, 300));

      this.logEvent(
        "QUORUM_DEFENSE",
        "BLOCKED",
        "4/4 Tide Nodes unanimously freeze automated signing. Loop drain attack neutralized. Escalated to Sovereign Multi-Sig."
      );

      return {
        permitted: false,
        reason: "Circuit Breaker Tripped: Cumulative 24h rolling cap ($5,000) exceeded and unverified payee detected. Rapid loop drain attack blocked cryptographically.",
        nodeSignatures: 0,
        quorumStatus: "CIRCUIT BREAKER FROZEN"
      };
    }

    // Case 3: Prompt Injection / Bulk PII Exfiltration
    if (action === "EXPORT_PII_DATABASE") {
      this.logEvent(
        "INJECTION_BLOCKED",
        "SECURITY_ALERT",
        "🚨 PROMPT INJECTION DETECTED: Agent attempted bulk exfiltration of 128,000 customer PII records!"
      );

      await new Promise(r => setTimeout(r, 350));

      this.logEvent(
        "CONSENSUS_REJECTION",
        "BLOCKED",
        "4/4 Independent Tide Nodes refused key synthesis. Threat cryptographically sandboxed."
      );

      return {
        permitted: false,
        reason: "Policy Violation: Bulk PII database export strictly prohibited. Independent Tide Quorum refused key synthesis.",
        nodeSignatures: 0,
        quorumStatus: "REJECTED (0/4 Approved)"
      };
    }

    const isExplicitlyBlocked = agentMode.blockedActions && agentMode.blockedActions.includes(action);
    const isTargetRevoked = targetAsset && targetAsset.revokedModes && targetAsset.revokedModes.includes(agentMode.id);
    const isTargetAuthorized = targetAsset && targetAsset.authorizedModes && targetAsset.authorizedModes.includes(agentMode.id);

    if (isTargetRevoked) {
      this.logEvent(
        "REVOKED_ACCESS",
        "BLOCKED",
        `Quorum Refusal: Access to [${targetAsset.title}] was INSTANTLY REVOKED by Data Sovereign.`
      );

      return {
        permitted: false,
        reason: "Access permission was instantly revoked by the Sovereign Owner. Quorum refuses key synthesis.",
        nodeSignatures: 0,
        quorumStatus: "REVOKED BY SOVEREIGN"
      };
    }

    if (isExplicitlyBlocked || (targetAsset && !isTargetAuthorized)) {
      this.logEvent(
        "POLICY_MISMATCH",
        "DENIED",
        `Scope Mismatch: [${agentMode.name}] lacks authorization for this asset class.`
      );

      return {
        permitted: false,
        reason: `Scope Mismatch: ${agentMode.name} is not authorized for this asset class under current policy.`,
        nodeSignatures: 1,
        quorumStatus: "UNAUTHORIZED (Threshold Not Met)"
      };
    }

    // Case 4: Valid request -> Quorum Consensus
    this.logEvent(
      "QUORUM_CONSENSUS",
      "QUORUM_VERIFIED",
      `4 of 4 independent Tide Nodes [Alpha, Beta, Gamma, Delta] verified policy, rolling cap, and payee whitelist. Generating ephemeral key...`
    );

    await new Promise(r => setTimeout(r, 250));

    const ephemeralSessionToken = "tc_sess_" + Math.random().toString(36).substring(2, 10);

    this.logEvent(
      "EPHEMERAL_KEY_DISPATCH",
      "SUCCESS",
      `Single-use ephemeral key generated (Session: ${ephemeralSessionToken}). Self-destructs upon completion.`
    );

    return {
      permitted: true,
      decryptedData: targetAsset ? targetAsset.plaintext : { status: "Authorized", timestamp: new Date().toISOString() },
      sessionToken: ephemeralSessionToken,
      nodeSignatures: 4,
      quorumStatus: "APPROVED (4/4 Nodes Consensus)"
    };
  }

  /**
   * Toggles cryptographic revocation in real-time
   */
  toggleRevocation(asset, agentModeId) {
    if (!asset.revokedModes) asset.revokedModes = [];

    const index = asset.revokedModes.indexOf(agentModeId);
    let isNowRevoked = false;

    if (index > -1) {
      asset.revokedModes.splice(index, 1);
      isNowRevoked = false;
      this.logEvent(
        "REVOCATION_REMOVED",
        "INFO",
        `Quorum policy updated: Access permission RESTORED for [${agentModeId}] on [${asset.title}].`
      );
    } else {
      asset.revokedModes.push(agentModeId);
      isNowRevoked = true;
      this.logEvent(
        "INSTANT_REVOCATION",
        "SECURITY_ALERT",
        `INSTANT REVOCATION: Data Sovereign revoked access for [${agentModeId}] on [${asset.title}]. Tide nodes will refuse key synthesis immediately.`
      );
    }

    return isNowRevoked;
  }
}
