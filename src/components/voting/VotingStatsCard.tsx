import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface VotingStatsCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function VotingStatsCard({ title, value, subtitle, icon, trend }: VotingStatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              {trend && (
                <span className={`text-sm font-medium ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-blue-600">
              {icon}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}