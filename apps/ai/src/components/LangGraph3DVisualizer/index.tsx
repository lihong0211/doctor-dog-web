import { useRef, useState, Suspense, useEffect } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { RGBELoader } from 'three-stdlib'
import {
  OrbitControls,
  Text,
  Line,
  Html,
  Sparkles,
  Ring,
  Environment,
} from '@react-three/drei'
// @ts-ignore – troika-three-text has no bundled type declarations
import { preloadFont } from 'troika-three-text'
import * as THREE from 'three'
import './index.css'

export type NodeType = 'input' | 'llm' | 'tool' | 'condition' | 'output' | 'process'

export interface GraphNodeData {
  id: string
  name: string
  type: NodeType
  icon?: string
  description?: string
}

export interface GraphEdgeData {
  source: string
  target: string
  type?: 'normal' | 'conditional' | 'parallel'
  /** 条件边可选的展示标签（如 weather / chat） */
  label?: string
}

export interface GraphData {
  nodes: GraphNodeData[]
  edges: GraphEdgeData[]
  executionOrder?: string[]
}

// 更协调的配色方案 - 使用渐变和柔和的色调
const NODE_COLORS: Record<NodeType, string> = {
  input: '#60a5fa',      // 柔和的蓝色
  llm: '#a78bfa',        // 柔和的紫色
  tool: '#34d399',       // 柔和的绿色
  condition: '#fbbf24',  // 柔和的黄色
  output: '#fb7185',     // 柔和的粉色
  process: '#818cf8',    // 柔和的靛蓝色
}

const EDGE_COLORS: Record<string, string> = {
  normal: '#60a5fa',     // 与输入节点一致的蓝色
  conditional: '#fbbf24', // 与条件节点一致的黄色
  parallel: '#818cf8',    // 与处理节点一致的靛蓝色
}

interface GraphNodeProps {
  node: GraphNodeData
  isActive: boolean
  isCompleted: boolean
  onClick: () => void
  position: THREE.Vector3
}

const GraphNode = ({ node, isActive, isCompleted, onClick, position }: GraphNodeProps) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const color = NODE_COLORS[node.type] ?? '#ffffff'

  useFrame((state) => {
    if (meshRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.03
      meshRef.current.scale.setScalar(pulse)
    }
  })

  const nodeSize = isActive ? 1.4 : isCompleted ? 1.2 : 1.0

  return (
    <group position={position}>
      {/* 主节点 - 球体，根据节点类型使用不同材质（参考 FastHDR 示例） */}
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[nodeSize, 64, 32]} />
        {node.type === 'input' ? (
          // 输入节点：高反射金属（类似示例中的铬球）
          <meshPhysicalMaterial
            color={color}
            metalness={1}
            roughness={0}
            envMapIntensity={2.5}
            clearcoat={1}
            clearcoatRoughness={0}
          />
        ) : node.type === 'llm' ? (
          // LLM 节点：光泽材质（类似示例中的绿色球）
          <meshPhysicalMaterial
            color={color}
            metalness={0}
            roughness={0}
            envMapIntensity={2}
            clearcoat={0.8}
            clearcoatRoughness={0.1}
          />
        ) : node.type === 'tool' ? (
          // 工具节点：哑光金属（类似示例中的暗灰色球）
          <meshPhysicalMaterial
            color={color}
            metalness={1}
            roughness={0.5}
            envMapIntensity={1.8}
            clearcoat={0.3}
            clearcoatRoughness={0.3}
          />
        ) : node.type === 'condition' ? (
          // 条件节点：半透明玻璃（类似示例中的透明球）
          <meshPhysicalMaterial
            color={color}
            transmission={0.9}
            thickness={1.5}
            metalness={0}
            roughness={0}
            envMapIntensity={2}
          />
        ) : (
          // 其他节点：标准物理材质
          <meshPhysicalMaterial
            color={color}
            metalness={0.8}
            roughness={isActive ? 0.1 : isCompleted ? 0.2 : 0.3}
            envMapIntensity={2}
            clearcoat={0.6}
            clearcoatRoughness={0.1}
          />
        )}
      </mesh>

      {/* 图标 - 放在节点中心上方 */}
      <Html position={[0, nodeSize + 0.5, 0]} center zIndexRange={[0, 0]}>
        <div className={`node-icon-badge ${isActive ? 'active' : ''}`}>
          {node.icon ?? '⚡'}
        </div>
      </Html>

      {/* 节点名称 */}
      <Text
        position={[0, -nodeSize - 0.8, 0]}
        fontSize={0.35}
        color="rgba(255, 255, 255, 0.9)"
        anchorX="center"
        anchorY="top"
        outlineWidth={0.02}
        outlineColor="rgba(0, 0, 0, 0.8)"
        maxWidth={3}
      >
        {node.name}
      </Text>

      {/* 悬停时的粒子效果 */}
      {hovered && (
        <Sparkles
          count={15}
          scale={1.5}
          size={2}
          speed={0.3}
          color={color}
        />
      )}

      {/* 激活时的脉冲环 */}
      {isActive && (
        <Ring args={[nodeSize * 1.5, nodeSize * 1.6, 32]} rotation-x={Math.PI / 2}>
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </Ring>
      )}
    </group>
  )
}

