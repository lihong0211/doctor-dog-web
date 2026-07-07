# PPT 下载前端对接文档

> Base URL：`https://your-server.com/api`  
> 所有接口返回 `Content-Type: application/json`，结构统一为 `{ code, msg, data }`，`code=0` 表示成功。

---

## 完整流程

```
① 发起 PPT 生成对话
        ↓ 返回 ppt_id
② 轮询 PPT 生成进度（每 4s）
        ↓ status=2（生成成功）
③ 创建支付订单
        ↓ 返回 out_trade_no
④ 展示微信收款二维码，用户扫码付款
        ↓ 用户点击「我已付款」
⑤ 轮询订单状态（每 5s）
        ↓ status=2（管理员已确认）
⑥ 下载 PPTX 文件
```

---

## 一、生成 PPT

### 1.1 发起生成对话

```
POST /ai/mcp-ppt/chat
```

**Request Body**

```json
{
  "messages": [
    { "role": "user", "content": "帮我做一个关于人工智能发展趋势的PPT" }
  ]
}
```

**Response**

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "final_answer": "...PPT已创建，ppt_id: RAsTQBPqKgHHUwkc3fBJeWUrqRB3U34n ...",
    "steps": [...],
    "history": [...]
  }
}
```

> `final_answer` 文本中包含 `ppt_id`，使用正则提取：
> ```js
> const match = finalAnswer.match(/"ppt_id"\s*:\s*"([^"]+)"/)
> const pptId = match?.[1]
> ```

---

### 1.2 查询 PPT 生成进度

```
GET /ai/mcp-ppt/status?ppt_id={ppt_id}
```

**Response**

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "ppt_id": "RAsTQBPqKgHHUwkc3fBJeWUrqRB3U34n",
    "status": 1,
    "progress": 60,
    "state_description": "正在渲染11/23页",
    "page_count": 23,
    "preview_url": "https://chatppt.yoo-ai.com/generateResults?generateID=xxx",
    "process_url": "https://chatppt.yoo-ai.com/generateResults?generateID=xxx"
  }
}
```

**生成状态码**

| status | 含义 |
|--------|------|
| `1` | 生成中，持续轮询 `progress` |
| `2` | 生成成功，进入支付流程 |
| `3` | 生成失败，提示用户重试 |

**轮询示例**

```js
async function pollPptReady(pptId, onProgress) {
  return new Promise((resolve, reject) => {
    const timer = setInterval(async () => {
      const res = await fetch(`/api/ai/mcp-ppt/status?ppt_id=${pptId}`)
      const { data } = await res.json()
      onProgress(data.progress ?? 0)
      if (data.status === 2) { clearInterval(timer); resolve(data) }
      if (data.status === 3) { clearInterval(timer); reject(new Error('PPT 生成失败')) }
    }, 4000)
  })
}
```

---

### 1.3 预览 PPT（可选，免费）

生成成功后可直接用 `preview_url` 在新标签预览，**不消耗下载次数**：

```js
window.open(data.preview_url)
```

---

## 二、支付

### 2.1 创建订单

```
POST /payment/create
```

**Request Body**

```json
{
  "biz_id": "RAsTQBPqKgHHUwkc3fBJeWUrqRB3U34n",
  "biz_type": "ppt_download",
  "subject": "PPT下载",
  "amount": 1.5
}
```

| 字段 | 必填 | 说明 |
|------|------|------|
| `biz_id` | ✅ | ppt_id |
| `biz_type` | 否 | 默认 `ppt_download` |
| `subject` | 否 | 商品名，默认 `PPT下载` |
| `amount` | 否 | 金额（元），默认 `1.5` |

