#!/bin/bash

# =============================================================================
# run-dashboard-automation.sh - 前端 Dashboard 自动化执行器（hermes 版）
# =============================================================================
# 只跑前端 session，用 hermes 替代 claude。
# 后端实现请用原来的 run-automation.sh。
#
# 使用方式：./run-dashboard-automation.sh <执行次数>
# 示例：./run-dashboard-automation.sh 3
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

TASK_HOME="/Users/lihong/Desktop/personal/code/service-home"
DASHBOARD_HOME="/Users/lihong/Desktop/personal/code/ai-dashboard"
LOG_DIR="$DASHBOARD_HOME/automation-logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/dashboard-$(date +%Y%m%d_%H%M%S).log"

log() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" >> "$LOG_FILE"
    case $level in
        INFO)    echo -e "${BLUE}[INFO]${NC} ${message}" ;;
        SUCCESS) echo -e "${GREEN}[SUCCESS]${NC} ${message}" ;;
        WARNING) echo -e "${YELLOW}[WARNING]${NC} ${message}" ;;
        ERROR)   echo -e "${RED}[ERROR]${NC} ${message}" ;;
        PROGRESS)echo -e "${CYAN}[PROGRESS]${NC} ${message}" ;;
    esac
}

count_remaining_tasks() {
    if [ -f "$TASK_HOME/task.json" ]; then
        grep -c '"passes": false' "$TASK_HOME/task.json" 2>/dev/null || echo "0"
    else
        echo "0"
    fi
}

get_current_task_id() {
    python3 -c "
import json
with open('$TASK_HOME/task.json') as f:
    data = json.load(f)
for t in sorted(data['tasks'], key=lambda x: x['id']):
    if not t['passes']:
        print(t['id'])
        break
" 2>/dev/null || echo "0"
}

if [ -z "$1" ]; then
    echo "用法: $0 <执行次数>"
    echo "示例: $0 3"
    exit 1
fi

if ! [[ "$1" =~ ^[0-9]+$ ]]; then
    echo "错误：参数必须是正整数"
    exit 1
fi

TOTAL_RUNS=$1

echo ""
echo "========================================"
echo "  Dashboard 前端自动化执行器（hermes）"
echo "  每个功能 = 1 个前端 session"
echo "========================================"
echo ""

log "INFO" "启动自动化，计划执行 $TOTAL_RUNS 个前端功能"
log "INFO" "日志文件：$LOG_FILE"

if [ ! -f "$TASK_HOME/task.json" ]; then
    log "ERROR" "task.json 不存在：$TASK_HOME/task.json"
    exit 1
fi

INITIAL_TASKS=$(count_remaining_tasks)
log "INFO" "初始待完成功能数：$INITIAL_TASKS"

