"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// {  }: { stats: Statistics }
export function Stats() {
  // Generate sample data - in a real app, this would come from your actual data source
  const generateSampleData = () => {
    return Array.from({ length: 31 }, (_, i) => ({
      queries: i,
      score: 1 - Math.exp(-i / 10) * (Math.cos(i / 2) * 0.25 + 0.75)
    }));
  };

  const data = generateSampleData();

  return (
    <div className="pt-4 w-full max-w-3xl">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={data}
          margin={{ top: 5, left: 5, right: 5, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="queries" 
            type="number" 
            domain={[0, 30]}
            ticks={[0, 5, 10, 15, 20, 25, 30]}
            label={{ value: 'Query', position: 'insideBottom', offset: -10 }}
          />
          <YAxis 
            domain={[0, 1]} 
            ticks={[0, 0.2, 0.4, 0.6, 0.8, 1]}
            label={{ value: 'Performance', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip formatter={(value: any) => value.toFixed(3)} />
          <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}