# PPT 下载前端对接文档

> Base URL：`https://your-server.com/api`  
> 所有接口返回 `Content-Type: application/json`，结构统一为 `{ code, msg, data }`，`code=0` 表示成功。

---

## 完整流程

```
① 发起 PPT 生成对话
        ↓ 从响应中提取 ppt_id
② 轮询 PPT 生成进度（每 4~5s）
        ↓ status=2，progress=100（生成成功）
③ 可选：免费在线预览
        ↓
④ 创建支付订单
        ↓ 返回 out_trade_no
⑤ 展示微信收款二维码，用户扫码付款
        ↓ 用户点击「我已付款」
⑥ 轮询订单状态（每 5s）
        ↓ status=2（管理员已确认）
⑦ 获取下载链接，触发浏览器保存文件
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
    "final_answer": "PPT 已开始生成，任务ID：RAsTQBPqKgHHUwkc3fBJeWUrqRB3U34n，共23页...",
    "steps": [
      {
        "type": "step",
        "data": [
          {
            "role": "function",
            "name": "build.ppt",
            "content": "{\"ppt_id\": \"RAsTQBPqKgHHUwkc3fBJeWUrqRB3U34n\", \"status\": 1, \"progress\": 0}"
          }
        ]
      }
    ],
    "history": [...],
    "reply_messages": [...]
  }
}
```

**提取 ppt_id 的两种方式（取一种即可）**

```js
// 方式一：从 steps 中的 function 结果解析（推荐，更可靠）
function extractPptIdFromSteps(steps) {
  for (const step of steps) {
    for (const msg of step.data ?? []) {
      if (msg.role === 'function') {
        try {
          const parsed = JSON.parse(msg.content)
          if (parsed.ppt_id) return parsed.ppt_id
        } catch {}
      }
    }
  }
  return null
}

// 方式二：从 final_answer 文本正则提取
function extractPptIdFromText(text) {
  return text.match(/"ppt_id"\s*:\s*"([^"]+)"/)?.[1]
          ?? text.match(/任务ID[：:]\s*([A-Za-z0-9]+)/)?.[1]
          ?? null
}

const pptId = extractPptIdFromSteps(data.steps) 
           || extractPptIdFromText(data.final_answer)
```

---

