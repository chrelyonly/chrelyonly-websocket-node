const WebSocket = require("ws");

const WS_URL = "ws://172.16.0.114:38080";

let ws;
let heartbeatTimer = null;

function connect() {
    ws = new WebSocket(WS_URL);

    ws.on("open", () => {
        console.log("✅ 已连接服务器");
        // 主动心跳（配合你服务端的 type=ping）
        heartbeatTimer = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "ping" }));
            }
        }, 10000);
    });

    ws.on("message", (data) => {
        try {
            let item = JSON.parse(data);
            if (item.type === "pong"){
                console.log("📩 来自服务器:", data.toString());
            }
        }catch (e) {

        }

    });

    // 服务端 ws.ping() 会触发
    ws.on("ping", () => {
        ws.pong();
    });

    ws.on("close", () => {
        console.log("❌ 连接断开，3 秒后重连...");
        clearInterval(heartbeatTimer);
        setTimeout(connect, 3000);
    });

    ws.on("error", (err) => {
        console.log("⚠️ 连接错误:", err.message);
    });
}

connect();