interface GraphEdgeProps {
  start: THREE.Vector3
  end: THREE.Vector3
  type?: 'normal' | 'conditional' | 'parallel'
  isActive?: boolean
  label?: string
}

function getCurvePoints(start: THREE.Vector3, end: THREE.Vector3, segments = 24): THREE.Vector3[] {
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
  const offset = end.clone().sub(start).length() * 0.3
  mid.y += offset
  const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
  return curve.getPoints(segments)
}

const GraphEdge = ({ start, end, type = 'normal', isActive = false, label }: GraphEdgeProps) => {
  const points = getCurvePoints(start, end)
  const color = EDGE_COLORS[type] ?? '#60a5fa'
  const mid = points[Math.floor(points.length / 2)]

  return (
    <group>
      {/* 主边线 - 在环境贴图下使用更亮的颜色 */}
      <Line
        points={points}
        color={color}
        lineWidth={isActive ? 2.5 : 1.2}
        dashed={type === 'conditional'}
        transparent
        opacity={isActive ? 0.95 : type === 'conditional' ? 0.6 : 0.5}
      />
      {/* 激活时的光晕 */}
      {isActive && (
        <Line
          points={points}
          color={color}
          lineWidth={4}
          transparent
          opacity={0.25}
        />
      )}
      {/* 边标签 - 更小更精致 */}
      {label && (type === 'conditional' || type === 'parallel') && (
        <Html position={mid} center style={{ pointerEvents: 'none' }} zIndexRange={[0, 0]}>
          <span className="edge-label-small">{label}</span>
        </Html>
      )}
    </group>
  )
}

/** 按图结构做分层布局（BFS）：入口在前层，出口在后层，同层节点横向排开 */
function calculateLayeredPositions(
  nodes: GraphNodeData[],
  edges: GraphEdgeData[],
  layerSpacingOverride?: number
): Record<string, THREE.Vector3> {
  const targets = new Set(edges.map((e) => e.target))
  const outEdges = new Map<string, string[]>()
  edges.forEach((e) => {
    if (!outEdges.has(e.source)) outEdges.set(e.source, [])
    outEdges.get(e.source)!.push(e.target)
  })

  const layerOf = new Map<string, number>()
  const entryIds = nodes.filter((n) => !targets.has(n.id)).map((n) => n.id)
  if (entryIds.length === 0 && nodes.length > 0) entryIds.push(nodes[0].id)

  const queue = entryIds.map((id) => ({ id, layer: 0 }))
  for (const { id, layer } of queue) {
    if (layerOf.has(id)) continue
    layerOf.set(id, layer)
    for (const to of outEdges.get(id) ?? []) {
      queue.push({ id: to, layer: layer + 1 })
    }
  }
  nodes.forEach((n) => {
    if (!layerOf.has(n.id)) layerOf.set(n.id, 0)
  })

  const byLayer = new Map<number, string[]>()
  nodes.forEach((n) => {
    const L = layerOf.get(n.id) ?? 0
    if (!byLayer.has(L)) byLayer.set(L, [])
    byLayer.get(L)!.push(n.id)
  })

  const positions: Record<string, THREE.Vector3> = {}
  const layerSpacing = layerSpacingOverride ?? 7
  const nodeSpacing = 8
  const layers = [...byLayer.keys()].sort((a, b) => a - b)
  const maxLayerWidth = Math.max(...layers.map((L) => byLayer.get(L)!.length))

  // Layers flow left → right (X axis); input always at x=0 so all graphs share the same
  // starting position regardless of total layer count.
  // Within-layer nodes spread along Z axis, centered at z=0.
  layers.forEach((layerIndex) => {
    const ids = byLayer.get(layerIndex)!
    const spacing = ids.length > 1 ? (maxLayerWidth * nodeSpacing) / (ids.length + 1) : 0

    ids.forEach((id, i) => {
      const x = layerIndex * layerSpacing          // always starts at 0
      const z = (i - (ids.length - 1) / 2) * spacing
      const y = (i % 2 === 0 ? 0.3 : -0.3) * (layerIndex % 2)
      positions[id] = new THREE.Vector3(x, y, z)
    })
  })
  return positions
}


