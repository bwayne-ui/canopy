'use client';

import { useState, useMemo } from 'react';

interface RuleNode {
  ruleId: string;
  name: string;
  description: string;
  ruleType: string;
  formula: string;
  inputFields: string[];
  outputField: string;
  dependsOn: string[];
  priority: number;
  status: string;
  category: string;
}

interface Props {
  rules: RuleNode[];
  selectedRuleId?: string | null;
  onSelectRule?: (ruleId: string | null) => void;
}

const categoryColors: Record<string, { bg: string; border: string }> = {
  Valuation: { bg: '#E6F9F0', border: '#34d399' },
  Expenses: { bg: '#fef3c7', border: '#f59e0b' },
  NAV: { bg: '#dbeafe', border: '#60a5fa' },
  Fees: { bg: '#fce7f3', border: '#f472b6' },
  Waterfall: { bg: '#e0e7ff', border: '#818cf8' },
  Performance: { bg: '#f0fdf4', border: '#4ade80' },
  Allocation: { bg: '#ede9fe', border: '#a78bfa' },
  Tax: { bg: '#fef9c3', border: '#facc15' },
  Distribution: { bg: '#fce4ec', border: '#f06292' },
};

const defaultColor = { bg: '#f3f4f6', border: '#9ca3af' };

const NODE_W = 200;
const NODE_H = 70;
const LAYER_GAP_X = 250;
const NODE_GAP_Y = 95;

