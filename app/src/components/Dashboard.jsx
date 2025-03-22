import React from 'react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    return (
        <div className="flex h-screen bg-black">
            {/* Sidebar */}
            <div className="w-64 bg-gray-900 text-white">
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-green-500">Odysseus</h2>
                </div>
                <nav className="mt-6">
                    <Link
                        to="/dashboard"
                        className="block px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-green-500"
                    >
                        Dashboard
                    </Link>
                    <Link
                        to="/generate"
                        className="block px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-green-500"
                    >
                        Generate
                    </Link>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-black p-8">
                <div className="bg-gray-900 rounded-lg p-6">
                    <h1 className="text-3xl font-bold text-white mb-6">Dashboard</h1>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Stats Cards */}
                        <div className="bg-gray-800 p-6 rounded-lg">
                            <h3 className="text-xl font-semibold text-green-500">Total Generations</h3>
                            <p className="text-3xl font-bold text-white mt-2">0</p>
                        </div>
                        <div className="bg-gray-800 p-6 rounded-lg">
                            <h3 className="text-xl font-semibold text-green-500">Recent Activities</h3>
                            <p className="text-3xl font-bold text-white mt-2">0</p>
                        </div>
                        <div className="bg-gray-800 p-6 rounded-lg">
                            <h3 className="text-xl font-semibold text-green-500">Success Rate</h3>
                            <p className="text-3xl font-bold text-white mt-2">0%</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;