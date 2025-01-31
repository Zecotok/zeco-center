"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash, faSave, faTimes, faUserShield } from "@fortawesome/free-solid-svg-icons";

interface User {
    _id: string;
    fullname: string;
    email: string;
    isAdmin: boolean;
}

function AdminPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [editingUser, setEditingUser] = useState<string | null>(null);
    const [formData, setFormData] = useState({ fullname: "", email: "", password: "", isAdmin: false });
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (!session?.user?.isAdmin) {
            router.push("/");
        } else {
            fetchUsers();
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

    const handleEdit = (user: User) => {
        setEditingUser(user._id);
        setFormData({
            fullname: user.fullname,
            email: user.email,
            password: "",
            isAdmin: user.isAdmin || false,
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

                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
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
                                                onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                                                className="form-checkbox h-5 w-5 text-blue-600"
                                            />
                                        ) : (
                                            user.isAdmin ? "Yes" : "No"
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