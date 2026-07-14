import{_ as s,c as n,o as a,a as l}from"./app.814f737e.js";const C=JSON.parse('{"title":"42. \u63A5\u96E8\u6C34","description":"","frontmatter":{},"headers":[{"level":2,"title":"\u9898\u76EE\u63CF\u8FF0","slug":"\u9898\u76EE\u63CF\u8FF0","link":"#\u9898\u76EE\u63CF\u8FF0","children":[]},{"level":2,"title":"\u9898\u89E3\u4EE3\u7801","slug":"\u9898\u89E3\u4EE3\u7801","link":"#\u9898\u89E3\u4EE3\u7801","children":[]}],"relativePath":"ALGORITHM/42.\u63A5\u96E8\u6C34.md"}'),p={name:"ALGORITHM/42.\u63A5\u96E8\u6C34.md"},o=l(`<h1 id="_42-\u63A5\u96E8\u6C34" tabindex="-1"><a href="https://leetcode.cn/problems/trapping-rain-water/" target="_blank" rel="noreferrer">42. \u63A5\u96E8\u6C34</a> <a class="header-anchor" href="#_42-\u63A5\u96E8\u6C34" aria-hidden="true">#</a></h1><blockquote><p>\u539F\u9898\u94FE\u63A5\uFF1A<a href="https://leetcode.cn/problems/trapping-rain-water/" target="_blank" rel="noreferrer">LeetCode 42. \u63A5\u96E8\u6C34</a></p></blockquote><h2 id="\u9898\u76EE\u63CF\u8FF0" tabindex="-1">\u9898\u76EE\u63CF\u8FF0 <a class="header-anchor" href="#\u9898\u76EE\u63CF\u8FF0" aria-hidden="true">#</a></h2><p>\u7ED9\u5B9A <code>n</code> \u4E2A\u975E\u8D1F\u6574\u6570\u8868\u793A\u6BCF\u4E2A\u5BBD\u5EA6\u4E3A <code>1</code> \u7684\u67F1\u5B50\u7684\u9AD8\u5EA6\u56FE\uFF0C\u8BA1\u7B97\u6309\u6B64\u6392\u5217\u7684\u67F1\u5B50\uFF0C\u4E0B\u96E8\u4E4B\u540E\u80FD\u63A5\u591A\u5C11\u96E8\u6C34\u3002</p><p><strong>\u793A\u4F8B 1\uFF1A</strong></p><ul><li><strong>\u8F93\u5165\uFF1A</strong> height = <code>[0,1,0,2,1,0,1,3,2,1,2,1]</code></li><li><strong>\u8F93\u51FA\uFF1A</strong> 6</li><li><strong>\u89E3\u91CA\uFF1A</strong> \u4E0A\u9762\u662F\u7531\u6570\u7EC4 <code>[0,1,0,2,1,0,1,3,2,1,2,1]</code> \u8868\u793A\u7684\u9AD8\u5EA6\u56FE\uFF0C\u5728\u8FD9\u79CD\u60C5\u51B5\u4E0B\uFF0C\u53EF\u4EE5\u63A5 6 \u4E2A\u5355\u4F4D\u7684\u96E8\u6C34\uFF08\u84DD\u8272\u90E8\u5206\u8868\u793A\u96E8\u6C34\uFF09\u3002</li></ul><p><strong>\u793A\u4F8B 2\uFF1A</strong></p><ul><li><strong>\u8F93\u5165\uFF1A</strong> height = <code>[4,2,0,3,2,5]</code></li><li><strong>\u8F93\u51FA\uFF1A</strong> 9</li></ul><p><strong>\u63D0\u793A\uFF1A</strong></p><ul><li><p><code>n == height.length</code></p></li><li><p>1 &lt;= n &lt;= 2 * 104</p></li><li><p>0 &lt;= <code>height[i]</code> &lt;= 105</p></li></ul><p><strong>\u96BE\u5EA6\uFF1A</strong> Hard</p><hr><h2 id="\u9898\u89E3\u4EE3\u7801" tabindex="-1">\u9898\u89E3\u4EE3\u7801 <a class="header-anchor" href="#\u9898\u89E3\u4EE3\u7801" aria-hidden="true">#</a></h2><div class="language-javascript"><button title="Copy Code" class="copy"></button><span class="lang">javascript</span><pre class="shiki"><code><span class="line"><span style="color:#676E95;">/**</span></span>
<span class="line"><span style="color:#676E95;"> * </span><span style="color:#89DDFF;">@</span><span style="color:#C792EA;">param</span><span style="color:#676E95;"> </span><span style="color:#89DDFF;">{</span><span style="color:#FFCB6B;">number[]</span><span style="color:#89DDFF;">}</span><span style="color:#676E95;"> </span><span style="color:#A6ACCD;">height</span></span>
<span class="line"><span style="color:#676E95;"> * </span><span style="color:#89DDFF;">@</span><span style="color:#C792EA;">return</span><span style="color:#676E95;"> </span><span style="color:#89DDFF;">{</span><span style="color:#FFCB6B;">number</span><span style="color:#89DDFF;">}</span></span>
<span class="line"><span style="color:#676E95;"> */</span></span>
<span class="line"></span>
<span class="line"><span style="color:#676E95;">// \u901A\u8FC7\u4F46\u662F\u8D85\u65F6</span></span>
<span class="line"><span style="color:#676E95;">// var trap = function(height) {</span></span>
<span class="line"><span style="color:#676E95;">//   let ret = 0</span></span>
<span class="line"><span style="color:#676E95;">//   for (let i = 1; i &lt; height.length - 1; i++) {</span></span>
<span class="line"><span style="color:#676E95;">//     let maxLeft = 0, maxRight = 0</span></span>
<span class="line"><span style="color:#676E95;">//     for (let j = i - 1; j &gt;= 0; j--) {</span></span>
<span class="line"><span style="color:#676E95;">//       maxLeft = Math.max(height[j], maxLeft)</span></span>
<span class="line"><span style="color:#676E95;">//     }</span></span>
<span class="line"><span style="color:#676E95;">//     for (let j = i + 1; j &lt; height.length; j++) {</span></span>
<span class="line"><span style="color:#676E95;">//       maxRight = Math.max(height[j], maxRight)</span></span>
<span class="line"><span style="color:#676E95;">//     }</span></span>
<span class="line"><span style="color:#676E95;">//     const min = Math.min(maxLeft, maxRight)</span></span>
<span class="line"><span style="color:#676E95;">//     if (height[i] &lt; min) {</span></span>
<span class="line"><span style="color:#676E95;">//       ret += min - height[i]</span></span>
<span class="line"><span style="color:#676E95;">//     }</span></span>
<span class="line"><span style="color:#676E95;">//   }</span></span>
<span class="line"><span style="color:#676E95;">//   return ret</span></span>
<span class="line"><span style="color:#676E95;">// };</span></span>
<span class="line"></span>
<span class="line"><span style="color:#676E95;">// \u52A8\u6001\u89C4\u5212 \u9884\u5148\u6C42\u51FA\u6BCF\u4E2A\u4F4D\u7F6E\u4E0A\u5BF9\u5E94\u7684\u5DE6\u8FB9\u6700\u5927\u503C\uFF0C\u53F3\u8FB9\u6700\u5927\u503C</span></span>
<span class="line"><span style="color:#676E95;">// var trap = function(height) {</span></span>
<span class="line"><span style="color:#676E95;">//   let ret = 0</span></span>
<span class="line"><span style="color:#676E95;">//   const maxLeft = [0]</span></span>
<span class="line"><span style="color:#676E95;">//   const maxRight = []</span></span>
<span class="line"><span style="color:#676E95;">//   maxRight[height.length - 1] = 0</span></span>
<span class="line"><span style="color:#676E95;">//   for (let i = 1; i &lt; height.length - 1; i++) {</span></span>
<span class="line"><span style="color:#676E95;">//     maxLeft[i] = Math.max(maxLeft[i - 1], height[i - 1])</span></span>
<span class="line"><span style="color:#676E95;">//   }</span></span>
<span class="line"><span style="color:#676E95;">//   for (let i = height.length - 2; i &gt; 0; i--) {</span></span>
<span class="line"><span style="color:#676E95;">//     maxRight[i] = Math.max(maxRight[i + 1], height[i + 1])</span></span>
<span class="line"><span style="color:#676E95;">//   }</span></span>
<span class="line"><span style="color:#676E95;">//   for (let i = 1; i &lt; height.length - 1; i++) {</span></span>
<span class="line"><span style="color:#676E95;">//     const min = Math.min(maxLeft[i], maxRight[i])</span></span>
<span class="line"><span style="color:#676E95;">//     if (height[i] &lt; min) {</span></span>
<span class="line"><span style="color:#676E95;">//       ret += min - height[i]</span></span>
<span class="line"><span style="color:#676E95;">//     }</span></span>
<span class="line"><span style="color:#676E95;">//   }</span></span>
<span class="line"><span style="color:#676E95;">//   return ret</span></span>
<span class="line"><span style="color:#676E95;">// };</span></span>
<span class="line"></span>
<span class="line"><span style="color:#676E95;">// var trap = function (height) {</span></span>
<span class="line"><span style="color:#676E95;">//   let ret = 0</span></span>
<span class="line"><span style="color:#676E95;">//   let left = 0, right = height.length - 1</span></span>
<span class="line"><span style="color:#676E95;">//   let maxLeft = 0, maxRight = 0</span></span>
<span class="line"><span style="color:#676E95;">//   while (left &lt; right) {</span></span>
<span class="line"><span style="color:#676E95;">//     if (height[left] &lt; height[right]) {</span></span>
<span class="line"><span style="color:#676E95;">//       if (height[left] &gt; maxLeft) {</span></span>
<span class="line"><span style="color:#676E95;">//         maxLeft = height[left]</span></span>
<span class="line"><span style="color:#676E95;">//       } else {</span></span>
<span class="line"><span style="color:#676E95;">//         ret += maxLeft - height[left]</span></span>
<span class="line"><span style="color:#676E95;">//       }</span></span>
<span class="line"><span style="color:#676E95;">//       left++</span></span>
<span class="line"><span style="color:#676E95;">//     } else {</span></span>
<span class="line"><span style="color:#676E95;">//       if (height[right] &gt; maxRight) {</span></span>
<span class="line"><span style="color:#676E95;">//         maxRight = height[right]</span></span>
<span class="line"><span style="color:#676E95;">//       } else {</span></span>
<span class="line"><span style="color:#676E95;">//         ret += maxRight - height[right]</span></span>
<span class="line"><span style="color:#676E95;">//       }</span></span>
<span class="line"><span style="color:#676E95;">//       right--</span></span>
<span class="line"><span style="color:#676E95;">//     }</span></span>
<span class="line"><span style="color:#676E95;">//   }</span></span>
<span class="line"><span style="color:#676E95;">//   return ret</span></span>
<span class="line"><span style="color:#676E95;">// }</span></span>
<span class="line"></span>
<span class="line"><span style="color:#676E95;">// \u5355\u8C03\u9012\u51CF\u6808</span></span>
<span class="line"><span style="color:#C792EA;">var</span><span style="color:#A6ACCD;"> trap </span><span style="color:#89DDFF;">=</span><span style="color:#A6ACCD;"> </span><span style="color:#C792EA;">function</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">(</span><span style="color:#A6ACCD;">height</span><span style="color:#89DDFF;">)</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">{</span></span>
<span class="line"><span style="color:#F07178;">  </span><span style="color:#C792EA;">const</span><span style="color:#F07178;"> </span><span style="color:#A6ACCD;">stack</span><span style="color:#F07178;"> </span><span style="color:#89DDFF;">=</span><span style="color:#F07178;"> [] </span><span style="color:#676E95;">// \u6309\u9AD8\u5EA6\u5355\u8C03\u9012\u51CF--\u7D22\u5F15</span></span>
<span class="line"><span style="color:#F07178;">  </span><span style="color:#C792EA;">let</span><span style="color:#F07178;"> </span><span style="color:#A6ACCD;">i</span><span style="color:#F07178;"> </span><span style="color:#89DDFF;">=</span><span style="color:#F07178;"> </span><span style="color:#F78C6C;">0</span><span style="color:#89DDFF;">,</span><span style="color:#F07178;"> </span><span style="color:#A6ACCD;">ret</span><span style="color:#F07178;"> </span><span style="color:#89DDFF;">=</span><span style="color:#F07178;"> </span><span style="color:#F78C6C;">0</span></span>
<span class="line"><span style="color:#F07178;">  </span><span style="color:#89DDFF;">while</span><span style="color:#F07178;"> (</span><span style="color:#A6ACCD;">i</span><span style="color:#F07178;"> </span><span style="color:#89DDFF;">&lt;</span><span style="color:#F07178;"> </span><span style="color:#A6ACCD;">height</span><span style="color:#89DDFF;">.</span><span style="color:#A6ACCD;">length</span><span style="color:#F07178;">) </span><span style="color:#89DDFF;">{</span></span>
<span class="line"><span style="color:#F07178;">    </span><span style="color:#89DDFF;">while</span><span style="color:#F07178;">(</span><span style="color:#A6ACCD;">stack</span><span style="color:#89DDFF;">.</span><span style="color:#A6ACCD;">length</span><span style="color:#F07178;"> </span><span style="color:#89DDFF;">&amp;&amp;</span><span style="color:#F07178;"> </span><span style="color:#A6ACCD;">height</span><span style="color:#F07178;">[</span><span style="color:#A6ACCD;">stack</span><span style="color:#F07178;">[</span><span style="color:#A6ACCD;">stack</span><span style="color:#89DDFF;">.</span><span style="color:#A6ACCD;">length</span><span style="color:#F07178;"> </span><span style="color:#89DDFF;">-</span><span style="color:#F07178;"> </span><span style="color:#F78C6C;">1</span><span style="color:#F07178;">]] </span><span style="color:#89DDFF;">&lt;</span><span style="color:#F07178;"> </span><span style="color:#A6ACCD;">height</span><span style="color:#F07178;">[</span><span style="color:#A6ACCD;">i</span><span style="color:#F07178;">]) </span><span style="color:#89DDFF;">{</span></span>
<span class="line"><span style="color:#F07178;">      </span><span style="color:#C792EA;">const</span><span style="color:#F07178;"> </span><span style="color:#A6ACCD;">top</span><span style="color:#F07178;"> </span><span style="color:#89DDFF;">=</span><span style="color:#F07178;"> </span><span style="color:#A6ACCD;">stack</span><span style="color:#89DDFF;">.</span><span style="color:#82AAFF;">pop</span><span style="color:#F07178;">()</span></span>
<span class="line"><span style="color:#F07178;">      </span><span style="color:#89DDFF;">if</span><span style="color:#F07178;"> (</span><span style="color:#89DDFF;">!</span><span style="color:#A6ACCD;">stack</span><span style="color:#89DDFF;">.</span><span style="color:#A6ACCD;">length</span><span style="color:#F07178;">) </span><span style="color:#89DDFF;">break</span><span style="color:#F07178;"> </span><span style="color:#676E95;">// \u5F53\u524D\u67F1\u5B50\u662F\u6700\u9AD8\u7684\u67F1\u5B50\u4E86</span></span>
<span class="line"><span style="color:#F07178;">      </span><span style="color:#C792EA;">const</span><span style="color:#F07178;"> </span><span style="color:#A6ACCD;">dis</span><span style="color:#F07178;"> </span><span style="color:#89DDFF;">=</span><span style="color:#F07178;"> </span><span style="color:#A6ACCD;">i</span><span style="color:#F07178;"> </span><span style="color:#89DDFF;">-</span><span style="color:#F07178;"> </span><span style="color:#A6ACCD;">stack</span><span style="color:#F07178;">[</span><span style="color:#A6ACCD;">stack</span><span style="color:#89DDFF;">.</span><span style="color:#A6ACCD;">length</span><span style="color:#F07178;"> </span><span style="color:#89DDFF;">-</span><span style="color:#F07178;"> </span><span style="color:#F78C6C;">1</span><span style="color:#F07178;">] </span><span style="color:#89DDFF;">-</span><span style="color:#F07178;"> </span><span style="color:#F78C6C;">1</span></span>
<span class="line"><span style="color:#F07178;">      </span><span style="color:#C792EA;">const</span><span style="color:#F07178;"> </span><span style="color:#A6ACCD;">ht</span><span style="color:#F07178;"> </span><span style="color:#89DDFF;">=</span><span style="color:#F07178;"> </span><span style="color:#A6ACCD;">Math</span><span style="color:#89DDFF;">.</span><span style="color:#82AAFF;">min</span><span style="color:#F07178;">(</span><span style="color:#A6ACCD;">height</span><span style="color:#F07178;">[</span><span style="color:#A6ACCD;">i</span><span style="color:#F07178;">]</span><span style="color:#89DDFF;">,</span><span style="color:#F07178;"> </span><span style="color:#A6ACCD;">height</span><span style="color:#F07178;">[</span><span style="color:#A6ACCD;">stack</span><span style="color:#F07178;">[</span><span style="color:#A6ACCD;">stack</span><span style="color:#89DDFF;">.</span><span style="color:#A6ACCD;">length</span><span style="color:#F07178;"> </span><span style="color:#89DDFF;">-</span><span style="color:#F07178;"> </span><span style="color:#F78C6C;">1</span><span style="color:#F07178;">]]) </span><span style="color:#89DDFF;">-</span><span style="color:#F07178;"> </span><span style="color:#A6ACCD;">height</span><span style="color:#F07178;">[</span><span style="color:#A6ACCD;">top</span><span style="color:#F07178;">]</span></span>
<span class="line"><span style="color:#F07178;">      </span><span style="color:#A6ACCD;">ret</span><span style="color:#F07178;"> </span><span style="color:#89DDFF;">+=</span><span style="color:#F07178;"> </span><span style="color:#A6ACCD;">dis</span><span style="color:#F07178;"> </span><span style="color:#89DDFF;">*</span><span style="color:#F07178;"> </span><span style="color:#A6ACCD;">ht</span></span>
<span class="line"><span style="color:#F07178;">    </span><span style="color:#89DDFF;">}</span></span>
<span class="line"><span style="color:#F07178;">    </span><span style="color:#A6ACCD;">stack</span><span style="color:#89DDFF;">.</span><span style="color:#82AAFF;">push</span><span style="color:#F07178;">(</span><span style="color:#A6ACCD;">i</span><span style="color:#89DDFF;">++</span><span style="color:#F07178;">)</span></span>
<span class="line"><span style="color:#F07178;">  </span><span style="color:#89DDFF;">}</span></span>
<span class="line"><span style="color:#F07178;">  </span><span style="color:#89DDFF;">return</span><span style="color:#F07178;"> </span><span style="color:#A6ACCD;">ret</span></span>
<span class="line"><span style="color:#89DDFF;">}</span></span>
<span class="line"></span></code></pre></div>`,14),e=[o];function t(c,r,y,i,F,h){return a(),n("div",null,e)}const A=s(p,[["render",t]]);export{C as __pageData,A as default};
