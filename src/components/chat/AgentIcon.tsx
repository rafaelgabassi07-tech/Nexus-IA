import React from 'react';
import { 
  Hexagon, Brain, Sparkles, Shield, Terminal, Activity, Users 
} from 'lucide-react';

interface AgentIconProps {
  iconName?: string;
  size?: number;
  className?: string;
}

export const AgentIcon = ({ iconName, size = 18, className }: AgentIconProps) => {
  const props = { size, strokeWidth: 2.5, className };
  const icons: Record<string, React.ReactNode> = {
    Hexagon: <Hexagon {...props} />,
    Brain: <Brain {...props} />,
    Sparkles: <Sparkles {...props} />,
    Shield: <Shield {...props} />,
    Terminal: <Terminal {...props} />,
    Activity: <Activity {...props} />,
    Users: <Users {...props} />,
  };
  return <>{icons[iconName || ''] || <Hexagon {...props} />}</>;
};
