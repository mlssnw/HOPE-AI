const publicMessage = ({ role, content }) => ({ role, content });

export class SessionHistory {
  constructor(initial = []) {
    this.records = initial.map(item => ({ ...publicMessage(item), historyEligible: true }));
  }

  append(role, content, turnPolicy = {}) {
    const record = {
      role,
      content,
      historyEligible: turnPolicy.historyEligible !== false,
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
}
