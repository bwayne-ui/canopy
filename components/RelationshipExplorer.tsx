'use client';

import { useState, useMemo } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RelationshipEdge {
  relationshipId: string;
  sourceType: string;
  sourceId?: string;
  sourceName: string;
  targetType: string;
  targetId?: string;
  targetName: string;
  relationshipType: string;
  status: string;
  ownershipPct?: number | null;
}

interface Props {
  relationships: RelationshipEdge[];
}

interface TreeNode {
  name: string;
  type: string;
  entityType: string;
  structureType: string;
  children: TreeNode[];
  edgeLabel: string;
  ownershipPct: number | null;
  depth: number;
  x: number;
  y: number;
  width: number;
  serviceProviders: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const NODE_W = 200;
const NODE_H_RECT = 76;
const NODE_H_TRI = 88;
const NODE_H_OVAL = 60;
const H_GAP = 36;
const V_GAP = 90;
const CELL_W = NODE_W + H_GAP;
const PAD = 50;

// Relationship direction maps
const SOURCE_IS_PARENT = new Set([
  'owns', 'sponsors', 'manages',
  'blocks_for', 'holds_assets_for', 'portfolio_investment',
]);
const TARGET_IS_PARENT = new Set([
  'general_partner_of', 'feeds_into_master',
  'co_invests_with', 'invests_in',
]);
const SERVICE_RELS = new Set([
  'audits', 'legal_counsel_for', 'administers',
  'custodian_for', 'prime_broker_for', 'values',
]);
const IGNORE_RELS = new Set(['successor_to']);

// Entity-type → header color
const TYPE_COLORS: Record<string, string> = {
  client:               '#1B3A4B',
  'management company': '#00835A',
  'gp entity':          '#7c3aed',
  'flagship fund':      '#00C97B',
  'master fund':        '#0d9488',
  'feeder fund':        '#3b82f6',
  'co-invest vehicle':  '#6366f1',
  'blocker corp':       '#d97706',
  'holding company':    '#8b5cf6',
  'portfolio company':  '#6b7280',
  investor:             '#818cf8',
  contact:              '#92400e',
};

function getColor(type: string, entityType: string): string {
  return TYPE_COLORS[entityType.toLowerCase()] ?? TYPE_COLORS[type.toLowerCase()] ?? '#6b7280';
}

function getTypeLabel(type: string, entityType: string): string {
  if (entityType && entityType !== type) return entityType;
  if (type === 'client') return 'GP / Sponsor';
  if (type === 'investor') return 'Investor';
  if (type === 'contact') return 'Service Provider';
  return type;
}

// Shape determination per Andrew Mitchel / Blue J tax convention
type ShapeKind = 'rect' | 'triangle' | 'oval';

function getShape(type: string, structureType: string): ShapeKind {
  const t = type.toLowerCase();
  if (t === 'investor') return 'oval';
  if (t === 'contact') return 'rect';
  if (t === 'client') return 'rect';
  const st = structureType.toLowerCase();
  if (st === 'lp' || st === 'limited partnership' || st === 'scsp') return 'triangle';
  return 'rect';
}

function getNodeH(shape: ShapeKind): number {
  if (shape === 'triangle') return NODE_H_TRI;
  if (shape === 'oval') return NODE_H_OVAL;
  return NODE_H_RECT;
}

function fmtEdge(rel: string): string {
  return rel.replace(/_/g, ' ');
}

// Connector line style
function getLineStyle(relType: string): { dash: string; color: string; width: number } {
  if (['invests_in'].includes(relType)) return { dash: '6 3', color: '#818cf8', width: 1.5 };
  if (['co_invests_with'].includes(relType)) return { dash: '6 3', color: '#0d9488', width: 1.5 };
  if (['owns', 'sponsors', 'manages', 'general_partner_of'].includes(relType)) return { dash: 'none', color: '#475569', width: 2 };
  return { dash: 'none', color: '#94a3b8', width: 1.5 };
}

// ---------------------------------------------------------------------------
// Tree builder (same algorithm, now captures structureType + ownershipPct)
// ---------------------------------------------------------------------------

function buildForest(relationships: RelationshipEdge[]): TreeNode[] {
  const nodeMeta = new Map<string, { type: string; entityType: string; structureType: string }>();
  const parentOf = new Map<string, { parent: string; edgeLabel: string; ownershipPct: number | null }>();
  const serviceProviders = new Map<string, string[]>();
  const childrenOf = new Map<string, string[]>();

  for (const r of relationships) {
    const sKey = r.sourceName;
    const tKey = r.targetName;
    const sType = r.sourceType.toLowerCase();
    const tType = r.targetType.toLowerCase();

    if (!nodeMeta.has(sKey)) nodeMeta.set(sKey, { type: sType, entityType: sType === 'client' ? 'client' : sType, structureType: '' });
    if (!nodeMeta.has(tKey)) nodeMeta.set(tKey, { type: tType, entityType: tType === 'client' ? 'client' : tType, structureType: '' });

    if (IGNORE_RELS.has(r.relationshipType)) continue;

    if (SERVICE_RELS.has(r.relationshipType)) {
      const existing = serviceProviders.get(tKey) ?? [];
      existing.push(sKey.length > 25 ? sKey.slice(0, 23) + '..' : sKey);
      serviceProviders.set(tKey, existing);
      continue;
    }

    let parent: string;
    let child: string;
    const edgeLabel = r.relationshipType;

    if (SOURCE_IS_PARENT.has(r.relationshipType)) {
      parent = sKey;
      child = tKey;
    } else if (TARGET_IS_PARENT.has(r.relationshipType)) {
      parent = tKey;
      child = sKey;
    } else {
      parent = sKey;
      child = tKey;
    }

    if (!parentOf.has(child)) {
      parentOf.set(child, { parent, edgeLabel, ownershipPct: r.ownershipPct ?? null });
      const kids = childrenOf.get(parent) ?? [];
      kids.push(child);
      childrenOf.set(parent, kids);
    }
  }

  // Find roots
  const roots: string[] = [];
  Array.from(nodeMeta.keys()).forEach((name) => {
    if (!parentOf.has(name)) roots.push(name);
  });

  function buildNode(name: string, edgeLabel: string, ownershipPct: number | null, depth: number): TreeNode {
    const meta = nodeMeta.get(name) ?? { type: 'entity', entityType: 'entity', structureType: '' };
    const kids = childrenOf.get(name) ?? [];
    const childNodes = kids.map((c) => {
      const info = parentOf.get(c);
      return buildNode(c, info?.edgeLabel ?? '', info?.ownershipPct ?? null, depth + 1);
    });

    childNodes.sort((a, b) => {
      const aRank = a.type === 'entity' || a.type === 'client' ? 0 : 1;
      const bRank = b.type === 'entity' || b.type === 'client' ? 0 : 1;
      return aRank - bRank;
    });

    const subtreeWidth = childNodes.length === 0 ? 1 : childNodes.reduce((s, c) => s + c.width, 0);

    return {
      name, type: meta.type, entityType: meta.entityType, structureType: meta.structureType,
      children: childNodes, edgeLabel, ownershipPct, depth, x: 0, y: 0, width: subtreeWidth,
      serviceProviders: serviceProviders.get(name) ?? [],
    };
  }

  return roots.map((r) => buildNode(r, '', null, 0));
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

function layoutTree(roots: TreeNode[]): { nodes: TreeNode[]; totalW: number; totalH: number } {
  const allNodes: TreeNode[] = [];
  let maxDepth = 0;

  function positionSubtree(node: TreeNode, leftX: number, depth: number) {
    node.depth = depth;
    node.y = PAD + depth * (NODE_H_RECT + V_GAP);
    if (depth > maxDepth) maxDepth = depth;

    if (node.children.length === 0) {
      node.x = leftX + (node.width * CELL_W) / 2 - NODE_W / 2;
      allNodes.push(node);
      return;
    }

    let childLeft = leftX;
    node.children.forEach((child) => {
      positionSubtree(child, childLeft, depth + 1);
      childLeft += child.width * CELL_W;
    });

    const first = node.children[0];
    const last = node.children[node.children.length - 1];
    node.x = (first.x + last.x + NODE_W) / 2 - NODE_W / 2;
    allNodes.push(node);
  }

  let offsetX = 0;
  roots.forEach((root) => {
    positionSubtree(root, offsetX, 0);
    offsetX += root.width * CELL_W + H_GAP * 3;
  });

  const totalW = Math.max(offsetX + PAD * 2, 800);
  const totalH = Math.max(PAD * 2 + (maxDepth + 1) * (NODE_H_RECT + V_GAP) + 40, 500);

  return { nodes: allNodes, totalW, totalH };
}

function getSubtreeNames(node: TreeNode): Set<string> {
  const names = new Set<string>();
  names.add(node.name);
  node.children.forEach((c) => {
    Array.from(getSubtreeNames(c)).forEach((n) => names.add(n));
  });
  return names;
}

// ---------------------------------------------------------------------------
// SVG shape renderers
// ---------------------------------------------------------------------------

function RectShape({ w, h, color, selected }: { w: number; h: number; color: string; selected: boolean }) {
  return (
    <>
      {/* Shadow */}
      <rect x={2} y={2} width={w} height={h} rx={6} fill="#d1d5db" opacity={0.4} />
      {/* Body */}
      <rect width={w} height={h} rx={6} fill="#ffffff" stroke={selected ? '#00C97B' : '#e5e7eb'} strokeWidth={selected ? 2.5 : 1} />
      {/* Header bar */}
      <rect width={w} height={20} rx={6} fill={color} />
      <rect y={6} width={w} height={14} fill={color} />
    </>
  );
}

function TriangleShape({ w, h, color, selected }: { w: number; h: number; color: string; selected: boolean }) {
  // Inverted trapezoid / chevron — wider at top, narrower at bottom
  const inset = 28;
  const topL = 0;
  const topR = w;
  const botL = inset;
  const botR = w - inset;
  const pts = `${topL},0 ${topR},0 ${botR},${h} ${botL},${h}`;
  return (
    <>
      {/* Shadow */}
      <polygon points={`${topL + 2},2 ${topR + 2},2 ${botR + 2},${h + 2} ${botL + 2},${h + 2}`} fill="#d1d5db" opacity={0.4} />
      {/* Body */}
      <polygon points={pts} fill="#ffffff" stroke={selected ? '#00C97B' : '#e5e7eb'} strokeWidth={selected ? 2.5 : 1} />
      {/* Header band */}
      <polygon points={`${topL},0 ${topR},0 ${topR - 3},20 ${topL + 3},20`} fill={color} />
    </>
  );
}

function OvalShape({ w, h, color, selected }: { w: number; h: number; color: string; selected: boolean }) {
  const cx = w / 2;
  const cy = h / 2;
  return (
    <>
      {/* Shadow */}
      <ellipse cx={cx + 2} cy={cy + 2} rx={cx} ry={cy} fill="#d1d5db" opacity={0.4} />
      {/* Body */}
      <ellipse cx={cx} cy={cy} rx={cx} ry={cy} fill="#ffffff" stroke={selected ? '#00C97B' : '#e5e7eb'} strokeWidth={selected ? 2.5 : 1} />
      {/* Top color band */}
      <ellipse cx={cx} cy={14} rx={cx - 4} ry={12} fill={color} opacity={0.85} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RelationshipExplorer({ relationships }: Props) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const { forest, allNodes, totalW, totalH, nodeByName } = useMemo(() => {
    const forest = buildForest(relationships);
    const { nodes: allNodes, totalW, totalH } = layoutTree(forest);
    const nodeByName = new Map<string, TreeNode>();
    allNodes.forEach((n) => nodeByName.set(n.name, n));
    return { forest, allNodes, totalW, totalH, nodeByName };
  }, [relationships]);

  const highlighted = useMemo(() => {
    if (!selectedNode) return null;
    const node = nodeByName.get(selectedNode);
    if (!node) return null;
    return getSubtreeNames(node);
  }, [selectedNode, nodeByName]);

  const edges = useMemo(() => {
    const result: Array<{ parent: TreeNode; child: TreeNode; label: string; ownershipPct: number | null; relType: string }> = [];
    function collect(node: TreeNode) {
      node.children.forEach((child) => {
        result.push({ parent: node, child, label: child.edgeLabel, ownershipPct: child.ownershipPct, relType: child.edgeLabel });
        collect(child);
      });
    }
    forest.forEach((r) => collect(r));
    return result;
  }, [forest]);

  const handleClick = (name: string) => {
    setSelectedNode(selectedNode === name ? null : name);
  };

  const legendEntries = useMemo(() => {
    const seen = new Map<string, { color: string; shape: ShapeKind }>();
    allNodes.forEach((n) => {
      const label = getTypeLabel(n.type, n.entityType);
      if (!seen.has(label)) {
        seen.set(label, { color: getColor(n.type, n.entityType), shape: getShape(n.type, n.structureType) });
      }
    });
    return Array.from(seen.entries());
  }, [allNodes]);

  return (
    <div className="space-y-3">
      <div className="w-full overflow-auto bg-gray-50 rounded-lg border border-gray-200 p-2">
        <svg
          width={totalW}
          height={totalH}
          viewBox={`0 0 ${totalW} ${totalH}`}
          className="block"
          style={{ minWidth: totalW, minHeight: totalH }}
        >
          {/* Elbow connectors */}
          {edges.map(({ parent: p, child: c, label, ownershipPct, relType }, i) => {
            const pShape = getShape(p.type, p.structureType);
            const cShape = getShape(c.type, c.structureType);
            const px = p.x + NODE_W / 2;
            const py = p.y + getNodeH(pShape);
            const cx = c.x + NODE_W / 2;
            const cy = c.y;
            const midY = py + (cy - py) / 2;

            const isHi = highlighted && highlighted.has(p.name) && highlighted.has(c.name);
            const isDim = highlighted && !isHi;
            const ls = getLineStyle(relType);

            return (
              <g key={`edge-${i}`} opacity={isDim ? 0.15 : 1}>
                <path
                  d={`M ${px} ${py} L ${px} ${midY} L ${cx} ${midY} L ${cx} ${cy}`}
                  fill="none"
                  stroke={isHi ? '#00C97B' : ls.color}
                  strokeWidth={isHi ? 2.5 : ls.width}
                  strokeDasharray={isHi ? 'none' : ls.dash}
                />
                {/* Edge label */}
                <text
                  x={(px + cx) / 2}
                  y={midY - 5}
                  textAnchor="middle"
                  fontSize={8}
                  fill={isHi ? '#059669' : '#94a3b8'}
                  fontFamily="system-ui, sans-serif"
                >
                  {fmtEdge(label)}
                </text>
                {/* Ownership % */}
                {ownershipPct != null && ownershipPct > 0 && (
                  <g>
                    <rect
                      x={(px + cx) / 2 - 16}
                      y={midY + 2}
                      width={32}
                      height={14}
                      rx={7}
                      fill={isHi ? '#d1fae5' : '#f1f5f9'}
                    />
                    <text
                      x={(px + cx) / 2}
                      y={midY + 12}
                      textAnchor="middle"
                      fontSize={9}
                      fontWeight="600"
                      fill={isHi ? '#059669' : '#475569'}
                      fontFamily="system-ui, sans-serif"
                    >
                      {ownershipPct}%
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {allNodes.map((node) => {
            const isSelected = selectedNode === node.name;
            const isDim = highlighted && !highlighted.has(node.name);
            const color = getColor(node.type, node.entityType);
            const typeLabel = getTypeLabel(node.type, node.entityType);
            const shape = getShape(node.type, node.structureType);
            const h = getNodeH(shape);

            return (
              <g
                key={node.name}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => handleClick(node.name)}
                style={{ cursor: 'pointer' }}
                opacity={isDim ? 0.15 : 1}
              >
                {/* Shape */}
                {shape === 'rect' && <RectShape w={NODE_W} h={h} color={color} selected={isSelected} />}
                {shape === 'triangle' && <TriangleShape w={NODE_W} h={h} color={color} selected={isSelected} />}
                {shape === 'oval' && <OvalShape w={NODE_W} h={h} color={color} selected={isSelected} />}

                {/* Header text */}
                <text
                  x={shape === 'oval' ? NODE_W / 2 : 10}
                  y={shape === 'oval' ? 17 : 14}
                  textAnchor={shape === 'oval' ? 'middle' : 'start'}
                  fontSize={8}
                  fill="#ffffff"
                  fontWeight="600"
                  fontFamily="system-ui, sans-serif"
                  letterSpacing="0.03em"
                >
                  {typeLabel.length > 28 ? typeLabel.slice(0, 26) + '…' : typeLabel.toUpperCase()}
                </text>

                {/* Entity name */}
                <text
                  x={NODE_W / 2}
                  y={shape === 'oval' ? h / 2 + 4 : 38}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#111827"
                  fontWeight="600"
                  fontFamily="system-ui, sans-serif"
                >
                  {node.name.length > 28 ? node.name.slice(0, 26) + '…' : node.name}
                </text>

                {/* Structure type badge */}
                {node.structureType && shape !== 'oval' && (
                  <g>
                    <rect
                      x={NODE_W - 32}
                      y={shape === 'triangle' ? 2 : 2}
                      width={28}
                      height={14}
                      rx={3}
                      fill="rgba(255,255,255,0.25)"
                    />
                    <text
                      x={NODE_W - 18}
                      y={shape === 'triangle' ? 12 : 12}
                      textAnchor="middle"
                      fontSize={8}
                      fill="#ffffff"
                      fontWeight="600"
                      fontFamily="system-ui, sans-serif"
                    >
                      {node.structureType}
                    </text>
                  </g>
                )}

                {/* Service providers */}
                {node.serviceProviders.length > 0 && shape === 'rect' && (
                  <text
                    x={10}
                    y={54}
                    fontSize={7}
                    fill="#9ca3af"
                    fontFamily="system-ui, sans-serif"
                  >
                    {node.serviceProviders.length} advisor{node.serviceProviders.length !== 1 ? 's' : ''}
                  </text>
                )}

                {/* Bottom annotation: edge label */}
                {node.edgeLabel && shape === 'rect' && (
                  <text
                    x={10}
                    y={h - 6}
                    fontSize={7}
                    fill="#6b7280"
                    fontStyle="italic"
                    fontFamily="system-ui, sans-serif"
                  >
                    {fmtEdge(node.edgeLabel)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 px-1">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Legend</span>
        {legendEntries.map(([label, { color, shape }]) => (
          <div key={label} className="flex items-center gap-1.5">
            {shape === 'rect' && <div className="w-3.5 h-3 rounded-sm" style={{ backgroundColor: color }} />}
            {shape === 'triangle' && (
              <svg width="14" height="12" viewBox="0 0 14 12">
                <polygon points="0,0 14,0 11,12 3,12" fill={color} />
              </svg>
            )}
            {shape === 'oval' && <div className="w-3.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />}
            <span className="text-[10px] text-gray-500 font-medium">{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-4">
          <div className="w-5 h-0 border-t-2 border-gray-500" />
          <span className="text-[10px] text-gray-400">Ownership</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-0 border-t-2 border-dashed border-indigo-400" />
          <span className="text-[10px] text-gray-400">Investment</span>
        </div>
      </div>
    </div>
  );
}
