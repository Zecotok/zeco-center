"use client";

import { useState, useEffect } from "react";
import { useAuth } from '@/context/AuthContext';
import { PERMISSIONS } from '@/libs/rolesConfig';
import { PermissionGuard } from '@/components/PermissionGuard';

interface User {
    id: string;
    email: string;
    fullname: string;
    role: string;
}

export default function UsersManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        async function fetchUsers() {
            try {
                const response = await fetch('/api/users');
                if (response.ok) {
                    const data = await response.json();
                    setUsers(data);
                } else {
                    console.error('Failed to fetch users:', await response.text());
                }
            } catch (error) {
                console.error('Failed to fetch users:', error);
            } finally {
                setIsLoading(false);
            }
        }
        
        fetchUsers();
    }, []);
    
    async function updateUserRole(userId: string, role: string) {
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ role }),
            });
            
            if (response.ok) {
                // Update local user list
                setUsers(users.map(user => 
                    user.id === userId ? { ...user, role } : user
                ));
            } else {
                console.error('Failed to update user role:', await response.text());
            }
        } catch (error) {
            console.error('Failed to update user role:', error);
        }
    }
    
    return (
        <PermissionGuard permission={PERMISSIONS.ANALYTICS}>
            <div className="p-8">
                <h1 className="text-2xl font-bold mb-6">User Management</h1>
                
                {isLoading ? (
                    <p>Loading users...</p>
                ) : (
                    <table className="min-w-full bg-white">
                        <thead>
                            <tr>
                                <th className="py-2 px-4 border-b">Name</th>
                                <th className="py-2 px-4 border-b">Email</th>
                                <th className="py-2 px-4 border-b">Role</th>
                                <th className="py-2 px-4 border-b">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td className="py-2 px-4 border-b">{user.fullname}</td>
                                    <td className="py-2 px-4 border-b">{user.email}</td>
                                    <td className="py-2 px-4 border-b">{user.role || 'USER'}</td>
                                    <td className="py-2 px-4 border-b">
                                        <select 
                                            value={user.role || 'USER'}
                                            onChange={(e) => updateUserRole(user.id, e.target.value)}
                                            className="p-2 border rounded"
                                        >
                                            <option value="USER">User</option>
                                            <option value="TEAM_MEMBER">Team Member</option>
                                            <option value="ADMIN">Admin</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </PermissionGuard>
    );
} 