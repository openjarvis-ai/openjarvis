import { EventEmitter } from "events";
import WebSocket from "ws";

export interface OpenClawClientOptions {
  url: string;
  gatewayToken?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

interface PendingRequest {
  resolve: (value: any) => void;
  reject: (reason: unknown) => void;
  timeout: ReturnType<typeof setTimeout>;
}

class OpenClawClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private options: Required<OpenClawClientOptions>;
  private _status: ConnectionStatus = "disconnected";
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingRequests = new Map<string, PendingRequest>();
  private messageIdCounter = 0;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  constructor(options: OpenClawClientOptions) {
    super();
    this.options = {
      url: options.url,
      gatewayToken: options.gatewayToken || "",
      reconnectInterval: options.reconnectInterval || 3000,
      maxReconnectAttempts: options.maxReconnectAttempts || 10,
    };
  }

  get status(): ConnectionStatus {
    return this._status;
  }

  private setStatus(status: ConnectionStatus) {
    this._status = status;
    this.emit("status", status);
  }

  private nextId(): string {
    this.messageIdCounter++;
    return `msg_${Date.now()}_${this.messageIdCounter}`;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this._status === "connected") {
        resolve();
        return;
      }

      this.setStatus("connecting");

      // Add token to URL if provided
      const url = this.options.gatewayToken
        ? `${this.options.url}/?token=${this.options.gatewayToken}`
        : this.options.url;

      this.ws = new WebSocket(url);

      this.ws.on("open", () => {
        this.reconnectAttempts = 0;

        // Send handshake using OpenClaw v3 protocol
        const deviceId = `node-client-${Math.random().toString(36).slice(2)}`;
        const publicKey = Buffer.from(deviceId + '-public-key', 'utf-8').toString('base64');
        const signature = Buffer.from(`${deviceId}:${Date.now()}`, 'utf-8').toString('base64');

        const handshakeId = this.nextId();
        const handshake = {
          type: "req",
          id: handshakeId,
          method: "connect",
          params: {
            minProtocol: 3,
            maxProtocol: 3,
            client: {
              id: "control-ui",
              version: "1.0.0",
              platform: "web",
              mode: "operator",
            },
            role: "operator",
            caps: [],
            commands: [],
            permissions: {},
            scopes: ["operator.read", "operator.write"],
            auth: {
              token: this.options.gatewayToken || "",
            },
            locale: "en-US",
            userAgent: "openclaw-cli/1.2.3",
            device: {
              id: deviceId,
              publicKey,
              signature,
              signedAt: Date.now(),
              nonce: deviceId, // Use deviceId as nonce initially (will be updated from challenge if needed)
            },
          },
        };


        // Store pending request for handshake
        const timeout = setTimeout(() => {
          this.pendingRequests.delete(handshakeId);
          reject(new Error("Handshake timeout"));
        }, 10000);

        this.pendingRequests.set(handshakeId, {
          resolve,
          reject,
          timeout,
        });

        this.ws!.send(JSON.stringify(handshake));
      });

      this.ws.on("message", (data: WebSocket.Data) => {
        try {
          const msg = JSON.parse(data.toString());
          this.handleMessage(msg);
        } catch (err) {
          this.emit("error", new Error("Failed to parse message"));
        }
      });

      this.ws.on("close", () => {
        const wasConnected = this._status === "connected";
        this.stopHeartbeat();
        this.setStatus("disconnected");
        this.rejectAllPending("Connection closed");

        if (wasConnected) {
          this.scheduleReconnect();
        }
      });

