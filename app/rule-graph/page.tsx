'use client';

import { useEffect, useState } from 'react';
import { GitBranch, Layers, Activity, Hash } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import RuleGraphVisualization from '@/components/RuleGraphVisualization';

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

export default function RuleGraphPage() {
  const [rules, setRules] = useState<RuleNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/rules')
      .then((r) => r.json())
      .then((res) => setRules(res.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  const selectedRule = rules.find((r) => r.ruleId === selectedRuleId) ?? null;

  const totalRules = rules.length;
  const categories = new Set(rules.map((r) => r.category)).size;
  const activeRules = rules.filter((r) => r.status?.toLowerCase() === 'active').length;
  const maxDepth = rules.reduce((max, r) => Math.max(max, r.dependsOn.length), 0);

  if (loading) {
    return (
      <div>
        <PageHeader title="Rule Graph Manager" subtitle="Deterministic Calculation Dependency Chains" />
        <div className="text-center py-12 text-gray-400">Loading rules...</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Rule Graph Manager" subtitle="Deterministic Calculation Dependency Chains" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MetricCard title="Total Rules" value={totalRules.toLocaleString()} icon={<Hash className="w-4 h-4" />} color="teal" />
        <MetricCard title="Categories" value={categories.toLocaleString()} icon={<Layers className="w-4 h-4" />} color="green" />
        <MetricCard title="Active Rules" value={activeRules.toLocaleString()} icon={<Activity className="w-4 h-4" />} color="signal" />
        <MetricCard title="Max Dependencies" value={maxDepth.toLocaleString()} icon={<GitBranch className="w-4 h-4" />} color="amber" />
      </div>

      <div className="flex gap-4 mb-6">
        {/* Left panel: Rule list */}
        <div className="w-1/3 bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">Rules</h2>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 600 }}>
            {rules.map((rule) => {
              const isSelected = selectedRuleId === rule.ruleId;
              return (
                <div
                  key={rule.ruleId}
                  className={`px-4 py-3 border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50/80 ${
                    isSelected ? 'bg-[#E6F9F0] border-l-4 border-l-[#00C97B]' : 'border-l-4 border-l-transparent'
                  }`}
                  onClick={() => setSelectedRuleId(isSelected ? null : rule.ruleId)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-gray-400">{rule.ruleId}</span>
                    <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium rounded bg-gray-100 text-gray-600">
                      {rule.category}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800 truncate">{rule.name}</p>
                  {rule.formula && (
                    <p className="text-xs font-mono text-gray-400 mt-1 truncate">{rule.formula}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right panel: Graph */}
        <div className="w-2/3">
          <RuleGraphVisualization
            rules={rules}
            selectedRuleId={selectedRuleId}
            onSelectRule={setSelectedRuleId}
          />
        </div>
      </div>

      {/* Detail panel */}
      {selectedRule && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{selectedRule.name}</h3>
              <p className="text-sm text-gray-500 mt-0.5">{selectedRule.ruleId} &middot; {selectedRule.ruleType}</p>
            </div>
            <span
              className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${
                selectedRule.status?.toLowerCase() === 'active'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {selectedRule.status}
            </span>
          </div>

          {selectedRule.description && (
            <p className="text-sm text-gray-600 mb-4">{selectedRule.description}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Formula */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Formula</h4>
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <code className="text-sm font-mono text-gray-700 break-all">{selectedRule.formula || 'N/A'}</code>
              </div>
            </div>

            {/* Output field */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Output Field</h4>
              <span className="inline-block px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
                {selectedRule.outputField}
              </span>
            </div>

            {/* Input Fields */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Input Fields</h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedRule.inputFields.map((field) => (
                  <span key={field} className="inline-block px-2 py-0.5 text-[11px] font-medium rounded-full bg-blue-100 text-blue-700">
                    {field}
                  </span>
                ))}
                {selectedRule.inputFields.length === 0 && (
                  <span className="text-xs text-gray-400">None</span>
                )}
              </div>
            </div>

            {/* Dependencies */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Dependencies</h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedRule.dependsOn.map((dep) => {
                  const depRule = rules.find((r) => r.ruleId === dep);
                  return (
                    <span
                      key={dep}
                      className="inline-block px-2 py-0.5 text-[11px] font-medium rounded-full bg-purple-100 text-purple-700 cursor-pointer hover:bg-purple-200 transition-colors"
                      onClick={() => setSelectedRuleId(dep)}
                    >
                      {depRule ? depRule.name : dep}
                    </span>
                  );
                })}
                {selectedRule.dependsOn.length === 0 && (
                  <span className="text-xs text-gray-400">No dependencies (root rule)</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
