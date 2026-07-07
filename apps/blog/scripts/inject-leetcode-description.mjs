#!/usr/bin/env node
/**
 * 从 LeetCode 获取题目描述并注入到题解 .md 文件中
 * 用法: node scripts/inject-leetcode-description.mjs [--force]
 *  --force  强制重新生成，覆盖已有的题目描述
 *
 * 题目内容会缓存到 scripts/.leetcode-cache/{slug}.json，
 * 再次执行时优先读缓存，不会重复请求 LeetCode。
 * 若需重新拉取某题，删除对应 .json 后重跑即可。
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ALGO_DIR = join(__dirname, '../docs/ALGORITHM');
const README_PATH = join(ALGO_DIR, 'README.md');
const CACHE_DIR = join(__dirname, '.leetcode-cache');

// 从 README 解析 题目编号 -> LeetCode slug 的映射（支持当前列表格式）
function parseSlugMapping() {
  const readme = readFileSync(README_PATH, 'utf-8');
  const mapping = {};
  // 匹配: - **123** [标题](./xxx.md) — [LeetCode](https://leetcode.cn/problems/slug/)
  const problemUrlRegex = /-\s*\*\*(\d+)\*\*\s*\[[^\]]+\]\([^)]+\)\s*—\s*\[LeetCode\]\((https:\/\/leetcode\.cn\/problems\/([^/]+)\/)\)/g;
  let match;
  while ((match = problemUrlRegex.exec(readme)) !== null) {
    mapping[match[1]] = match[3];
  }
  // README 里只有 problemset/all?search= 的题没有 slug，用静态映射补全（题号 -> slug）
  const FALLBACK_SLUG_MAP = {
    193: 'valid-phone-numbers',
    1122: 'relative-sort-array',
    1189: 'maximum-number-of-balloons',
    1201: 'ugly-number-iii',
    1207: 'unique-number-of-occurrences',
    1323: 'maximum-69-number',
    1346: 'check-if-n-and-its-double-exist',
    1370: 'increasing-decreasing-string',
    1471: 'the-k-strongest-values-in-an-array',
    1472: 'design-browser-history',
    1669: 'merge-in-between-linked-lists',
    1684: 'count-the-number-of-consistent-strings',
    1721: 'swapping-nodes-in-a-linked-list',
    1748: 'sum-of-unique-elements',
    1768: 'merge-strings-alternately',
    2095: 'delete-the-middle-node-of-a-linked-list',
    2130: 'maximum-twin-sum-of-a-linked-list',
    2181: 'merge-nodes-in-between-zeros',
    2487: 'remove-nodes-from-linked-list',
  };
  const problemsetRegex = /-\s*\*\*(\d+)\*\*\s*\[[^\]]+\]\([^)]+\)\s*—\s*\[LeetCode\]\((https:\/\/leetcode\.cn\/problemset\/all\/\?search=\d+)\)/g;
  while ((match = problemsetRegex.exec(readme)) !== null) {
    if (!mapping[match[1]] && FALLBACK_SLUG_MAP[match[1]]) {
      mapping[match[1]] = FALLBACK_SLUG_MAP[match[1]];
    }
  }
  return mapping;
}

// 从 LeetCode CN GraphQL 获取中文题目描述（带本地缓存，避免每次请求）
async function fetchProblemContent(slug) {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
  const cachePath = join(CACHE_DIR, `${slug}.json`);
  if (existsSync(cachePath)) {
    return JSON.parse(readFileSync(cachePath, 'utf-8'));
  }
  const query = `
    query questionContent($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        translatedTitle
        translatedContent
        difficulty
      }
    }
  `;
  const res = await fetch('https://leetcode.cn/graphql/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Referer': 'https://leetcode.cn/',
    },
    body: JSON.stringify({ query, variables: { titleSlug: slug } }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0]?.message || 'GraphQL Error');
  const question = json.data?.question;
  if (question) {
    writeFileSync(cachePath, JSON.stringify(question, null, 0), 'utf-8');
  }
  return question;
}

// 将 LeetCode 返回的 HTML 转为简化的 Markdown
function htmlToMarkdown(html) {
  if (!html) return '';
  return html
    .replace(/<pre>[\s\S]*?<code>([\s\S]*?)<\/code>[\s\S]*?<\/pre>/gi, '```\n$1\n```')
    .replace(/<code>([^<]*)<\/code>/g, '`$1`')
    .replace(/<strong>([^<]*)<\/strong>/g, '**$1**')
    .replace(/<em>([^<]*)<\/em>/g, '*$1*')
    .replace(/<p>([^<]*)<\/p>/g, '$1\n\n')
    .replace(/<li>([^<]*)<\/li>/g, '- $1\n')
    .replace(/<ul>|<\/ul>|<ol>|<\/ol>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// 后处理：避免方括号被当成链接、统一示例/提示格式
function normalizeGeneratedMarkdown(desc) {
  // 1. 把非链接的 [xxx] 包成 `[xxx]`，避免被解析为链接（] 后不是 ( 的才替换）
  //    但不要包裹：空 []、以及 ['] ["]（括号在引号内表示字符）
  desc = desc.replace(/(?<!`)\[([^\]]*)\](?!\()/g, (match, inner) => {
    // 不包裹：空 []、引号 ['"]、纯数字下标 [0][1]（保持为原文）
    if (inner === '' || inner === "'" || inner === '"' || /^\d+$/.test(inner.trim())) return match;
    return '`[' + inner + ']`';
  });

  // 2. 修正 ***（加粗+斜体粘连）为 **
  desc = desc.replace(/\*\*\*/g, '**');

  // 2a. 修正 "最长 子串** **" 这种（加粗被拆开）为 **最长子串**
  desc = desc.replace(/最长\s+子串\*\* \*\*/g, '**最长子串**');

  // 2b. 修正 **和为目标值 **`target`* 这种（变量后的残留斜体 *）为 **和为目标值** `target`**
  desc = desc.replace(/\*\*([^*]+) \*\*`([^`]+)`\*/g, '**$1** `$2`**');
  // 2b2. 修正 `target`**  的那 **两个** 这种（加粗被拆开）为 `target` **的那两个**
  desc = desc.replace(/`([^`]+)`\*\*  的那 \*\*两个\*\*/g, '`$1` **的那两个**');

  // 2c. 修正 * *`xxx`* * 这种（头节点等变量外的多余斜体）为 `xxx`
  desc = desc.replace(/\* \*`([^`]+)`\* \*/g, '`$1`');

  // 2d. 修正 arr1`[i]`、arr2`[i]` 这种（变量与下标被拆开）为 `arr1[i]`、`arr2[i]`
  desc = desc.replace(/(\w+)`\[([ij])\]`/g, '`$1[$2]`');

  // 3. 修正 `x`* * 这种（反引号+残留斜体）为 **x**
  desc = desc.replace(/`(\w)`\* \*/g, '**$1**');

  // 3b. 括号题：把多个括号的独立代码块合并为一个，避免逗号孤零零（兼容 `'`['`，`']`'` 这种断开的）
  desc = desc.replace(
    /`'\(`'`，`'\)'`，`'\{'`，`'\}'`，(?:`'\[`'`，`'\]'`|`'`\[`，`'\]`'`)/g,
    "`'('，')'，'{'，'}'，'['，']'`"
  );

  // 4. 示例：把 **输入：** **输出：** **解释：** 行改为列表项（- 开头），并保证冒号后有空格
  desc = desc.replace(/^(\s*)(\*\*输入：\*\*)\s*/gm, '$1- $2 ');
  desc = desc.replace(/^(\s*)(\*\*输出：\*\*)\s*/gm, '$1- $2 ');
  desc = desc.replace(/^(\s*)(\*\*解释：\*\*)\s*/gm, '$1- $2 ');

  // 5. 提示：去掉行首制表符，让 \t- 变成普通 - 列表项
  desc = desc.replace(/^\t+(-\s)/gm, '$1');
  desc = desc.replace(/^\t+([^-\n])/gm, '- $1');

  return desc.replace(/\n{3,}/g, '\n\n').trim();
}

