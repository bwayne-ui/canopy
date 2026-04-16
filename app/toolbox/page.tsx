'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import { PERSONAS, DEFAULT_PERSONA_ID, getPersona, canAccessTool } from '@/lib/personas';
import {
  GitMerge, Layers, ArrowLeftRight, Bot, Lock, ChevronRight,
  FileSpreadsheet, Calculator, Shuffle, CheckSquare
} from 'lucide-react';

interface ToolDef {
  id: string;
  name: string;
  description: string;
  source: string;
  href: string;
  icon: React.ElementType;
  iconColor: string;
  capabilities: string[];
}

const TOOLS: ToolDef[] = [
  {
    id: 'cap-call-recon',
    name: 'Capital Call Recon',
    description: 'Reconcile capital call obligations against incoming bank wire transfers using a three-pass AI matching pipeline.',
    source: 'cap-call-recon',
    href: '/toolbox/cap-call-recon',
    icon: GitMerge,
    iconColor: 'text-emerald-600 bg-emerald-50',
    capabilities: ['CSV Upload', 'AI Matching', 'Excel Export'],
  },
  {
    id: 'waterfall',
    name: 'Waterfall Engine',
    description: 'Fund portfolio management and waterfall distribution engine. Track exceptions, generate DIU batches, and maintain an audit trail.',
    source: 'canopy-waterfall',
    href: '/toolbox/waterfall',
    icon: Layers,
    iconColor: 'text-blue-600 bg-blue-50',
    capabilities: ['Fund Portfolio', 'DIU Generation', 'Audit Log'],
  },
  {
    id: 'diu-mapper',
    name: 'DIU Mapper',
    description: 'Multi-step data onboarding wizard for normalizing, mapping, and validating investor data for Investran import.',
    source: 'investran-diu-mapper',
    href: '/toolbox/diu-mapper',
    icon: Shuffle,
    iconColor: 'text-purple-600 bg-purple-50',
    capabilities: ['File Normalise', 'COA Mapping', 'Validation'],
  },
  {
    id: 'positionbot',
    name: 'PositionBot',
    description: 'Automated investor position creation agent. Parse JSQ exports, validate entities, and generate DIU Excel files for Investran.',
    source: 'PositionBot',
    href: '/toolbox/positionbot',
    icon: Bot,
    iconColor: 'text-amber-600 bg-amber-50',
    capabilities: ['JSQ Parsing', '6-Stage Wizard', 'DIU Excel'],
  },
];

export default function ToolboxPage() {
  const [personaId, setPersonaId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('canopy.controlTower.personaId') ?? DEFAULT_PERSONA_ID;
    }
    return DEFAULT_PERSONA_ID;
  });

  const persona = useMemo(() => getPersona(personaId), [personaId]);

  const accessible = TOOLS.filter((t) => canAccessTool(persona, t.id)).length;

  return (
    <div>
      <PageHeader
        title="Toolbox"
        subtitle="Agentic utilities ported from standalone projects"
        breadcrumbs={[{ label: 'Agentic Center' }, { label: 'Toolbox' }]}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-md border border-gray-200">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#00C97B] to-[#1B3A4B] text-white flex items-center justify-center text-[10px] font-bold">
                {persona.avatarInitials}
              </div>
              <span className="font-semibold text-gray-700">{persona.name}</span>
              <span className="text-[10px] text-gray-400">{accessible}/{TOOLS.length} tools</span>
            </div>
            <select
              value={personaId}
              onChange={(e) => {
                setPersonaId(e.target.value);
                if (typeof window !== 'undefined') localStorage.setItem('canopy.controlTower.personaId', e.target.value);
              }}
              title="Switch persona"
              className="text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-[#00C97B]"
            >
              {PERSONAS.map((p) => (
                <option key={p.id} value={p.id}>{p.name} — {p.title}</option>
              ))}
            </select>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
        {TOOLS.map((tool) => {
          const allowed = canAccessTool(persona, tool.id);
          const Icon = tool.icon;
          return (
            <div
              key={tool.id}
              className={`relative bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${
                allowed ? 'border-gray-200 hover:border-[#00C97B]/40 hover:shadow-md' : 'border-gray-100 opacity-60'
              }`}
            >
              {/* Lock overlay */}
              {!allowed && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-[1px]">
                  <Lock className="w-5 h-5 text-gray-400 mb-1" />
                  <span className="text-xs text-gray-400 font-medium">Access restricted for {persona.name}</span>
                </div>
              )}

              <div className="p-5">
                {/* Header row */}
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${tool.iconColor}`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">{tool.name}</span>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono">
                        {tool.source}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{tool.description}</p>
                  </div>
                </div>

                {/* Capability tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {tool.capabilities.map((cap) => (
                    <span key={cap} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F0FBF6] text-[#00835A]">
                      {cap}
                    </span>
                  ))}
                </div>

                {/* Open button */}
                {allowed ? (
                  <Link
                    href={tool.href}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#00C97B] hover:bg-[#00A866] px-3 py-1.5 rounded-md transition-colors"
                  >
                    Open Tool <ChevronRight className="w-3 h-3" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-md cursor-not-allowed"
                  >
                    <Lock className="w-3 h-3" /> Restricted
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
