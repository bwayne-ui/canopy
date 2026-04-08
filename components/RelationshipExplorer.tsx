'use client';

import { useState, useMemo } from 'react';

interface RelationshipEdge {
  relationshipId: string;
  sourceType: string;
  sourceName: string;
  targetType: string;
  targetName: string;
  relationshipType: string;
  status: string;
}

interface Props {
  relationships: RelationshipEdge[];
}

const typeColors: Record<string, string> = {
  client: '#1B3A4B',
  entity: '#00C97B',
  investor: '#6366f1',
  contact: '#f59e0b',
};

const defaultNodeColor = '#6b7280';

const SVG_W = 800;
const SVG_H = 600;
const CENTER_X = SVG_W / 2;
const CENTER_Y = SVG_H / 2;

export default function RelationshipExplorer({ relationships }: Props) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const { nodes, nodePositions, nodeTypes, connectionCounts } = useMemo(() => {
    // Collect unique nodes and their types
    const typeMap = new Map<string, string>();
    const connCount = new Map<string, number>();

    relationships.forEach((r) => {
      typeMap.set(r.sourceName, r.sourceType.toLowerCase());
      typeMap.set(r.targetName, r.targetType.toLowerCase());
      connCount.set(r.sourceName, (connCount.get(r.sourceName) ?? 0) + 1);
      connCount.set(r.targetName, (connCount.get(r.targetName) ?? 0) + 1);
    });

    const allNodes = Array.from(typeMap.keys());

    // Find most connected node for center
    let centerNode = allNodes[0] ?? '';
    let maxConn = 0;
    allNodes.forEach((n) => {
      const c = connCount.get(n) ?? 0;
      if (c > maxConn) {
        maxConn = c;
        centerNode = n;
      }
    });

    // BFS to compute ring distances from center node
    const adj = new Map<string, Set<string>>();
    allNodes.forEach((n) => adj.set(n, new Set()));
    relationships.forEach((r) => {
      adj.get(r.sourceName)?.add(r.targetName);
      adj.get(r.targetName)?.add(r.sourceName);
    });

    const dist = new Map<string, number>();
    dist.set(centerNode, 0);
    const queue = [centerNode];
    let qi = 0;
    while (qi < queue.length) {
      const curr = queue[qi++];
      const d = dist.get(curr)!;
      adj.get(curr)?.forEach((nb) => {
        if (!dist.has(nb)) {
          dist.set(nb, d + 1);
          queue.push(nb);
        }
      });
    }
    // For disconnected nodes
    allNodes.forEach((n) => {
      if (!dist.has(n)) dist.set(n, 3);
    });

    // Group by ring
    const rings = new Map<number, string[]>();
    allNodes.forEach((n) => {
      const d = dist.get(n) ?? 3;
      if (d === 0) return;
      if (!rings.has(d)) rings.set(d, []);
      rings.get(d)!.push(n);
    });

    const maxRing = Math.max(...Array.from(rings.keys()), 1);

    // Position nodes
    const positions = new Map<string, { x: number; y: number }>();
    positions.set(centerNode, { x: CENTER_X, y: CENTER_Y });

    const ringRadii = [0, 140, 230, 300, 360];
    rings.forEach((nodesInRing, ring) => {
      const radius = ringRadii[Math.min(ring, ringRadii.length - 1)] ?? 200 + ring * 60;
      nodesInRing.forEach((node, idx) => {
        const angle = (2 * Math.PI * idx) / nodesInRing.length - Math.PI / 2;
        positions.set(node, {
          x: CENTER_X + radius * Math.cos(angle),
          y: CENTER_Y + radius * Math.sin(angle),
        });
      });
    });

    return {
      nodes: allNodes,
      nodePositions: positions,
      nodeTypes: typeMap,
      connectionCounts: connCount,
    };
  }, [relationships]);

  // Determine connected relationships for highlighting
  const connectedEdges = useMemo(() => {
    if (!selectedNode) return new Set<string>();
    const keys = new Set<string>();
    relationships.forEach((r) => {
      if (r.sourceName === selectedNode || r.targetName === selectedNode) {
        keys.add(r.relationshipId);
      }
    });
    return keys;
  }, [selectedNode, relationships]);

  const connectedNodes = useMemo(() => {
    if (!selectedNode) return new Set<string>();
    const s = new Set<string>();
    s.add(selectedNode);
    relationships.forEach((r) => {
      if (r.sourceName === selectedNode) s.add(r.targetName);
      if (r.targetName === selectedNode) s.add(r.sourceName);
    });
    return s;
  }, [selectedNode, relationships]);

  const handleNodeClick = (name: string) => {
    setSelectedNode(selectedNode === name ? null : name);
  };

  return (
    <div className="w-full overflow-auto bg-white rounded-lg shadow-sm border border-gray-100">
      <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="block mx-auto max-w-full h-auto">
        {/* Edges */}
        {relationships.map((r) => {
          const from = nodePositions.get(r.sourceName);
          const to = nodePositions.get(r.targetName);
          if (!from || !to) return null;

          const isHighlighted = connectedEdges.has(r.relationshipId);
          const isDimmed = selectedNode && !isHighlighted;
          const isActive = r.status.toLowerCase() === 'active';

          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2;

          return (
            <g key={r.relationshipId} opacity={isDimmed ? 0.15 : 1}>
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={isHighlighted ? '#00C97B' : isActive ? '#94a3b8' : '#d1d5db'}
                strokeWidth={isHighlighted ? 2.5 : 1.5}
                strokeDasharray={isActive ? 'none' : '6 3'}
              />
              <text
                x={midX}
                y={midY - 6}
                textAnchor="middle"
                fontSize={8}
                fill={isHighlighted ? '#059669' : '#9ca3af'}
              >
                {r.relationshipType}
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((name) => {
          const pos = nodePositions.get(name);
          if (!pos) return null;

          const type = nodeTypes.get(name) ?? '';
          const color = typeColors[type] ?? defaultNodeColor;
          const count = connectionCounts.get(name) ?? 1;
          const radius = Math.min(45, Math.max(25, 20 + count * 5));
          const isSelected = selectedNode === name;
          const isDimmed = selectedNode && !connectedNodes.has(name);

          return (
            <g
              key={name}
              transform={`translate(${pos.x}, ${pos.y})`}
              onClick={() => handleNodeClick(name)}
              style={{ cursor: 'pointer' }}
              opacity={isDimmed ? 0.2 : 1}
            >
              {isSelected && (
                <circle r={radius + 5} fill="none" stroke="#00C97B" strokeWidth={3} opacity={0.5} />
              )}
              <circle r={radius} fill={color} opacity={0.9} />
              <text
                y={radius + 14}
                textAnchor="middle"
                fontSize={10}
                fill="#374151"
                fontWeight={isSelected ? 'bold' : 'normal'}
              >
                {name.length > 18 ? name.slice(0, 16) + '...' : name}
              </text>
              <text
                y={4}
                textAnchor="middle"
                fontSize={9}
                fill="#ffffff"
                fontWeight="bold"
              >
                {name.length > 10 ? name.slice(0, 8) + '..' : name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