/** 执行步骤（来自 POST /ai/agent/run 或 /ai/langgraph/run），用于驱动动画节奏与当前节点输出展示 */
export interface ExecutionStepInfo {
  nodeId: string
  duration_ms: number
  output?: Record<string, unknown>
  /** 后端返回的步序号（0-based）；虚拟节点（input/output）无此字段 */
  stepIndex?: number
  /** 前端展示用（如「知识库检索」「生成回答」「第1轮思考」） */
  label?: string
}

/** Loop 等图后端 _enrich_step_for_frontend 补充的展示字段；优先使用 step.label */
function getStepDisplay(step: ExecutionStepInfo | null | undefined): { title: string; body: string | null } {
  if (!step) return { title: '', body: null }
  const out = step.output ?? {}
  const label = typeof step.label === 'string' ? step.label : (typeof out.label === 'string' ? out.label : '')
  if (!step.output && !label) return { title: '', body: null }
  if (step.nodeId === 'think') {
    const thought = typeof out.thought === 'string' ? out.thought : ''
    return { title: label || '思考', body: thought || null }
  }
  if (step.nodeId === 'decide') {
    return { title: label || '判断', body: null }
  }
  if (step.nodeId === 'respond') {
    const response = typeof out.response === 'string' ? out.response : ''
    return { title: label || '最终回答', body: response || null }
  }
  return { title: label, body: null }
}

export interface LangGraph3DVisualizerProps {
  graphData: GraphData
  onNodeClick?: (node: GraphNodeData) => void
  /** 真实执行顺序（来自 run 接口）；不传则用 graphData.executionOrder */
  executionOrder?: string[]
  /** 真实执行步骤（来自 run 接口）；用于每步停留 duration_ms 与侧栏展示 output */
  steps?: ExecutionStepInfo[]
  /** 执行结束后的最终状态（来自 run 接口），执行完成时在侧栏展示 */
  finalState?: Record<string, unknown>
  /** 本次执行总步数（后端返回），循环图会 > 节点数；未传时退化为 executionOrder.length */
  totalSteps?: number
  /** 层间距（X 轴），默认 9；router 等宽图可传更大值 */
  layerSpacing?: number
  /** 每次新执行时递增，用于触发动画重置（代替销毁重建组件） */
  runKey?: number
  /** 流程动画播放完成时回调，参数为当前 runKey（便于父组件区分是哪次执行） */
  onAnimationComplete?: (runKey: number) => void
}

const MIN_STEP_MS = 300

const HDR_URL = 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/4k/ballroom_4k.hdr'

// Preload HDR at module import time so it's ready before the user opens this page
useLoader.preload(RGBELoader, HDR_URL)

// Preload the default troika font + node label characters so Text renders instantly
// Characters cover typical node names across all built-in graphs
preloadFont(
  {
    font: undefined,
    characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789用户输入意图分类天气股票新闻闲聊输出情感分析关键词摘要聚合路由循环并行人工介入条件节点处理',
  },
  () => {}
)

