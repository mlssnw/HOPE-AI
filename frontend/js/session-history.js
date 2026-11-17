const publicMessage = ({ role, content }) => ({ role, content });
const UNKNOWN_PROVENANCE = Object.freeze({
  trust: "UNKNOWN",
  audience: "UNKNOWN",
  memoryDerived: false,
});

const isPublicRequest = policy => policy?.modes?.audience === "PUBLIC";
const isPublicSafeTurn = policy => isPublicRequest(policy)
  && policy?.modes?.privacy === "STANDARD";

function normalizeProvenance(policy, provenance = {}) {
  const publicSafe = isPublicSafeTurn(policy)
    && provenance.trust === "PUBLIC_SAFE"
    && provenance.audience === "PUBLIC"
    && provenance.memoryDerived !== true;
  return Object.freeze({
    trust: publicSafe ? "PUBLIC_SAFE" : (provenance.trust || "PRIVATE_OR_UNKNOWN"),
    audience: provenance.audience || policy?.modes?.audience || "UNKNOWN",
    memoryDerived: provenance.memoryDerived === true,
  });
}

const isPublicSafe = record => record.provenance?.trust === "PUBLIC_SAFE"
  && record.provenance.audience === "PUBLIC"
  && record.provenance.memoryDerived === false;

export class SessionHistory {
  constructor(initial = []) {
    this.records = initial.map(item => ({
      ...publicMessage(item),
      historyEligible: true,
      provenance: UNKNOWN_PROVENANCE,
    }));
  }

  append(role, content, turnPolicy = {}, provenance = {}) {
    const record = {
      role,
      content,
      historyEligible: turnPolicy.historyEligible !== false,
      provenance: normalizeProvenance(turnPolicy, provenance),
    };
    this.records.push(record);
    return record;
  }

  clear() { this.records = []; }

  get visible() { return this.records.map(publicMessage); }

  get persistable() {
    return this.records.filter(item => item.historyEligible).map(publicMessage);
  }

  recent(limit = 20) { return this.visible.slice(-limit); }

  recentFor(turnPolicy = {}, limit = 20) {
    const records = isPublicRequest(turnPolicy)
      ? this.records.filter(isPublicSafe)
      : this.records;
    return records.slice(-limit).map(publicMessage);
  }
}