for ((run=1; run<=TOTAL_RUNS; run++)); do
    echo ""
    echo "========================================"
    log "PROGRESS" "第 $run 个功能（共 $TOTAL_RUNS 个）"
    echo "========================================"

    REMAINING=$(count_remaining_tasks)
    if [ "$REMAINING" -eq 0 ]; then
        log "SUCCESS" "所有功能已全部完成！"
        break
    fi

    TASK_ID=$(get_current_task_id)
    TASK_NAME=$(python3 -c "
import json
with open('$TASK_HOME/task.json') as f:
    data = json.load(f)
for t in data['tasks']:
    if t['id'] == ${TASK_ID}:
        print(t['name'])
        break
" 2>/dev/null || echo "Task ${TASK_ID}")

    log "INFO" "当前任务 ID：$TASK_ID（${TASK_NAME}），剩余：$REMAINING 个"

    RUN_START=$(date +%s)

    FRONTEND_LOG="$LOG_DIR/dashboard-run${run}-task${TASK_ID}-$(date +%H%M%S).log"

    FRONTEND_PROMPT=$(mktemp)
    cat > "$FRONTEND_PROMPT" << PROMPT_EOF
读取 /Users/lihong/Desktop/personal/code/service-home/task.json，找到 id 为 ${TASK_ID} 的任务。

只完成【前端部分】，按照 frontend_steps 逐步实现：
1. 在 /Users/lihong/Desktop/personal/code/ai-dashboard/src/service/ 创建 API 调用层文件
2. 在 /Users/lihong/Desktop/personal/code/ai-dashboard/src/pages/ 创建页面组件
3. 修改 /Users/lihong/Desktop/personal/code/ai-dashboard/src/config/routes.tsx，在 skillsRoutes 末尾（coze 之前）添加路由
4. 修改 /Users/lihong/Desktop/personal/code/ai-dashboard/src/layouts/MainLayout.tsx，在 skillsMenuItems children 中（Portal 之前）添加菜单项
5. cd /Users/lihong/Desktop/personal/code/ai-dashboard && npm run build（必须无 TypeScript 错误）
6. 读取 task.json 中该任务的 e2e_test 字段，用 Playwright 工具按照步骤操作浏览器：
   - 打开 http://localhost:5173，导航到新页面
   - 按 e2e_test 描述执行真实操作（上传文件/输入内容/点击按钮）
   - 验证后端返回数据正确显示在页面上
   - 每个关键步骤截图保存到 /Users/lihong/Desktop/personal/code/service-home/test-fixtures/screenshots/task${TASK_ID}_*.png
   - 如果 e2e_test 操作失败（后端报错/页面无响应），记录失败原因，但仍可提交（前端实现本身正确即可）
7. 将 /Users/lihong/Desktop/personal/code/service-home/task.json 中 id 为 ${TASK_ID} 的任务 passes 改为 true
8. cd /Users/lihong/Desktop/personal/code/ai-dashboard && git add . && git commit -m "feat: [Task ${TASK_ID}] ${TASK_NAME} - 前端实现"
9. cd /Users/lihong/Desktop/personal/code/service-home && git add task.json && git commit -m "chore: [Task ${TASK_ID}] 标记前端完成"

注意：
- 不要修改 service-home 的代码文件（只能改 task.json）
- 后端 API 已实现，可以 curl 验证：curl http://localhost:3000/ai/...
- 测试夹具文件路径：test-fixtures/sample_data.csv 和 test-fixtures/sample_resume.pdf
- 遇到阻塞立即停止，不要将 passes 改为 true，不要提交
PROMPT_EOF

    log "INFO" "▶ 前端 session 开始 - Task $TASK_ID"

    if hermes --yolo -z "$(cat $FRONTEND_PROMPT)" 2>&1 | tee "$FRONTEND_LOG"; then
        log "SUCCESS" "前端 hermes session 完成"
    else
        log "WARNING" "前端 hermes session 结束（退出码 $?）"
    fi
    rm -f "$FRONTEND_PROMPT"

    REMAINING_AFTER=$(count_remaining_tasks)
    COMPLETED=$((REMAINING - REMAINING_AFTER))
    RUN_END=$(date +%s)
    RUN_DURATION=$((RUN_END - RUN_START))

    if [ "$COMPLETED" -gt 0 ]; then
        log "SUCCESS" "Task $TASK_ID 完成，耗时 ${RUN_DURATION} 秒"
        log "INFO" "推送到 GitHub..."
        cd "$DASHBOARD_HOME"
        git push 2>&1 && log "SUCCESS" "ai-dashboard 推送成功" || log "WARNING" "ai-dashboard 推送失败"
        cd "$TASK_HOME"
        git push 2>&1 && log "SUCCESS" "service-home 推送成功" || log "WARNING" "service-home 推送失败"
    else
        log "WARNING" "Task $TASK_ID 未能完成（可能遇到阻塞），耗时 ${RUN_DURATION} 秒"
    fi

    log "INFO" "剩余待完成功能数：$REMAINING_AFTER"
    echo "----------------------------------------" >> "$LOG_FILE"

    if [ $run -lt $TOTAL_RUNS ] && [ "$REMAINING_AFTER" -gt 0 ]; then
        log "INFO" "等待 3 秒后继续..."
        sleep 3
    fi
done

echo ""
echo "========================================"
log "SUCCESS" "自动化执行完毕！"
echo "========================================"

FINAL_REMAINING=$(count_remaining_tasks)
TOTAL_COMPLETED=$((INITIAL_TASKS - FINAL_REMAINING))

log "INFO" "汇总："
log "INFO" "  功能总数：$TOTAL_RUNS"
log "INFO" "  完成功能：$TOTAL_COMPLETED 个"
log "INFO" "  剩余功能：$FINAL_REMAINING 个"
log "INFO" "  日志文件：$LOG_FILE"

if [ "$FINAL_REMAINING" -eq 0 ]; then
    log "SUCCESS" "所有功能已全部实现！"
else
    log "WARNING" "仍有 $FINAL_REMAINING 个功能未完成，可继续运行。"
fi
