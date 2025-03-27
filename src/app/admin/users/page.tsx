"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash, faSave, faTimes, faUserShield, faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";

interface User {
    _id: string;
    fullname: string;
    email: string;
    isAdmin: boolean;
    role?: string;
}

interface PendingUser {
    _id: string;
    fullname: string;
    email: string;
    role?: string;
    createdAt: string;
}

function AdminPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
    const [editingUser, setEditingUser] = useState<string | null>(null);
    const [formData, setFormData] = useState({ 
        fullname: "", 
        email: "", 
        password: "", 
        isAdmin: false, 
        role: "USER"
    });
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (!session?.user?.isAdmin) {
            router.push("/");
        } else {
            fetchUsers();
            fetchPendingUsers();
        }
    }, [status, session]);

    const fetchUsers = async () => {
        try {
            const response = await axios.get("/api/admin/users");
            setUsers(response.data);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const fetchPendingUsers = async () => {
        try {
            const response = await axios.get("/api/admin/users/pending");
            setPendingUsers(response.data);
        } catch (error) {
            console.error("Error fetching pending users:", error);
        }
    };

    const handleEdit = (user: User) => {
        setEditingUser(user._id);
        setFormData({
            fullname: user.fullname,
            email: user.email,
            password: "",
            isAdmin: user.isAdmin || false,
            role: user.role || (user.isAdmin ? "ADMIN" : "USER")
        });
    };

    const handleSave = async (id: string) => {
        try {
            await axios.put("/api/admin/users", {
                id,
                ...formData,
            });
            setEditingUser(null);
            fetchUsers();
        } catch (error) {
            console.error("Error updating user:", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this user?")) {
            try {
                await axios.delete("/api/admin/users", { data: { id } });
                fetchUsers();
            } catch (error) {
                console.error("Error deleting user:", error);
            }
        }
    };

    const handleApproveUser = async (id: string) => {
        try {
            await axios.post("/api/admin/users/pending", {
                id,
                role: "USER",
                isAdmin: false
            });
            fetchPendingUsers();
            fetchUsers();
        } catch (error) {
            console.error("Error approving user:", error);
        }
    };

    const handleRejectUser = async (id: string) => {
        if (window.confirm("Are you sure you want to reject this user registration?")) {
            try {
                await axios.delete("/api/admin/users/pending", { data: { id } });
                fetchPendingUsers();
            } catch (error) {
                console.error("Error rejecting user:", error);
            }
        }
    };

    if (status === "loading") {
        return <div className="text-center mt-8">Loading...</div>;
    }

    if (!session || !session?.user?.isAdmin) {
        return <div className="text-center mt-8">Access denied</div>;
    }

    return (
        <div className="container mx-auto p-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center mb-6">
                    <FontAwesomeIcon icon={faUserShield} className="text-3xl text-blue-600 mr-3" />
                    <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
                </div>

                {/* Pending User Approvals */}
                {pendingUsers.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-700 mb-4">Pending Approvals</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-200">
                                <thead>
                                    <tr className="bg-yellow-50">
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered On</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {pendingUsers.map((user) => (
                                        <tr key={user._id} className="bg-yellow-50/30">
                                            <td className="px-6 py-4 whitespace-nowrap">{user.fullname}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => handleApproveUser(user._id)}
                                                    className="bg-green-500 hover:bg-green-600 text-white rounded px-3 py-1 mr-2"
                                                >
                                                    <FontAwesomeIcon icon={faCheck} className="mr-1" />
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleRejectUser(user._id)}
                                                    className="bg-red-500 hover:bg-red-600 text-white rounded px-3 py-1"
                                                >
                                                    <FontAwesomeIcon icon={faXmark} className="mr-1" />
                                                    Reject
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Existing Users Table */}
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Active Users</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {users.map((user) => (
                                <tr key={user._id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {editingUser === user._id ? (
                                            <input
                                                type="text"
                                                value={formData.fullname}
                                                onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                                                className="border rounded px-2 py-1 w-full"
                                            />
                                        ) : (
                                            user.fullname
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {editingUser === user._id ? (
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="border rounded px-2 py-1 w-full"
                                            />
                                        ) : (
                                            user.email
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {editingUser === user._id ? (
                                            <input
                                                type="checkbox"
                                                checked={formData.isAdmin}
                                                onChange={(e) => {
                                                    const isAdmin = e.target.checked;
                                                    setFormData({ 
                                                        ...formData, 
                                                        isAdmin,
                                                        role: isAdmin ? "ADMIN" : formData.role
                                                    });
                                                }}
                                                className="form-checkbox h-5 w-5 text-blue-600"
                                            />
                                        ) : (
                                            user.isAdmin ? "Yes" : "No"
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {editingUser === user._id ? (
                                            <select
                                                value={formData.role}
                                                onChange={(e) => {
                                                    const role = e.target.value;
                                                    setFormData({ 
                                                        ...formData, 
                                                        role,
                                                        isAdmin: role === "ADMIN" ? true : formData.isAdmin
                                                    });
                                                }}
                                                className="border rounded px-2 py-1"
                                            >
                                                <option value="USER">User</option>
                                                <option value="TEAM_MEMBER">Team Member</option>
                                                <option value="ADMIN">Admin</option>
                                            </select>
                                        ) : (
                                            user.role || (user.isAdmin ? "ADMIN" : "USER")
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {editingUser === user._id ? (
                                            <div className="space-x-2">
                                                <input
                                                    type="password"
                                                    placeholder="New Password (optional)"
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                    className="border rounded px-2 py-1"
                                                />
                                                <button
                                                    onClick={() => handleSave(user._id)}
                                                    className="text-green-600 hover:text-green-900"
                                                >
                                                    <FontAwesomeIcon icon={faSave} />
                                                </button>
                                                <button
                                                    onClick={() => setEditingUser(null)}
                                                    className="text-gray-600 hover:text-gray-900"
                                                >
                                                    <FontAwesomeIcon icon={faTimes} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-x-2">
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    <FontAwesomeIcon icon={faEdit} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user._id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default AdminPage; 