### 1.2 轮询 PPT 生成进度

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
    "ppt_title": "人工智能发展趋势",
    "status": 1,
    "progress": 80,
    "state_description": "正在输出文件...",
    "page_count": 21,
    "preview_url": "https://chatppt.yoo-ai.com/generateResults?generateID=xxx",
    "process_url": "https://chatppt.yoo-ai.com/generateResults?generateID=xxx",
    "first_image_up_at": "2026-02-25 18:56:57",
    "created_at": "2026-02-25 18:56:40",
    "updated_at": "2026-02-25 18:56:58"
  }
}
```

**生成状态码**

| status | progress | 含义 | 前端展示 |
|--------|----------|------|----------|
| `1` | 0% | 正在生成标题/大纲/内容 | 进度条 |
| `1` | 40%~80% | 正在渲染页面 / 输出文件 | 进度条 |
| `2` | 100% | ✅ 生成成功 | 进入支付 |
| `3` | - | ❌ 生成失败 | 提示重试 |

> 实测进度变化规律：`0% → 40% → 80% → 100%`，总耗时约 1~3 分钟。

**轮询代码**

```js
async function pollPptReady(pptId, onProgress) {
  return new Promise((resolve, reject) => {
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/ai/mcp-ppt/status?ppt_id=${pptId}`)
        const { code, data } = await res.json()
        if (code !== 0) return

        onProgress({
          progress: data.progress ?? 0,
          desc: data.state_description ?? '',
          previewUrl: data.preview_url
        })

        if (data.status === 2) { clearInterval(timer); resolve(data) }
        if (data.status === 3) { clearInterval(timer); reject(new Error(data.state_description || 'PPT 生成失败')) }
      } catch (e) {
        // 网络抖动忽略，继续轮询
      }
    }, 5000)
  })
}
```

---

### 1.3 免费在线预览（可选）

生成完成后 `preview_url` 可直接打开浏览预览，**不消耗下载配额，免费**：

```js
// 新标签打开在线预览
window.open(pptData.preview_url)
```

---

### 1.4 在线编辑器地址（可选）

```
GET /ai/mcp-ppt/editor?ppt_id={ppt_id}
```

**Response**

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "url": "https://aigc.yoo-ai.com/editor?id=api%3Axxx&token=xxx",
    "expire_time": "2026-02-26 18:00:00"
  }
}
```

```js
const editorRes = await fetch(`/api/ai/mcp-ppt/editor?ppt_id=${pptId}`)
const { data } = await editorRes.json()
window.open(data.url)  // 打开在线编辑器
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
    "out_trade_no": "a3f1c2d4e5b6a7c8d9e0f1a2b3c4d5e6",
    "amount": 1.5,
    "qrcode_url": "/api/payment/qrcode"
  }
}
```

> ⚠️ `out_trade_no` 需持久化到前端状态（localStorage 或组件状态），后续所有步骤都依赖它。

---

### 2.2 展示微信收款二维码

```
GET /payment/qrcode
```

直接作为 `<img>` 的 `src` 即可，无需任何参数：

```html
<img src="/api/payment/qrcode" width="200" height="200" alt="微信收款码" />
```

**建议支付弹窗布局**

```
┌────────────────────────────┐
│   扫码支付  ¥1.50           │
│                            │
│     [ 微信二维码图片 ]      │
│                            │
│  请备注：xxxx（订单号后4位）│
│                            │
│       [ 我已付款 ]          │
└────────────────────────────┘
```

> 提示用户付款时备注订单号后 4 位，便于管理员核对到账记录。

---

### 2.3 用户申报已付款

```
POST /payment/claim
```

**Request Body**

```json
{
  "out_trade_no": "a3f1c2d4e5b6a7c8d9e0f1a2b3c4d5e6"
}
```

**Response**

```json
{
  "code": 0,
  "msg": "已提交，请等待确认（通常几分钟内）"
}
```

> 调用成功后立即开始轮询订单状态（2.4），无需用户额外操作。

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
    "out_trade_no": "a3f1c2d4e5b6a7c8d9e0f1a2b3c4d5e6",
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
| `2` | **true** | ✅ 已确认，可下载 | 显示「下载 PPTX」按钮 |
| `3` | false | 已关闭/拒绝 | 提示联系客服 |

**轮询代码**

```js
async function pollOrderPaid(outTradeNo) {
  return new Promise((resolve, reject) => {
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/payment/status?out_trade_no=${outTradeNo}`)
        const { data } = await res.json()
        if (data.paid)        { clearInterval(timer); resolve(outTradeNo) }
        if (data.status === 3){ clearInterval(timer); reject(new Error('订单已关闭，请联系客服')) }
      } catch {}
    }, 5000)
  })
}
```

---

## 三、下载 PPTX

下载有两种方式，推荐方式一：

### 方式一：获取 CDN 直链，前端直接跳转（推荐）

```
GET /ai/mcp-ppt/download-url?ppt_id={ppt_id}
```

**Response**

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "download_url": "https://yoo-web-public.gz.bcebos.com/chatppt/xxx/xxx.pptx?authorization=..."
  }
}
```

```js
async function downloadPptxViaCdn(pptId) {
  const res = await fetch(`/api/ai/mcp-ppt/download-url?ppt_id=${pptId}`)
  const { code, data, msg } = await res.json()
  if (code !== 0) { alert(msg); return }
  window.open(data.download_url)  // 浏览器直接下载，链接有效期约 1 小时
}
```

> CDN 直链有时效（约 1 小时），不要缓存，每次下载时实时获取。

---

### 方式二：后端代理下载（需携带支付凭证）

```
GET /ai/mcp-ppt/download?ppt_id={ppt_id}&out_trade_no={out_trade_no}
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `ppt_id` | ✅ | PPT ID |
| `out_trade_no` | ✅ | 已支付并确认的订单号 |

**成功**：直接返回 `.pptx` 文件流，浏览器弹出「另存为」对话框。

**失败响应示例**

```json
{ "code": 402, "msg": "付款审核中，请稍候（通常几分钟内）" }
{ "code": 402, "msg": "请先完成微信扫码付款" }
{ "code": 402, "msg": "订单已关闭" }
{ "code": 404, "msg": "订单不存在" }
```

```js
function downloadPptxViaProxy(pptId, outTradeNo) {
  window.location.href = `/api/ai/mcp-ppt/download?ppt_id=${pptId}&out_trade_no=${outTradeNo}`
}
```

---

## 四、完整串联代码

```js
async function fullPptDownloadFlow(userPrompt) {

  // ① 发起生成
  const chatRes = await fetch('/api/ai/mcp-ppt/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: userPrompt }] })
  })
  const chatData = (await chatRes.json()).data

  // ② 提取 ppt_id
  const pptId = extractPptIdFromSteps(chatData.steps)
             || extractPptIdFromText(chatData.final_answer)
  if (!pptId) throw new Error('未获取到 ppt_id，请重试')

  // ③ 等待生成完成（轮询）
  const pptData = await pollPptReady(pptId, ({ progress, desc }) => {
    progressBar.value = progress
    statusText.innerText = desc
  })

  // ④ 可选：展示免费预览按钮
  previewBtn.href = pptData.preview_url

  // ⑤ 创建支付订单
  const orderRes = await fetch('/api/payment/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ biz_id: pptId })
  })
  const orderData = (await orderRes.json()).data
  const { out_trade_no, amount } = orderData

  // ⑥ 展示支付弹窗（UI 层自行实现）
  showPayModal({
    outTradeNo: out_trade_no,
    amount,
    qrcodeUrl: '/api/payment/qrcode',
    onClaim: async () => {
      await fetch('/api/payment/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ out_trade_no })
      })
      await pollOrderPaid(out_trade_no)  // 内部轮询，paid=true 时 resolve
      hidePayModal()
      showDownloadBtn()
    }
  })
}

// ⑦ 用户点「下载 PPTX」时触发
async function onClickDownload(pptId, outTradeNo) {
  // 推荐：获取 CDN 直链下载（无代理，更快）
  const res = await fetch(`/api/ai/mcp-ppt/download-url?ppt_id=${pptId}`)
  const { code, data, msg } = await res.json()
  if (code !== 0) { alert(msg); return }
  window.open(data.download_url)
}
```

---

## 五、错误码速查

| code | 触发场景 | 处理建议 |
|------|----------|----------|
| `400` | 参数缺失或格式错误 | 检查入参 |
| `402` | 未支付 / 审核中 / 订单关闭 | 见 `msg` 提示 |
| `404` | ppt_id 或订单号不存在 | 引导重新生成或联系客服 |
| `500` | 服务端异常（网络/第三方服务） | 见 `msg`，可重试 |

---

## 附：接口速查表

| 接口 | 方法 | 说明 |
|------|------|------|
| `/ai/mcp-ppt/chat` | POST | 发起 PPT 生成对话 |
| `/ai/mcp-ppt/status` | GET | 查询生成进度 |
| `/ai/mcp-ppt/editor` | GET | 获取在线编辑器链接 |
| `/ai/mcp-ppt/download-url` | GET | 获取 CDN 下载直链（推荐） |
| `/ai/mcp-ppt/download` | GET | 后端代理下载（需支付凭证） |
| `/payment/create` | POST | 创建支付订单 |
| `/payment/qrcode` | GET | 微信收款码图片 |
| `/payment/claim` | POST | 用户申报已付款 |
| `/payment/status` | GET | 查询订单状态 |
