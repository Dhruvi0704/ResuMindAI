import { useEffect, useState } from "react";

interface ATSScoreCircleProps {
  score: number;
  size?: number;
}

export default function ATSScoreCircle({ score, size = 200 }: ATSScoreCircleProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setAnimatedScore(score);
    }, 100);
    return () => clearTimeout(timeout);
  }, [score]);

  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  const getColor = () => {
    if (score >= 80) return "hsl(var(--chart-5))";
    if (score >= 60) return "hsl(var(--chart-4))";
    return "hsl(var(--destructive))";
  };

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }} data-testid="circle-ats-score">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--muted))"
          strokeWidth="10"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor()}
          strokeWidth="10"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold" data-testid="text-ats-score">{animatedScore}</span>
        <span className="text-sm text-muted-foreground">ATS Score</span>
      </div>
    </div>
  );
}
