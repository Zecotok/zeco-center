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

interface MeditationStats {
  _id: {
    date: string;
    programName: string;
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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('/api/users');
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    if (session?.user?.isAdmin) {
      fetchUsers();
    }
  }, [session]);

  const fillMissingDates = (data: MeditationStats[]) => {
    const filledData: MeditationStats[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dataMap = new Map(
      data.map(item => [item._id.date, item])
    );

    for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      const existingData = dataMap.get(dateStr);

      if (existingData) {
        filledData.push(existingData);
      } else {
        filledData.push({
          _id: {
            date: dateStr,
            programName: 'No Program'
          },
          totalDuration: 0,
          count: 0
        });
      }
    }

    return filledData;
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/meditation/analytics', {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            userId: selectedUser || undefined
          }
        });
        const filledStats = fillMissingDates(response.data);
        setStats(filledStats);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.isAdmin) {
      fetchStats();
    }
  }, [startDate, endDate, session, selectedUser]);

  if (!session?.user?.isAdmin) {
    return <div>Access Denied</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F7FF] via-[#E6F0FF] to-[#F0F7FF] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-[#0A2342] mb-8">Meditation Analytics Dashboard</h1>
        
        {/* Date Range and User Selector */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-[#2C4A7F]/10 p-6 mb-6 flex gap-4 border border-[#84B9EF]/20">
          <div>
            <label className="block text-sm font-medium text-[#0A2342]">Start Date</label>
            <DatePicker
              selected={startDate}
              onChange={(date: Date | null) => setStartDate(date || new Date())}
              className="mt-1 block w-full rounded-xl border-[#84B9EF]/20 shadow-sm bg-[#F0F7FF] p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0A2342]">End Date</label>
            <DatePicker
              selected={endDate}
              onChange={(date: Date | null) => setEndDate(date || new Date())}
              className="mt-1 block w-full rounded-xl border-[#84B9EF]/20 shadow-sm bg-[#F0F7FF] p-2"
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Meditation Minutes */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-[#2C4A7F]/10 p-6 border border-[#84B9EF]/20">
              <h2 className="text-xl font-semibold mb-4 text-[#0A2342]">Daily Meditation Minutes</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#84B9EF" />
                  <XAxis 
                    dataKey="_id.date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                    stroke="#0A2342"
                  />
                  <YAxis domain={[0, 'auto']} stroke="#0A2342" />
                  <Tooltip 
                    labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    stroke="#2C4A7F" 
                    name="Minutes"
                    dataKey={(dataPoint) => Math.round(dataPoint.totalDuration / 60)}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Sessions Per Program */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-[#2C4A7F]/10 p-6 border border-[#84B9EF]/20">
              <h2 className="text-xl font-semibold mb-4 text-[#0A2342]">Daily Sessions</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#84B9EF" />
                  <XAxis 
                    dataKey="_id.date"
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                    stroke="#0A2342"
                  />
                  <YAxis domain={[0, 'auto']} stroke="#0A2342" />
                  <Tooltip 
                    labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#64B6AC" 
                    name="Sessions"
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard; 