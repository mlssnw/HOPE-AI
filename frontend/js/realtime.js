const MEMORY_EVENT_PREFIX = "MEMORY_";

export function realtimeUrl(baseUrl, userId) {
  const url = new URL("/ws/hope", baseUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.searchParams.set("user_id", userId);
  return url.toString();
}

export class HopeRealtimeClient {
  constructor({
    userId,
    baseUrl,
    socketFactory,
    onEvent = () => {},
    onState = () => {},
    setTimeoutImpl = (...args) => setTimeout(...args),
    clearTimeoutImpl = (...args) => clearTimeout(...args),
    setIntervalImpl = (...args) => setInterval(...args),
    clearIntervalImpl = (...args) => clearInterval(...args),
  }) {
    const browserWindow = typeof window === "undefined" ? null : window;
    this.userId = userId;
    this.baseUrl = baseUrl || browserWindow?.location?.href || "http://localhost/";
    this.socketFactory = socketFactory || (url => new browserWindow.WebSocket(url));
    this.onEvent = onEvent; this.onState = onState;
    this.setTimeoutImpl = setTimeoutImpl; this.clearTimeoutImpl = clearTimeoutImpl;
    this.setIntervalImpl = setIntervalImpl; this.clearIntervalImpl = clearIntervalImpl;
    this.socket = null; this.retryTimer = null; this.heartbeatTimer = null;
    this.retryAttempt = 0; this.stopped = true; this.lastMessageAt = 0;
  }

  start() { if (!this.stopped) return; this.stopped = false; this.connect(); }

  connect() {
    if (this.stopped) return;
    this.onState({ state: "connecting", retryAttempt: this.retryAttempt });
    try {
      const socket = this.socketFactory(realtimeUrl(this.baseUrl, this.userId));
      this.socket = socket;
      socket.addEventListener("open", () => this.handleOpen(socket));
      socket.addEventListener("message", event => this.handleMessage(socket, event.data));
      socket.addEventListener("close", () => this.handleClose(socket));
      socket.addEventListener("error", () => { if (socket.readyState < 2) socket.close(); });
    } catch {
      this.scheduleReconnect();
    }
  }

  handleOpen(socket) {
    if (socket !== this.socket || this.stopped) return;
    this.retryAttempt = 0; this.lastMessageAt = Date.now();
    this.onState({ state: "connected", retryAttempt: 0 });
    this.clearIntervalImpl(this.heartbeatTimer);
    this.heartbeatTimer = this.setIntervalImpl(() => {
      if (socket !== this.socket || socket.readyState !== 1) return;
      if (Date.now() - this.lastMessageAt > 70000) { socket.close(); return; }
      socket.send(JSON.stringify({ type: "PING", payload: {} }));
    }, 25000);
  }

  handleMessage(socket, rawMessage) {
    if (socket !== this.socket || this.stopped) return;
    this.lastMessageAt = Date.now();
    let message;
    try { message = JSON.parse(rawMessage); } catch { return; }
    if (message.type === "PING") {
      if (socket.readyState === 1) socket.send(JSON.stringify({ type: "PONG", payload: {} }));
      return;
    }
    if (message.type === "CONNECTED" || message.type === "PONG") return;
    if (typeof message.type === "string" && (message.type.startsWith(MEMORY_EVENT_PREFIX) || message.type === "AI_STATE_CHANGED")) {
      this.onEvent(message);
    }
  }

  handleClose(socket) {
    if (socket !== this.socket) return;
    this.clearIntervalImpl(this.heartbeatTimer); this.heartbeatTimer = null;
    this.socket = null;
    if (this.stopped) return;
    this.onState({ state: "disconnected", retryAttempt: this.retryAttempt });
    this.scheduleReconnect();
  }

  scheduleReconnect() {
    if (this.stopped || this.retryTimer) return;
    const delay = Math.min(15000, 1000 * (2 ** Math.min(this.retryAttempt, 4)));
    this.retryAttempt += 1;
    this.onState({ state: "reconnecting", retryAttempt: this.retryAttempt, retryInMs: delay });
    this.retryTimer = this.setTimeoutImpl(() => {
      this.retryTimer = null; this.connect();
    }, delay);
  }

  stop() {
    this.stopped = true;
    this.clearTimeoutImpl(this.retryTimer); this.retryTimer = null;
    this.clearIntervalImpl(this.heartbeatTimer); this.heartbeatTimer = null;
    const socket = this.socket; this.socket = null;
    if (socket && socket.readyState < 2) socket.close();
    this.onState({ state: "stopped", retryAttempt: this.retryAttempt });
  }
}
