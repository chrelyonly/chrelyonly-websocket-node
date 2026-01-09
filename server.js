const WebSocket = require("ws");

const PORT = 8080;
const wss = new WebSocket.Server({ port: PORT });

console.log("WebSocket 服务器已启动，端口", PORT);

// 保存客户端
const clients = new Set();

/* ================= 心跳配置 ================= */
const HEARTBEAT_INTERVAL = 15000; // 15 秒
function heartbeat() {
    this.isAlive = true;
}

/* ================= 连接 ================= */
wss.on("connection", function (ws) {
    console.log("✅ 客户端已连接");

    ws.isAlive = true;
    ws.on("pong", heartbeat);

    clients.add(ws);

    ws.on("message", function (message) {
        let msg = message.toString();
        console.log("📩 收到:", msg);

        // 解析 JSON
        let data;
        try {
            data = JSON.parse(msg);
        } catch (e) {}

        /* ====== 心跳处理 ====== */
        if (data && data.type === "ping") {
            ws.send(JSON.stringify({ type: "pong" }));
            return;
        }

        /* ====== 业务广播 ====== */
        for (let client of clients) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(msg);
            }
        }
    });

    ws.on("close", function () {
        console.log("❌ 客户端断开");
        clients.delete(ws);
    });

    ws.on("error", function (err) {
        console.log("⚠️ 客户端错误:", err.message);
    });
});

/* ================= 服务端判死 ================= */
const interval = setInterval(function () {
    for (let ws of clients) {
        if (ws.isAlive === false) {
            console.log("💀 客户端心跳超时，强制断开");
            clients.delete(ws);
            return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping(); // 原生 ping（ws 库）
    }
}, HEARTBEAT_INTERVAL);

wss.on("close", function () {
    clearInterval(interval);
});
