import { useEffect, useRef } from 'react'
import { init, use } from 'echarts/core'
import { GraphChart } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { GraphData } from '../../service/knowledge-graph'

use([GraphChart, TooltipComponent, CanvasRenderer])

export default function KnowledgeGraphCanvas({ graph, selectedId, onSelect }: {
  graph: GraphData; selectedId: string | null; onSelect: (id: string) => void
}) {
  const container = useRef<HTMLDivElement>(null)
  const instance = useRef<ReturnType<typeof init>>()
  useEffect(() => {
    if (!container.current) return
    const chart = init(container.current)
    instance.current = chart
    const css = getComputedStyle(container.current)
    const color = (name: string) => css.getPropertyValue(name).trim()
    const palette = ['--ai-primary', '--ai-warning', '--ai-success', '--ai-text-secondary', '--ai-error'].map(color)
    const types = [...new Set(graph.nodes.map(node => node.type))]
    chart.setOption({
      animation: false,
      tooltip: { trigger: 'item', renderMode: 'richText', formatter: '{b}' },
      series: [{
        type: 'graph', layout: 'force', roam: true, draggable: true,
        force: { repulsion: 150, edgeLength: [50, 110], gravity: 0.12 },
        emphasis: {
          focus: 'adjacency', label: { show: true },
          itemStyle: { borderWidth: 3, borderColor: color('--ai-text') },
        },
        label: { show: graph.nodes.length < 35, color: color('--ai-text-secondary'), position: 'right', fontSize: 11 },
        lineStyle: { color: color('--ai-border-strong'), opacity: 0.65, curveness: 0.08 },
        data: graph.nodes.map(node => ({
          id: node.id, name: node.name,
          symbolSize: node.type === 'Movie' ? 23 : 15,
          itemStyle: { color: palette[types.indexOf(node.type) % palette.length] },
          label: { show: node.type === 'Movie' || graph.nodes.length < 35 },
        })),
        links: graph.edges.map(edge => ({ source: edge.source, target: edge.target, name: edge.type })),
      }],
    })
    chart.on('click', params => {
      const clicked = params as { dataType?: string; data?: { id?: string } }
      if (clicked.dataType === 'node' && clicked.data?.id) onSelect(clicked.data.id)
    })
    const observer = new ResizeObserver(() => chart.resize())
    observer.observe(container.current)
    return () => { observer.disconnect(); chart.dispose(); instance.current = undefined }
  }, [graph, onSelect])

  useEffect(() => {
    const chart = instance.current
    if (!chart) return
    chart.dispatchAction({ type: 'downplay', seriesIndex: 0 })
    const index = graph.nodes.findIndex(node => node.id === selectedId)
    if (index >= 0) chart.dispatchAction({ type: 'highlight', seriesIndex: 0, dataIndex: index })
  }, [graph, selectedId])

  return <div ref={container} className="kg-canvas" role="img" aria-label="实体关系图，可拖拽缩放；也可通过实体列表选择节点" />
}