/** 根据节点分布自动调整相机位置和朝向，切换时平滑过渡 */
function CameraRig({ nodePositions }: { nodePositions: Record<string, THREE.Vector3> }) {
  const { camera, controls } = useThree()
  const targetCamPos = useRef(new THREE.Vector3())
  const targetLookAt = useRef(new THREE.Vector3())
  const transitioning = useRef(false)

  useEffect(() => {
    if (Object.keys(nodePositions).length === 0) return

    // 完全固定相机：所有模式用同一个相机位置和朝向，切换时无任何差异
    // layerSpacing=9 → 图宽约36，target 指向图水平中段(面板左补偿)
    targetCamPos.current.set(2, 20, 31)
    targetLookAt.current.set(11, -4, 0)
    transitioning.current = true
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(Object.keys(nodePositions).sort())])

  useFrame(() => {
    if (!transitioning.current) return
    const lerpFactor = 0.08
    camera.position.lerp(targetCamPos.current, lerpFactor)

    if (controls) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const orb = controls as any
      orb.target.lerp(targetLookAt.current, lerpFactor)
      orb.update()
    }

    // 接近目标时停止
    if (camera.position.distanceTo(targetCamPos.current) < 0.05) {
      camera.position.copy(targetCamPos.current)
      if (controls) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const orb = controls as any
        orb.target.copy(targetLookAt.current)
        orb.update()
      }
      transitioning.current = false
    }
  })

  return null
}

/** 环境贴图：使用 4K HDR 减少马赛克感 */
function SceneEnvironment() {
  return (
    <Environment
      files={HDR_URL}
      background
      backgroundBlurriness={0.08}
      environmentIntensity={1.5}
    />
  )
}

