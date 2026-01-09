// 测试接受
import {onMessage} from "./client.js";

onMessage().then(res=> {
    console.log(res)
})