**Response**

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "out_trade_no": "a3f1c2d4e5b6...",
    "amount": 1.5,
    "qrcode_url": "/api/payment/qrcode"
  }
}
```

> ⚠️ `out_trade_no` 需存入前端状态，后续所有步骤都依赖它。

---

### 2.2 展示微信收款二维码

```
GET /payment/qrcode
```

直接作为 `<img>` 的 `src` 使用：

```html
<img src="/api/payment/qrcode" width="200" height="200" alt="微信收款码" />
```

**建议弹窗布局**

```
┌─────────────────────────┐
│   扫码支付  ¥1.50        │
│                         │
│    [ 微信二维码图片 ]    │
│                         │
│  请备注订单号后4位：xxxx │
│                         │
│      [ 我已付款 ]        │
└─────────────────────────┘
```

> 提示用户付款时备注订单号后 4 位，便于手动核对。

---

### 2.3 用户申报已付款

```
POST /payment/claim
```

**Request Body**

```json
{
  "out_trade_no": "a3f1c2d4e5b6..."
}
```

**Response**

```json
{
  "code": 0,
  "msg": "已提交，请等待确认（通常几分钟内）"
}
```

---

### 2.4 轮询订单状态

```
GET /payment/status?out_trade_no={out_trade_no}
```

**Response**

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "out_trade_no": "a3f1c2d4e5b6...",
    "biz_id": "RAsTQBPqKgHHUwkc3fBJeWUrqRB3U34n",
    "status": 1,
    "status_desc": "待确认",
    "amount": 1.5,
    "paid": false
  }
}
```

**订单状态码**

| status | paid | 含义 | 前端展示 |
|--------|------|------|----------|
| `0` | false | 待支付 | 展示二维码 |
| `1` | false | 待确认（用户已申报） | 「确认中，请稍候...」转圈 |
| `2` | true | 已确认，可下载 | 显示下载按钮 |
| `3` | false | 已关闭/拒绝 | 提示联系客服 |

**轮询示例**

```js
async function pollOrderPaid(outTradeNo) {
  return new Promise((resolve, reject) => {
    const timer = setInterval(async () => {
      const res = await fetch(`/api/payment/status?out_trade_no=${outTradeNo}`)
      const { data } = await res.json()
      if (data.paid) { clearInterval(timer); resolve(outTradeNo) }
      if (data.status === 3) { clearInterval(timer); reject(new Error('订单已关闭')) }
    }, 5000)
  })
}
```

---

## 三、下载 PPTX

```
GET /ai/mcp-ppt/download?ppt_id={ppt_id}&out_trade_no={out_trade_no}
```

**参数**

| 参数 | 必填 | 说明 |
|------|------|------|
| `ppt_id` | ✅ | PPT ID |
| `out_trade_no` | ✅ | 已支付的订单号 |

**成功响应**：返回 `application/vnd.openxmlformats-officedocument.presentationml.presentation` 文件流，浏览器自动触发「另存为」。

**错误响应示例**

```json
{ "code": 402, "msg": "付款审核中，请稍候（通常几分钟内）" }
{ "code": 402, "msg": "请先完成微信扫码付款" }
{ "code": 404, "msg": "订单不存在" }
```

**前端调用**

```js
// 直接跳转，浏览器弹出下载对话框
function downloadPptx(pptId, outTradeNo) {
  window.location.href = `/api/ai/mcp-ppt/download?ppt_id=${pptId}&out_trade_no=${outTradeNo}`
}
```

---

## 四、完整串联代码

```js
async function fullPptDownloadFlow(userPrompt) {
  // ① 生成
  const chatRes = await fetch('/api/ai/mcp-ppt/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: userPrompt }] })
  })
  const chatData = (await chatRes.json()).data
  const pptId = chatData.final_answer.match(/"ppt_id"\s*:\s*"([^"]+)"/)?.[1]
  if (!pptId) throw new Error('未获取到 ppt_id')

  // ② 等待生成完成
  await pollPptReady(pptId, (p) => console.log('生成进度', p + '%'))

  // ③ 创建订单
  const orderRes = await fetch('/api/payment/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ biz_id: pptId })
  })
  const { out_trade_no, amount } = (await orderRes.json()).data

  // ④ 展示支付弹窗（UI 层自行实现）
  showPayModal({ outTradeNo: out_trade_no, amount })

  // ⑤ 等待用户点击「我已付款」后轮询
  //    点击回调中先调 /payment/claim，再调 pollOrderPaid
  await pollOrderPaid(out_trade_no)

  // ⑥ 下载
  window.location.href = `/api/ai/mcp-ppt/download?ppt_id=${pptId}&out_trade_no=${out_trade_no}`
}
```

---

## 五、错误码速查

| code | 场景 |
|------|------|
| `400` | 参数缺失或格式错误 |
| `402` | 未支付 / 审核中（禁止下载） |
| `404` | ppt_id 或订单号不存在 |
| `500` | 服务端异常，见 `msg` |