      this.ws.on("error", (err: Error) => {
        this.setStatus("error");
        this.emit("error", err);
        reject(err);
      });
    });
  }

  private handleMessage(msg: Record<string, unknown>) {
    const msgType = msg.type as string;
    const msgId = msg.id as string;

    // Handle response messages
    if (msgType === "res") {
      const payload = msg.payload as Record<string, unknown>;

      // Handshake response
      if (payload?.type === "hello-ok") {
        this.setStatus("connected");
        this.emit("connected");

        // Start heartbeat to keep connection alive (every 25 seconds)
        this.startHeartbeat();

        // Resolve the handshake promise
        if (msgId && this.pendingRequests.has(msgId)) {
          const pending = this.pendingRequests.get(msgId)!;
          clearTimeout(pending.timeout);
          this.pendingRequests.delete(msgId);
          pending.resolve(undefined);
        }
        return;
      }

      // Generic response
      if (msgId && this.pendingRequests.has(msgId)) {
        const pending = this.pendingRequests.get(msgId)!;
        clearTimeout(pending.timeout);
        this.pendingRequests.delete(msgId);

        if (msg.ok === false) {
          const err = msg.error;
          const errMsg = typeof err === "string"
            ? err
            : (err as Record<string, unknown>)?.message as string || JSON.stringify(err);
          pending.reject(new Error(errMsg || "Request failed"));
        } else {
          pending.resolve(msg);
        }
      }
      return;
    }

    // Handle event messages (streaming)
    if (msgType === "event") {
      const eventType = msg.event as string;

      if (eventType === "agent.message.delta") {
        this.emit("delta", {
          type: eventType,
          data: (msg.payload as Record<string, unknown>)?.content || "",
          timestamp: new Date().toISOString(),
        });
      } else if (eventType === "agent.message.complete") {
        this.emit("complete", msg.payload);
      }

      this.emit("message", msg);
      return;
    }
  }

  private startHeartbeat() {
    // Clear any existing heartbeat
    this.stopHeartbeat();

    // Send heartbeat every 25 seconds to keep connection alive
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this._status === "connected") {
        const heartbeat = {
          type: "req",
          id: this.nextId(),
          method: "last-heartbeat",
        };
        this.ws.send(JSON.stringify(heartbeat));
      }
    }, 25000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      this.setStatus("error");
      this.emit("error", new Error("Max reconnect attempts reached"));
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect().catch(() => {
        // Will retry via close handler
      });
    }, this.options.reconnectInterval);
  }

  private rejectAllPending(reason: string) {
    for (const [, pending] of this.pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(new Error(reason));
    }
    this.pendingRequests.clear();
  }

  private send(
    method: string,
    params: Record<string, unknown>,
    timeoutMs = 30000
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (this._status !== "connected" || !this.ws) {
        reject(new Error("Not connected to OpenClaw"));
        return;
      }

      const id = this.nextId();
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request ${id} timed out`));
      }, timeoutMs);

      this.pendingRequests.set(id, { resolve, reject, timeout });

      const request = {
        type: "req",
        id,
        method,
        params,
      };

      this.ws.send(JSON.stringify(request));
    });
  }

  async sendMessage(content: string, agent = "main", session = "main"): Promise<unknown> {
    return this.send("chat.send", {
      agent,
      session,
      message: {
        role: "user",
        content,
      },
    });
  }

  async getChatHistory(): Promise<unknown> {
    return this.send("chat.history", {});
  }

  async abortChat(): Promise<unknown> {
    return this.send("chat.abort", {});
  }

  async listSkills(): Promise<unknown> {
    return this.send("skills.status", {});
  }

  async installSkill(name: string, definition: Record<string, unknown>): Promise<unknown> {
    return this.send("skills.install", { name, ...definition });
  }

  async listAgents(): Promise<unknown> {
    return this.send("agents.list", {});
  }

  async listModels(): Promise<unknown> {
    return this.send("models.list", {});
  }

  async getStatus(): Promise<unknown> {
    return this.send("status", {});
  }

  async invokeNode(nodeId: string, command: string, args: Record<string, unknown>): Promise<unknown> {
    return this.send("node.invoke", {
      nodeId,
      command,
      args,
    });
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopHeartbeat();
    this.rejectAllPending("Disconnecting");
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus("disconnected");
  }
}

// Singleton instance
let clientInstance: OpenClawClient | null = null;

export function getOpenClawClient(): OpenClawClient {
  if (!clientInstance) {
    const url = process.env.OPENCLAW_WS_URL || "ws://localhost:18789";
    const token = process.env.OPENCLAW_GATEWAY_TOKEN || "";
    clientInstance = new OpenClawClient({ url, gatewayToken: token });
  }
  return clientInstance;
}

export function resetOpenClawClient() {
  if (clientInstance) {
    clientInstance.disconnect();
    clientInstance = null;
  }
}

export { OpenClawClient };