export default function LangGraph3DVisualizer({
  graphData,
  onNodeClick,
  executionOrder: executionOrderOverride,
  steps,
  finalState,
  totalSteps: totalStepsProp,
  layerSpacing: layerSpacingProp,
  runKey,
  onAnimationComplete,
}: LangGraph3DVisualizerProps) {
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null)
  const lastCompletedRunKeyRef = useRef<number | undefined>(undefined)
  const [completedNodes, setCompletedNodes] = useState<Set<string>>(new Set())
  const [executionStep, setExecutionStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [finalStateCollapsed, setFinalStateCollapsed] = useState(false)
  const [nodeInfoCollapsed, setNodeInfoCollapsed] = useState(false)
  const [panelExpanded, setPanelExpanded] = useState(false)

  const effectiveOrder =
    executionOrderOverride && executionOrderOverride.length > 0
      ? executionOrderOverride
      : graphData.executionOrder ?? []

  // animationLength：动画实际要走几步（含虚拟 input/output 节点），控制动画循环和完成判断
  const animationLength = effectiveOrder.length
  // displayTotalSteps：展示给用户看的总步数，优先用后端 totalSteps（不含虚拟节点）
  const displayTotalSteps = totalStepsProp ?? animationLength

  const nodePositions = calculateLayeredPositions(graphData.nodes, graphData.edges, layerSpacingProp)

  // 切换图结构时重置所有动画状态，避免上次执行高亮残留
  useEffect(() => {
    setExecutionStep(0)
    setCompletedNodes(new Set())
    setActiveNodeId(null)
    setIsPlaying(false)
  }, [graphData])

  // 新一轮执行（runKey 递增）时重置动画并自动展开执行监控仪表盘
  useEffect(() => {
    if (runKey === undefined) return
    setExecutionStep(0)
    setCompletedNodes(new Set())
    setActiveNodeId(null)
    setIsPlaying(true)
    setPanelExpanded(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runKey])

  useEffect(() => {
    if (animationLength === 0 || !isPlaying) return
    if (executionStep >= animationLength) return

    const currentNodeId = effectiveOrder[executionStep]
    const baseDelay =
      steps?.[executionStep] != null
        ? Math.max(MIN_STEP_MS, steps[executionStep].duration_ms)
        : 1500
    const delay = baseDelay / playbackSpeed

    const timer = setTimeout(() => {
      setActiveNodeId(currentNodeId)
      setCompletedNodes((prev) => new Set(prev).add(currentNodeId))
      setExecutionStep((step) => step + 1)
    }, delay)

    return () => clearTimeout(timer)
  }, [effectiveOrder, animationLength, executionStep, steps, isPlaying, playbackSpeed])

  const handleNodeClick = (node: GraphNodeData) => {
    setActiveNodeId(node.id)
    onNodeClick?.(node)
  }

  const handleTimelineChange = (step: number) => {
    const s = Math.max(0, Math.min(step, animationLength))
    setExecutionStep(s)
    setCompletedNodes(new Set(effectiveOrder.slice(0, s)))
    setActiveNodeId(
      s < animationLength ? effectiveOrder[s] ?? null : effectiveOrder[animationLength - 1] ?? null
    )
    setIsPlaying(false)
  }

  const handlePlayPause = () => {
    if (executionStep >= animationLength) {
      setExecutionStep(0)
      setCompletedNodes(new Set())
      setActiveNodeId(null)
    }
    setIsPlaying((p) => !p)
  }

  const handleReplay = () => {
    setExecutionStep(0)
    setCompletedNodes(new Set())
    setActiveNodeId(null)
    setIsPlaying(true)
  }

  const activeNode = activeNodeId
    ? graphData.nodes.find((n) => n.id === activeNodeId)
    : null
  const currentStepIndex = activeNodeId
    ? effectiveOrder.indexOf(activeNodeId)
    : -1
  const currentStepInfo =
    steps && currentStepIndex >= 0 && currentStepIndex < steps.length
      ? steps[currentStepIndex]
      : null

  // 当前"显示步"：优先用 stepIndex（后端标注），虚拟节点无 stepIndex 时退化为动画索引
  const currentDisplayStep = steps?.[executionStep]?.stepIndex != null
    ? steps[executionStep].stepIndex! + 1
    : Math.min(executionStep, displayTotalSteps)

  const progressPercent =
    displayTotalSteps > 0
      ? Math.min(100, Math.round((currentDisplayStep / displayTotalSteps) * 100))
      : 0
  const isExecutionComplete = animationLength > 0 && executionStep >= animationLength

  // 流程播放完成后：自动展开详情，并通知父组件（用于在此时再展示最终答案）
  useEffect(() => {
    if (!isExecutionComplete || runKey === undefined) return
    if (lastCompletedRunKeyRef.current === runKey) return
    lastCompletedRunKeyRef.current = runKey
    setPanelExpanded(true)
    onAnimationComplete?.(runKey)
  }, [isExecutionComplete, runKey, onAnimationComplete])

  return (
    <div className="visualizer-container">
      <div className="canvas-layer">
      <Canvas
        camera={{ position: [0, 18, 28], fov: 45, up: [0, 1, 0] }}
        gl={{
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
          antialias: true,
        }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <SceneEnvironment />
        </Suspense>

        <ambientLight intensity={0.25} />
        <directionalLight position={[5, 10, 5]} intensity={0.4} />

        <OrbitControls
          makeDefault
          enablePan
          enableZoom
          enableRotate
          autoRotate={false}
          minDistance={10}
          maxDistance={80}
        />

        {/* 每次图切换时自动重算相机视角 */}
        <CameraRig nodePositions={nodePositions} />


        {graphData.nodes.map((node) => (
          <GraphNode
            key={node.id}
            node={node}
            position={nodePositions[node.id]}
            isActive={activeNodeId === node.id}
            isCompleted={completedNodes.has(node.id)}
            onClick={() => handleNodeClick(node)}
          />
        ))}

        {graphData.edges.map((edge, index) => (
          <GraphEdge
            key={`edge-${index}`}
            start={nodePositions[edge.source]}
            end={nodePositions[edge.target]}
            type={edge.type ?? 'normal'}
            isActive={
              activeNodeId === edge.source || activeNodeId === edge.target
            }
            label={edge.label ?? (edge.type !== 'normal' ? edge.target : undefined)}
          />
        ))}

      </Canvas>
      </div>

      <div className={`control-panel${panelExpanded ? ' control-panel--expanded' : ''}`}>
        <h2
          className="panel-header"
          onClick={() => animationLength > 0 && setPanelExpanded((v) => !v)}
          style={{ cursor: animationLength > 0 ? 'pointer' : 'default' }}
        >
          <span>⚡ LangGraph 执行监控</span>
          {animationLength > 0 && (
            <button type="button" className="collapse-btn" aria-expanded={panelExpanded}>
              {panelExpanded ? '收起' : '展开'}
            </button>
          )}
        </h2>
        <div className="stats">
          <div className="stat-item">
            <span className="label">总节点</span>
            <span className="value">{graphData.nodes.length}</span>
          </div>
          <div className="stat-item">
            <span className="label">已完成</span>
            <span className="value">{completedNodes.size}</span>
          </div>
          <div className="stat-item">
            <span className="label">执行进度</span>
            <span className="value">{progressPercent}%</span>
          </div>
        </div>

        {panelExpanded && <>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${progressPercent}%`,
            }}
          />
        </div>

        {animationLength > 0 && (
          <div className="playback-controls">
            <div className="playback-buttons">
              <button
                type="button"
                className="control-btn"
                onClick={handlePlayPause}
                title={isPlaying ? '暂停' : '播放'}
              >
                {isPlaying ? '⏸ 暂停' : '▶ 播放'}
              </button>
              <button
                type="button"
                className="control-btn"
                onClick={handleReplay}
                title="重新播放"
              >
                🔄 重播
              </button>
              <span className="speed-label">速度</span>
              {([0.5, 1, 2] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`control-btn speed-btn ${playbackSpeed === s ? 'active' : ''}`}
                  onClick={() => setPlaybackSpeed(s)}
                >
                  {s}x
                </button>
              ))}
            </div>
            <div className="timeline-wrap">
              <span className="timeline-label">时间轴</span>
              <input
                type="range"
                min={0}
                max={animationLength}
                value={executionStep}
                onChange={(e) => handleTimelineChange(Number(e.target.value))}
                className="timeline-slider"
              />
              <span className="timeline-value">
                {currentDisplayStep} / {displayTotalSteps}
              </span>
            </div>
          </div>
        )}

        {/* 仅流程播放完成（isExecutionComplete）后再展示最终答案，避免「先答案、后流程」 */}
        {isExecutionComplete && finalState != null && Object.keys(finalState).length > 0 && (
          <>
            {/* response 字段：直接展示最终回答 */}
            {typeof finalState.response === 'string' && finalState.response && (
              <div className="node-info final-answer">
                <h3><span>💬 最终回答</span></h3>
                <p className="final-answer-text">{finalState.response}</p>
              </div>
            )}

            {/* 其余字段：折叠的详细状态 */}
            <div className="node-info final-state collapsible">
              <h3 className="collapsible-header" onClick={() => setFinalStateCollapsed((c) => !c)}>
                <span>📋 详细状态</span>
                <button
                  type="button"
                  className="collapse-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    setFinalStateCollapsed((c) => !c)
                  }}
                  aria-expanded={!finalStateCollapsed}
                >
                  {finalStateCollapsed ? '展开' : '收起'}
                </button>
              </h3>
              {!finalStateCollapsed && (
                <pre className="node-output">
                  {JSON.stringify(finalState, null, 2)}
                </pre>
              )}
            </div>
          </>
        )}

        {activeNode && (
          <div className="node-info collapsible">
            <h3
              className="collapsible-header"
              onClick={() => setNodeInfoCollapsed((c) => !c)}
            >
              <span>
                <span className="node-icon">{activeNode.icon ?? '⚡'}</span>
                {(() => {
                  const { title } = getStepDisplay(currentStepInfo)
                  return title || activeNode.name
                })()}
              </span>
              <button
                type="button"
                className="collapse-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  setNodeInfoCollapsed((c) => !c)
                }}
                aria-expanded={!nodeInfoCollapsed}
              >
                {nodeInfoCollapsed ? '展开' : '收起'}
              </button>
            </h3>
            {!nodeInfoCollapsed && (
              <>
            {activeNode.description && <p>{activeNode.description}</p>}
            <div className="node-metrics">
              <div>
                处理时间:{' '}
                {currentStepInfo?.duration_ms != null
                  ? `${currentStepInfo.duration_ms}ms`
                  : '—'}
              </div>
              <div>
                状态:{' '}
                {currentStepIndex >= 0 && currentStepIndex < animationLength
                  ? '已执行'
                  : '执行中'}
              </div>
            </div>
            {(() => {
              const { body } = getStepDisplay(currentStepInfo)
              if (body) {
                return (
                  <div className="node-output node-output--text" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {body}
                  </div>
                )
              }
              if (currentStepInfo?.output != null && Object.keys(currentStepInfo.output).length > 0) {
                return (
                  <pre className="node-output">
                    {JSON.stringify(currentStepInfo.output, null, 2)}
                  </pre>
                )
              }
              return null
            })()}
              </>
            )}
          </div>
        )}

        </>}

      </div>
    </div>
  )
}
