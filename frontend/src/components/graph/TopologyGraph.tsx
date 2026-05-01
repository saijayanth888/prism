import * as d3 from "d3";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import apiClient from "../../api/client";
import { useGraphStore } from "../../stores/graph";
import type { GraphNode, GraphEdge, EntityType } from "../../types";
import { ENTITY_TYPE_COLORS } from "../../types";

const NODE_RADIUS = 10;
const SELECTED_RADIUS = 18;
const ACCENT = "#22D3EE";

interface TooltipState {
  x: number;
  y: number;
  node: GraphNode;
}

export default function TopologyGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<any, any> | undefined>(undefined);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const { selectedNodeId, selectNode, setGraphData, graphData } = useGraphStore();

  const { data, isLoading } = useQuery({
    queryKey: ["topology"],
    queryFn: () => apiClient.get("/api/v1/topology").then((r) => r.data),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (data) {
      setGraphData({ nodes: data.nodes || [], edges: data.edges || [] });
    }
  }, [data, setGraphData]);

  const renderGraph = useCallback(() => {
    if (!svgRef.current || !containerRef.current) return;
    const nodes: GraphNode[] = graphData.nodes;
    const edges: GraphEdge[] = graphData.edges;
    if (!nodes.length) return;

    const { width, height } = containerRef.current.getBoundingClientRect();
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", width).attr("height", height);

    const g = svg.append("g");

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform.toString());
        setTooltip(null);
      });
    svg.call(zoom);
    svg.on("click", (event) => {
      if (event.target === svgRef.current) selectNode(null);
    });

    // Build adjacency for degree calculation
    const degreeMap = new Map<string, number>();
    edges.forEach((e) => {
      degreeMap.set(e.source, (degreeMap.get(e.source) || 0) + 1);
      degreeMap.set(e.target, (degreeMap.get(e.target) || 0) + 1);
    });

    const nodeRadius = (n: GraphNode) => {
      const deg = degreeMap.get(n.id) || 0;
      return Math.max(NODE_RADIUS, Math.min(22, NODE_RADIUS + deg * 1.2));
    };

    // Links
    const link = g.append("g")
      .selectAll("line")
      .data(edges)
      .join("line")
      .attr("stroke", "#334155")
      .attr("stroke-width", 0.8)
      .attr("opacity", 0.4);

    // Nodes
    const node = g.append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", nodeRadius)
      .attr("fill", (n) => ENTITY_TYPE_COLORS[n.entityType as EntityType] || "#64748B")
      .attr("stroke", "transparent")
      .attr("stroke-width", 2)
      .attr("cursor", "pointer")
      .on("click", (event, n) => {
        event.stopPropagation();
        selectNode(n.id);
      })
      .on("mouseover", (event, n) => {
        const rect = svgRef.current!.getBoundingClientRect();
        setTooltip({ x: event.clientX - rect.left, y: event.clientY - rect.top, node: n });
      })
      .on("mouseout", () => setTooltip(null));

    // Labels (only for selected / high-degree nodes)
    const label = g.append("g")
      .selectAll("text")
      .data(nodes.filter((n) => (degreeMap.get(n.id) || 0) > 3))
      .join("text")
      .attr("font-size", 9)
      .attr("font-family", "JetBrains Mono, monospace")
      .attr("fill", "#94A3B8")
      .attr("text-anchor", "middle")
      .attr("dy", 4)
      .text((n) => n.label?.split("-")[0] || "");

    const tick = () => {
      link
        .attr("x1", (e: any) => e.source.x)
        .attr("y1", (e: any) => e.source.y)
        .attr("x2", (e: any) => e.target.x)
        .attr("y2", (e: any) => e.target.y);
      node.attr("cx", (n: any) => n.x).attr("cy", (n: any) => n.y);
      label.attr("x", (n: any) => n.x).attr("y", (n: any) => n.y + nodeRadius(n as any) + 12);
    };

    // Simulation — tighter forces so graph fits in viewport
    const sim = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(edges as any).id((d: any) => d.id).distance(40).strength(0.3))
      .force("charge", d3.forceManyBody().strength(-25))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide(14))
      .stop();

    // Pre-settle synchronously
    for (let i = 0; i < 300; i++) sim.tick();
    tick();

    // Fit-to-viewport: calculate actual node bounding box and zoom to fit
    const ns = nodes as any[];
    const xs = ns.map((n) => n.x);
    const ys = ns.map((n) => n.y);
    const [x0, x1] = [Math.min(...xs), Math.max(...xs)];
    const [y0, y1] = [Math.min(...ys), Math.max(...ys)];
    const gw = x1 - x0 || 1;
    const gh = y1 - y0 || 1;
    const pad = 40;
    const scale = Math.max(0.35, Math.min(0.95, (width - pad * 2) / gw, (height - pad * 2) / gh));
    const tx = width / 2 - scale * (x0 + x1) / 2;
    const ty = height / 2 - scale * (y0 + y1) / 2;
    svg.call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));

    sim.on("tick", tick).restart();

    simulationRef.current = sim;

    // Drag
    node.call(
      d3.drag<SVGCircleElement, GraphNode>()
        .on("start", (event, n: any) => {
          if (!event.active) sim.alphaTarget(0.3).restart();
          n.fx = n.x; n.fy = n.y;
        })
        .on("drag", (event, n: any) => { n.fx = event.x; n.fy = event.y; })
        .on("end", (event, n: any) => {
          if (!event.active) sim.alphaTarget(0);
          n.fx = null; n.fy = null;
        }) as any
    );
  }, [graphData, selectNode]);

  // Apply selection highlighting
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    if (!selectedNodeId) {
      svg.selectAll("circle")
        .attr("opacity", 1)
        .attr("stroke", "transparent")
        .attr("r", (n: any) => Math.max(NODE_RADIUS, Math.min(22, NODE_RADIUS + ((n._degree || 0) * 1.2))));
      svg.selectAll("line").attr("opacity", 0.4);
      return;
    }

    const connectedIds = new Set<string>();
    graphData.edges.forEach((e) => {
      if (e.source === selectedNodeId || e.target === selectedNodeId) {
        connectedIds.add(e.source as string);
        connectedIds.add(e.target as string);
      }
    });

    svg.selectAll<SVGCircleElement, GraphNode>("circle")
      .attr("opacity", (n) => connectedIds.has(n.id) || n.id === selectedNodeId ? 1 : 0.1)
      .attr("stroke", (n) => n.id === selectedNodeId ? ACCENT : "transparent")
      .attr("r", (n: any) => n.id === selectedNodeId ? SELECTED_RADIUS : Math.max(NODE_RADIUS, Math.min(22, NODE_RADIUS + ((n._degree || 0) * 1.2))));

    svg.selectAll<SVGLineElement, GraphEdge>("line")
      .attr("opacity", (e) =>
        (e.source as any)?.id === selectedNodeId || (e.target as any)?.id === selectedNodeId ? 1 : 0.05
      );
  }, [selectedNodeId, graphData.edges]);

  useEffect(() => { renderGraph(); }, [renderGraph]);

  // Re-render on container resize
  useEffect(() => {
    const obs = new ResizeObserver(() => renderGraph());
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [renderGraph]);

  return (
    <div ref={containerRef} className="relative w-full h-full" style={{ background: "var(--p-bg-main)" }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-slate-400 text-sm">Loading topology…</div>
        </div>
      )}
      {!isLoading && !graphData.nodes.length && (
        <div className="absolute inset-0 flex items-center justify-center flex-col gap-3">
          <div className="text-slate-400 text-sm">No data yet</div>
          <div className="text-slate-500 text-xs font-mono">Run: make seed</div>
        </div>
      )}
      <svg ref={svgRef} className="w-full h-full" />

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none z-10 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs shadow-lg"
          style={{ left: tooltip.x + 12, top: tooltip.y - 8 }}
        >
          <div className="font-mono text-white">{tooltip.node.label}</div>
          <div className="text-slate-400">{tooltip.node.entityType} · {tooltip.node.platform}</div>
          {tooltip.node.healthScore && (
            <div className="text-emerald-400">health: {tooltip.node.healthScore}</div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 max-w-xs">
        {Object.entries(ENTITY_TYPE_COLORS).slice(0, 9).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="text-slate-500 text-[10px]">{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
