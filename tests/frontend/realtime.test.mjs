import test from "node:test";
import assert from "node:assert/strict";

import { HopeRealtimeClient, realtimeUrl } from "../../frontend/js/realtime.js";

class FakeSocket {
  static OPEN = 1;

  constructor(url) {
    this.url = url;
    this.readyState = FakeSocket.OPEN;
    this.listeners = new Map();
    this.sent = [];
  }

  addEventListener(name, listener) {
    const listeners = this.listeners.get(name) || [];
    listeners.push(listener);
    this.listeners.set(name, listeners);
  }

  emit(name, data) {
    for (const listener of this.listeners.get(name) || []) {
      listener(name === "message" ? { data } : {});
    }
  }

  send(payload) {
    this.sent.push(JSON.parse(payload));
  }

  close() {
    this.readyState = 3;
    this.emit("close");
  }
}

test("URL do websocket preserva o usuário e o protocolo seguro", () => {
  assert.equal(
    realtimeUrl("https://hope.example/api", "user-1"),
    "wss://hope.example/ws/hope?user_id=user-1",
  );
});

test("cliente entrega eventos, responde heartbeat e sinaliza desconexão", () => {
  const sockets = [];
  const states = [];
  const events = [];
  const timers = [];
  const client = new HopeRealtimeClient({
    baseUrl: "http://localhost:8000/api",
    userId: "user-1",
    socketFactory: url => {
      const socket = new FakeSocket(url);
      sockets.push(socket);
      return socket;
    },
    setTimeoutImpl: callback => {
      timers.push(callback);
      return timers.length;
    },
    clearTimeoutImpl: () => {},
    setIntervalImpl: callback => {
      timers.push(callback);
      return timers.length;
    },
    clearIntervalImpl: () => {},
    onState: status => states.push(status.state),
    onEvent: event => events.push(event),
  });

  client.start();
  const socket = sockets[0];
  socket.emit("open");
  socket.emit("message", JSON.stringify({ type: "PING", timestamp: "now" }));
  socket.emit("message", JSON.stringify({ type: "MEMORY_CREATED", payload: { node: { id: "m1" } } }));

  assert.equal(socket.sent[0].type, "PONG");
  assert.equal(events[0].type, "MEMORY_CREATED");
  assert.equal(states.includes("connected"), true);

  socket.close();
  assert.equal(states.at(-1), "reconnecting");
  client.stop();
  assert.equal(states.at(-1), "stopped");
});
