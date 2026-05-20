import React from "react";
import { Card } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from "recharts";
import { CheckCircle2, XCircle } from "lucide-react";

const OverallScoreCard = ({ analysis }: { analysis: any }) => {
  const score = analysis?.overallScore ?? analysis?.atsScore ?? 0;
  const atsScore = analysis?.atsScore ?? 0;
  const interviewChance = analysis?.interviewChance ?? 0;
  
  const getScoreLabel = (s: number) => {
    if (s >= 85) return { label: 'Excellent', color: '#06D6A0' }
    if (s >= 70) return { label: 'Good', color: '#3B82F6' }
    if (s >= 55) return { label: 'Needs improvement', color: '#F59E0B' }
    if (s >= 40) return { label: 'Needs significant improvement', color: '#EF4444' }
    return { label: 'Poor - Major revamp needed', color: '#DC2626' }
  }

  const scoreInfo = getScoreLabel(score);
  const color = scoreInfo.color;
  const label = scoreInfo.label;

  return (
    <Card className="p-8 flex flex-col items-center justify-center bg-gradient-to-br from-card to-primary/5 border-primary/20 shadow-lg">
      <div className="score-card flex flex-col items-center text-center w-full">
        <svg viewBox="0 0 100 100" width="160" height="160" className="mb-4">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#1a1a2e" strokeWidth="8"/>
          <circle cx="50" cy="50" r="45"
            fill="none" 
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${score * 2.827} 282.7`}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
          <text x="50" y="45" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold">
            {score}
          </text>
          <text x="50" y="62" textAnchor="middle" fill="#9CA3AF" fontSize="10">
            Overall
          </text>
        </svg>
        <p className="font-semibold text-lg" style={{ color }}>{label}</p>
        <div className="flex gap-4 mt-4 w-full justify-center">
          <div className="flex flex-col items-center bg-[#1a1a2e] px-4 py-2 rounded-lg border border-white/5">
            <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">ATS Match</span>
            <span className="font-bold text-white">{atsScore}%</span>
          </div>
          <div className="flex flex-col items-center bg-[#1a1a2e] px-4 py-2 rounded-lg border border-white/5">
            <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Interview</span>
            <span className="font-bold text-white">{interviewChance}%</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

const SkillDistributionChart = ({ skillDistribution }: { skillDistribution: any }) => {
  
  const data = [
    { 
      name: 'Content Quality', 
      score: skillDistribution?.content || 0,
      color: '#6C63FF'
    },
    { 
      name: 'Experience', 
      score: skillDistribution?.experience || 0,
      color: '#06D6A0'
    },
    { 
      name: 'Education', 
      score: skillDistribution?.education || 0,
      color: '#4CC9F0'
    },
    { 
      name: 'Skills Match', 
      score: skillDistribution?.technical || 0,
      color: '#F72585'
    },
    { 
      name: 'Impact/Metrics', 
      score: skillDistribution?.impact || 0,
      color: '#FFB703'
    },
    { 
      name: 'Keywords', 
      score: skillDistribution?.keywords || 0,
      color: '#FB8500'
    },
  ]

  // Color based on score value
  const getBarColor = (score: number) => {
    if (score >= 70) return '#06D6A0'  // green - strong
    if (score >= 40) return '#FFB703'  // amber - medium
    return '#EF4444'                    // red - weak
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const score = payload[0].value
      const status = score >= 70 ? 'Strong' 
                   : score >= 40 ? 'Needs Work' 
                   : 'Weak'
      return (
        <div style={{
          background: '#1a1a2e',
          border: '1px solid rgba(108,99,255,0.3)',
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '12px'
        }}>
          <p style={{ 
            color: '#fff', 
            fontWeight: 600,
            marginBottom: '4px'
          }}>
            {label}
          </p>
          <p style={{ color: getBarColor(score) }}>
            Score: {score}%
          </p>
          <p style={{ 
            color: getBarColor(score),
            fontSize: '11px'
          }}>
            {status}
          </p>
        </div>
      )
    }
    return null
  }

  const CustomBar = (props: any) => {
    const { x, y, width, height, value } = props
    const color = getBarColor(value)
    return (
      <g>
        {/* Background bar */}
        <rect
          x={x}
          y={y}
          width="100%"
          height={height}
          fill="rgba(255,255,255,0.05)"
          rx={4}
        />
        {/* Score bar */}
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={color}
          rx={4}
          opacity={0.85}
        />
        {/* Score label at end of bar */}
        <text
          x={x + width + 6}
          y={y + height / 2 + 4}
          fill={color}
          fontSize={11}
          fontWeight={600}
        >
          {value}%
        </text>
      </g>
    )
  }

  return (
    <div style={{
      background: 'var(--color-background-secondary)',
      borderRadius: 'var(--border-radius-lg)',
      border: '0.5px solid var(--color-border-tertiary)',
      padding: '20px',
      height: '100%'
    }}>
      <h3 style={{ 
        fontSize: '14px', 
        fontWeight: 600,
        color: 'var(--color-text-primary)',
        marginBottom: '16px'
      }}>
        Skill Distribution
      </h3>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 45, left: 0, bottom: 0 }}
          barSize={14}
        >
          <CartesianGrid 
            horizontal={false}
            stroke="rgba(255,255,255,0.05)" 
          />
          <XAxis 
            type="number" 
            domain={[0, 100]}
            tick={{ 
              fill: '#64748b', 
              fontSize: 10 
            }}
            tickFormatter={(v) => `${v}%`}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            type="category" 
            dataKey="name"
            width={95}
            tick={{ 
              fill: '#94a3b8', 
              fontSize: 11,
              fontWeight: 500
            }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="score" 
            shape={<CustomBar />}
            radius={[0, 4, 4, 0]}
          >
            {data.map((entry, index) => (
              <Cell 
                key={index} 
                fill={getBarColor(entry.score)} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div style={{ 
        display: 'flex', 
        gap: '16px',
        marginTop: '12px',
        justifyContent: 'center'
      }}>
        {[
          { color: '#06D6A0', label: 'Strong (70+)' },
          { color: '#FFB703', label: 'Medium (40-70)' },
          { color: '#EF4444', label: 'Weak (<40)' }
        ].map(item => (
          <div key={item.label} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '5px',
            fontSize: '10px',
            color: '#64748b'
          }}>
            <div style={{ 
              width: '10px', 
              height: '10px', 
              borderRadius: '2px',
              background: item.color 
            }} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  )
}

const ActionableSuggestions = ({ analysis, targetRole }: { analysis: any, targetRole: string }) => {
  return (
    <Card className="p-6 bg-background/50 shadow-sm border-t-4 border-t-primary">
      <h3 className="text-lg font-semibold mb-4">Actionable Improvement Suggestions</h3>
      <div className="flex flex-col gap-4">
        {Object.entries(analysis?.sections || {}).map(
          ([key, section]: [string, any]) => (
            section.status !== 'strong' && (
              <div key={key} style={{
                background: 'rgba(234, 179, 8, 0.1)',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '8px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  marginBottom: '6px'
                }}>
                  <span>⚠️</span>
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: 600,
                    background: 'rgba(234,179,8,0.2)',
                    color: '#d97706',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    textTransform: 'uppercase'
                  }}>
                    {section.status === 'missing' 
                      ? 'HIGH PRIORITY' 
                      : 'MEDIUM PRIORITY'}
                  </span>
                </div>
                <p style={{ 
                  fontSize: '13px', 
                  fontWeight: 600,
                  marginBottom: '4px',
                  textTransform: 'capitalize'
                }}>
                  {key} section
                </p>
                <p style={{ 
                  fontSize: '12px', 
                  color: 'var(--color-text-secondary)',
                  lineHeight: '1.5',
                  margin: 0
                }}>
                  {section.feedback}
                </p>
                <div style={{ 
                  marginTop: '6px',
                  fontSize: '11px',
                  color: 'var(--color-text-secondary)'
                }}>
                  Score: {section.score}/100 • Status: {section.status}
                </div>
              </div>
            )
          )
        )}
      </div>

      {analysis?.missingKeywords?.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <p style={{ 
            fontSize: '13px', 
            fontWeight: 600,
            marginBottom: '8px' 
          }}>
            Missing Keywords for {targetRole}:
          </p>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '6px' 
          }}>
            {analysis.missingKeywords.map((kw: string, i: number) => (
              <span key={i} style={{
                background: 'rgba(239,68,68,0.1)',
                color: '#ef4444',
                border: '1px solid rgba(239,68,68,0.3)',
                padding: '3px 10px',
                borderRadius: '20px',
                fontSize: '11px'
              }}>
                + {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {analysis?.matchedKeywords?.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          <p style={{ 
            fontSize: '13px', 
            fontWeight: 600,
            marginBottom: '8px'
          }}>
            Matched Keywords:
          </p>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '6px' 
          }}>
            {analysis.matchedKeywords.map((kw: string, i: number) => (
              <span key={i} style={{
                background: 'rgba(16,185,129,0.1)',
                color: '#10b981',
                border: '1px solid rgba(16,185,129,0.3)',
                padding: '3px 10px',
                borderRadius: '20px',
                fontSize: '11px'
              }}>
                ✓ {kw}
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

interface CVDashboardProps {
  analysisData: any;
  targetRole?: string;
}

export default function CVDashboard({ analysisData, targetRole = "Professional" }: CVDashboardProps) {
  if (!analysisData) return null;
  const strengths = analysisData.strengths || analysisData.keyStrengths || [];
  const weaknesses = analysisData.weaknesses || analysisData.areasForImprovement || analysisData.improvements || [];

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-500">
      <div className="grid md:grid-cols-2 gap-6">
         <OverallScoreCard analysis={analysisData} />
         <SkillDistributionChart skillDistribution={analysisData?.skillDistribution} />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 shadow-sm border-green-500/20">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold">Key Strengths</h3>
          </div>
          <ul className="space-y-3">
            {strengths && strengths.length > 0 ? (
              strengths.map((strength: string, i: number) => (
                <li key={i} style={{ 
                  display: 'flex', alignItems: 'flex-start',
                  gap: '8px', marginBottom: '8px',
                  fontSize: '13px', lineHeight: '1.5'
                }}>
                  <span style={{ color: '#10b981', marginTop: '2px' }}>✓</span>
                  {strength}
                </li>
              ))
            ) : (
              <p>Analyzing strengths...</p>
            )}
          </ul>
        </Card>
        <Card className="p-6 shadow-sm border-red-500/20">
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-semibold">Areas for Improvement</h3>
          </div>
          <ul className="space-y-3">
            {weaknesses && weaknesses.length > 0 ? (
              weaknesses.map((weakness: string, i: number) => (
                <li key={i} style={{
                  display: 'flex', alignItems: 'flex-start',
                  gap: '8px', marginBottom: '8px',
                  fontSize: '13px', lineHeight: '1.5'
                }}>
                  <span style={{ color: '#ef4444', marginTop: '2px' }}>✗</span>
                  {weakness}
                </li>
              ))
            ) : (
              <p>No major weaknesses detected.</p>
            )}
          </ul>
        </Card>
      </div>
      <ActionableSuggestions analysis={analysisData} targetRole={targetRole} />
    </div>
  );
}
