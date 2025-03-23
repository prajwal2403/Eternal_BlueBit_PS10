import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const DashboardLayout = ({ user, children }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/auth');
    };

    const gradientStyle = {
        backgroundImage: 'radial-gradient(circle at 50% 50%, #1a2e35 0%, #0f172a 100%)',
    };

    return (
        <div className="min-h-screen flex" style={gradientStyle}>
            <div className="w-64 bg-gray-800 p-6">
                <h2 className="text-2xl font-bold text-white mb-6">Dashboard</h2>
                {user && (
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-white">{user.name}</h3>
                        <p className="text-sm text-gray-400">{user.email}</p>
                    </div>
                )}
                <nav className="space-y-4">
                    <Link to="/dashboard" className="block text-green-400 hover:text-green-300 transition-colors">My Stories</Link>
                    <Link to="/add-story" className="block text-green-400 hover:text-green-300 transition-colors">Add Story</Link>
                    <button onClick={handleLogout} className="block text-red-400 hover:text-red-300 transition-colors">Logout</button>
                </nav>
            </div>
            <div className="flex-1 p-6">
                {children}
            </div>
        </div>
    );
};

export default DashboardLayout;