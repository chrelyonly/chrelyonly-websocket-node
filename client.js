import WebSocket from "ws"

const WS_URL = "ws://172.16.0.114:38080";

let ws;
let heartbeatTimer = null;
let messageCallback = null; // 存储外部注册的消息回调

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
            }else{
                // 如果存在回调函数则调用
                if (messageCallback){
                    messageCallback(item);
                }
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


// 抛出一个promise用来接收事件回调
export const onMessage = ()=>{
    return new Promise((resolve) => {
        // 传递方法
        messageCallback = resolve
    });
}

/**
 * 发送消息到服务器
 * @param {Object} msg - 要发送的消息对象
 * { type: "",data:""}
 */
export const sendMessage = (msg) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
    } else {
        console.warn("⚠️ WebSocket 未连接，消息发送失败:", msg);
    }
};


