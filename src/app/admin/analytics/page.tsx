'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  ResponsiveContainer
} from 'recharts';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import dynamicPlot from 'next/dynamic';

// Dynamically import Plot to avoid SSR issues
const Plot = dynamicPlot(() => import('react-plotly.js'), { ssr: false });

interface MeditationStats {
  _id: {
    date: string;
    programName: string;
    userId: string;
    userEmail: string;
  };
  totalDuration: number;
  count: number;
}

const AnalyticsDashboard = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  });
  const [stats, setStats] = useState<MeditationStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [users, setUsers] = useState<Array<{ id: string, email: string }>>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Function to fill missing dates with zero values
  const fillMissingDates = (data: MeditationStats[], currentUsers: Array<{ id: string, email: string }>) => {
    if (currentUsers.length === 0) return data;
    
    const filledData: MeditationStats[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Create a map that accounts for both date and userId
    const dataMap = new Map(
      data.map(item => [`${item._id.date}-${item._id.userId}`, item])
    );

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      
      currentUsers.forEach(user => {
        const key = `${dateStr}-${user.id}`;
        const existingData = dataMap.get(key);
        
        if (existingData) {
          filledData.push(existingData);
        } else {
          filledData.push({
            _id: {
              date: dateStr,
              programName: 'No Program',
              userId: user.id,
              userEmail: user.email
            },
            totalDuration: 0,
            count: 0
          });
        }
      });
    }
    
    return filledData;
  };

  // Fetch users first
  useEffect(() => {
    const fetchUsers = async () => {
      if (!session?.user?.isAdmin) return;
      
      try {
        const response = await axios.get('/api/users');
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, [session]);

  // Then fetch stats when users, dates or selected user changes
  useEffect(() => {
    const fetchStats = async () => {
      if (!session?.user?.isAdmin || !isClient) return;
      
      try {
        setLoading(true);
        const response = await axios.get('/api/meditation/analytics', {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            userId: selectedUser || undefined
          }
        });
        
        const filledStats = fillMissingDates(response.data, users);
        setStats(filledStats);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [startDate, endDate, selectedUser, users, session, isClient]);

  const prepareSessionCountData = (filledStats: MeditationStats[]) => {
    const data: any[] = [];
    const userIds = new Set(filledStats.map(stat => stat._id.userId));
    const allDates = Array.from({ length: (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24) + 1 }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      return date.toISOString().split('T')[0];
    });

    userIds.forEach(userId => {
      const userStats = filledStats.filter(stat => stat._id.userId === userId);
      const userDataMap = new Map(userStats.map(stat => [stat._id.date, stat.count]));

      const yValues = allDates.map(date => userDataMap.get(date) || 0);

      const userEmail = userStats.length > 0 ? userStats[0]._id.userEmail : 'Unknown User';

      data.push({
        x: allDates,
        y: yValues,
        type: 'scatter',
        mode: 'lines+markers',
        name: `User: ${userEmail}`,
        line: { shape: 'linear' },
      });
    });

    return data;
  };

  const preparePlotlyData = (filledStats: MeditationStats[]) => {
    const data: any[] = [];
    const userIds = new Set(filledStats.map(stat => stat._id.userId));
    const allDates = Array.from({ length: (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24) + 1 }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      return date.toISOString().split('T')[0];
    });

    userIds.forEach(userId => {
      const userStats = filledStats.filter(stat => stat._id.userId === userId);
      const userDataMap = new Map(userStats.map(stat => [stat._id.date, Math.round(stat.totalDuration / 60)]));

      const yValues = allDates.map(date => userDataMap.get(date) || 0);

      const userEmail = userStats.length > 0 ? userStats[0]._id.userEmail : 'Unknown User';

      data.push({
        x: allDates,
        y: yValues,
        type: 'scatter',
        mode: 'lines+markers',
        name: `User: ${userEmail}`,
        line: { shape: 'linear' },
      });
    });

    return data;
  };

  if (!session?.user?.isAdmin) {
    return <div>Access Denied</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F7FF] via-[#E6F0FF] to-[#F0F7FF] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-[#0A2342] mb-8">Meditation Analytics Dashboard</h1>
        
        {/* Date Range and User Selector */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-[#2C4A7F]/10 p-6 mb-6 flex gap-4 border border-[#84B9EF]/20 z-10 relative">
          <div>
            <label className="block text-sm font-medium text-[#0A2342]">Start Date</label>
            <DatePicker
              selected={startDate}
              onChange={(date: Date | null) => setStartDate(date || new Date())}
              className="mt-1 block w-full rounded-xl border-[#84B9EF]/20 shadow-sm bg-[#F0F7FF] p-2 z-20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0A2342]">End Date</label>
            <DatePicker
              selected={endDate}
              onChange={(date: Date | null) => setEndDate(date || new Date())}
              className="mt-1 block w-full rounded-xl border-[#84B9EF]/20 shadow-sm bg-[#F0F7FF] p-2 z-20"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-[#0A2342]">User</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="mt-1 block w-full rounded-xl border-[#84B9EF]/20 shadow-sm bg-[#F0F7FF] p-2"
            >
              <option value="">All Users</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.email}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-[#0A2342]">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 mt-6">
            {/* Daily Meditation Minutes */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-[#2C4A7F]/10 p-6 border border-[#84B9EF]/20 flex flex-col">
              <h2 className="text-xl font-semibold mb-4 text-[#0A2342]">Daily Meditation Minutes</h2>
              <div className="flex-1 w-full">
                {isClient && (
                  <Plot
                    data={preparePlotlyData(stats)}
                    layout={{
                      title: 'Daily Meditation Minutes',
                      xaxis: { title: 'Date' },
                      yaxis: { title: 'Minutes' },
                      showlegend: true,
                      autosize: true,
                    }}
                    style={{ width: '100%', height: '400px' }}
                  />
                )}
              </div>
            </div>

            {/* Sessions Per Program */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-[#2C4A7F]/10 p-6 border border-[#84B9EF]/20 flex flex-col">
              <h2 className="text-xl font-semibold mb-4 text-[#0A2342]">Daily Sessions</h2>
              <div className="flex-1 w-full">
                {isClient && (
                  <Plot
                    data={prepareSessionCountData(stats)}
                    layout={{
                      title: 'Daily Sessions',
                      xaxis: { title: 'Date' },
                      yaxis: { title: 'Sessions' },
                      showlegend: true,
                      autosize: true,
                    }}
                    style={{ width: '100%', height: '400px' }}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard; 