export default function RuleGraphVisualization({ rules, selectedRuleId: externalSelected, onSelectRule }: Props) {
  const [internalSelected, setInternalSelected] = useState<string | null>(null);

  const selectedRuleId = externalSelected !== undefined ? externalSelected : internalSelected;
  const setSelectedRuleId = onSelectRule ?? setInternalSelected;

  const { layers, nodePositions, svgWidth, svgHeight } = useMemo(() => {
    // Build dependency map and compute layers via topological sort
    const ruleMap = new Map<string, RuleNode>();
    rules.forEach((r) => ruleMap.set(r.ruleId, r));

    const layerOf = new Map<string, number>();
    const computeLayer = (ruleId: string, visited: Set<string>): number => {
      if (layerOf.has(ruleId)) return layerOf.get(ruleId)!;
      if (visited.has(ruleId)) return 0; // cycle guard
      visited.add(ruleId);
      const rule = ruleMap.get(ruleId);
      if (!rule || rule.dependsOn.length === 0) {
        layerOf.set(ruleId, 0);
        return 0;
      }
      const maxDep = Math.max(...rule.dependsOn.map((d) => computeLayer(d, visited)));
      const layer = maxDep + 1;
      layerOf.set(ruleId, layer);
      return layer;
    };

    rules.forEach((r) => computeLayer(r.ruleId, new Set()));

    // Group by layer
    const layerGroups = new Map<number, RuleNode[]>();
    rules.forEach((r) => {
      const l = layerOf.get(r.ruleId) ?? 0;
      if (!layerGroups.has(l)) layerGroups.set(l, []);
      layerGroups.get(l)!.push(r);
    });

    const maxLayer = Math.max(...Array.from(layerGroups.keys()), 0);
    const maxNodesInLayer = Math.max(...Array.from(layerGroups.values()).map((g) => g.length), 1);

    const positions = new Map<string, { x: number; y: number }>();
    const layerArr: RuleNode[][] = [];

    for (let l = 0; l <= maxLayer; l++) {
      const nodesInLayer = layerGroups.get(l) ?? [];
      layerArr.push(nodesInLayer);
      const totalHeight = nodesInLayer.length * NODE_GAP_Y;
      const maxTotalHeight = maxNodesInLayer * NODE_GAP_Y;
      const offsetY = (maxTotalHeight - totalHeight) / 2;

      nodesInLayer.forEach((node, idx) => {
        positions.set(node.ruleId, {
          x: l * LAYER_GAP_X + 50,
          y: offsetY + idx * NODE_GAP_Y + 40,
        });
      });
    }

    const w = (maxLayer + 1) * LAYER_GAP_X + 100;
    const h = maxNodesInLayer * NODE_GAP_Y + 80;

    return { layers: layerArr, nodePositions: positions, svgWidth: Math.max(w, 600), svgHeight: Math.max(h, 400) };
  }, [rules]);

  // Determine connected edges for highlighting
  const connectedEdges = useMemo(() => {
    if (!selectedRuleId) return new Set<string>();
    const edgeKeys = new Set<string>();
    rules.forEach((r) => {
      r.dependsOn.forEach((dep) => {
        if (r.ruleId === selectedRuleId || dep === selectedRuleId) {
          edgeKeys.add(`${dep}->${r.ruleId}`);
        }
      });
    });
    return edgeKeys;
  }, [selectedRuleId, rules]);

  const handleNodeClick = (ruleId: string) => {
    setSelectedRuleId(selectedRuleId === ruleId ? null : ruleId);
  };

  return (
    <div className="w-full overflow-auto bg-white rounded-lg shadow-sm border border-gray-100" style={{ minHeight: 600 }}>
      <svg width={svgWidth} height={svgHeight} className="block">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
          </marker>
          <marker id="arrowhead-active" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#00C97B" />
          </marker>
        </defs>

        {/* Edges */}
        {rules.flatMap((r) =>
          r.dependsOn.map((dep) => {
            const from = nodePositions.get(dep);
            const to = nodePositions.get(r.ruleId);
            if (!from || !to) return null;

            const x1 = from.x + NODE_W;
            const y1 = from.y + NODE_H / 2;
            const x2 = to.x;
            const y2 = to.y + NODE_H / 2;

            const midX = (x1 + x2) / 2;
            const edgeKey = `${dep}->${r.ruleId}`;
            const isHighlighted = connectedEdges.has(edgeKey);

            return (
              <path
                key={edgeKey}
                d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                fill="none"
                stroke={isHighlighted ? '#00C97B' : '#94a3b8'}
                strokeWidth={isHighlighted ? 2.5 : 1.5}
                markerEnd={isHighlighted ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
                opacity={selectedRuleId && !isHighlighted ? 0.2 : 1}
              />
            );
          })
        )}

        {/* Nodes */}
        {rules.map((rule) => {
          const pos = nodePositions.get(rule.ruleId);
          if (!pos) return null;
          const colors = categoryColors[rule.category] ?? defaultColor;
          const isSelected = selectedRuleId === rule.ruleId;
          const isDimmed = selectedRuleId && !isSelected && !connectedEdges.has(`${rule.ruleId}->${selectedRuleId}`) && !connectedEdges.has(`${selectedRuleId}->${rule.ruleId}`);

          return (
            <g
              key={rule.ruleId}
              transform={`translate(${pos.x}, ${pos.y})`}
              onClick={() => handleNodeClick(rule.ruleId)}
              style={{ cursor: 'pointer' }}
              opacity={isDimmed ? 0.35 : 1}
            >
              {isSelected && (
                <rect
                  x={-4}
                  y={-4}
                  width={NODE_W + 8}
                  height={NODE_H + 8}
                  rx={12}
                  fill="none"
                  stroke="#00C97B"
                  strokeWidth={3}
                  filter="url(#glow)"
                  opacity={0.6}
                />
              )}
              <rect
                width={NODE_W}
                height={NODE_H}
                rx={8}
                fill={colors.bg}
                stroke={isSelected ? '#00C97B' : colors.border}
                strokeWidth={isSelected ? 2.5 : 2}
              />
              <text x={NODE_W / 2} y={28} textAnchor="middle" fontSize={12} fontWeight="bold" fill="#1f2937">
                {rule.name.length > 24 ? rule.name.slice(0, 22) + '...' : rule.name}
              </text>
              <text x={NODE_W / 2} y={46} textAnchor="middle" fontSize={10} fill="#6b7280">
                {rule.category || rule.ruleType}
              </text>
              <text x={NODE_W / 2} y={60} textAnchor="middle" fontSize={9} fill="#9ca3af">
                {rule.ruleId}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
