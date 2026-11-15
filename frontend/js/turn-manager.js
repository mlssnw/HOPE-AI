export class TurnManager {
  constructor({ sessionId = crypto.randomUUID() } = {}) {
    this.sessionId = sessionId;
    this.turnSequence = 0;
    this.responseSequence = 0;
    this.current = null;
  }

  begin() {
    this.current = Object.freeze({
      sessionId: this.sessionId,
      turnId: ++this.turnSequence,
      attemptId: 1,
      responseVersion: ++this.responseSequence,
    });
    return this.current;
  }

  retry(reference = this.current) {
    if (!reference || !this.isCurrent(reference)) return null;
    this.current = Object.freeze({
      ...reference,
      attemptId: reference.attemptId + 1,
      responseVersion: ++this.responseSequence,
    });
    return this.current;
  }

  cancel(reference = this.current) {
    if (!reference || !this.isCurrent(reference)) return false;
    this.current = null;
    return true;
  }

  isCurrent(reference) {
    if (!this.current || !reference) return false;
    return ["sessionId", "turnId", "attemptId", "responseVersion"]
      .every(key => reference[key] === this.current[key]);
  }
}