// 检查文件是否已有题目描述
function hasDescription(content) {
  return /##\s*题目描述\s*\n/.test(content);
}

async function main() {
  const force = process.argv.includes('--force');
  const slugMap = parseSlugMapping();
  const files = readdirSync(ALGO_DIR).filter(
    (f) => f.endsWith('.md') && f !== 'README.md' && f !== 'index.md' && !['二分查找', '动态规划', '排序算法'].some((t) => f.includes(t))
  );

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of files) {
    const num = file.match(/^(\d+)\./)?.[1];
    if (!num || !slugMap[num]) {
      skipped++;
      continue;
    }

    const filePath = join(ALGO_DIR, file);
    let content = readFileSync(filePath, 'utf-8');

    if (hasDescription(content) && !force) {
      skipped++;
      continue;
    }

    // 强制模式：移除已有的题目描述（从 ## 题目描述 到 ## 题解代码 之前）
    if (force && hasDescription(content)) {
      content = content.replace(/##\s*题目描述[\s\S]*?(?=\n##\s*题解代码)/, '');
    }

    try {
      const question = await fetchProblemContent(slugMap[num]);
      // 优先使用中文 translatedContent，若无则回退到 content
      const rawContent = question?.translatedContent || question?.content;
      if (!rawContent) {
        failed++;
        console.warn(`[跳过] ${file}: 未获取到题目内容`);
        continue;
      }

      const desc = normalizeGeneratedMarkdown(htmlToMarkdown(rawContent));
      const difficulty = question.difficulty || '';

      const descSection = `
## 题目描述

${desc}

**难度：** ${difficulty}

---

`;
      // 在 "## 题解代码" 之前插入
      content = content.replace(/(##\s*题解代码)/, descSection + '$1');
      writeFileSync(filePath, content);
      updated++;
      console.log(`[完成] ${file}`);
    } catch (err) {
      failed++;
      console.warn(`[失败] ${file}:`, err.message);
    }

    // 避免请求过快
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\n完成: 更新 ${updated}, 跳过 ${skipped}, 失败 ${failed}`);
}

main().catch(console.error);
