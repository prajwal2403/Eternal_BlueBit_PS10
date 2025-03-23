import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronRight, LogOut, Book, PlusSquare, User } from 'lucide-react';

const DashboardLayout = ({ user, children }) => {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeLink, setActiveLink] = useState('/dashboard');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/auth');
    };

    const gradientStyle = {
        backgroundImage: 'radial-gradient(circle at 50% 50%, #1a2e35 0%, #0f172a 100%)',
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const handleNavigation = (path) => {
        setActiveLink(path);
    };

    return (
        <div className="min-h-screen w-full flex" style={gradientStyle}>
            {/* Mobile menu button */}
            <button
                onClick={toggleSidebar}
                className="md:hidden fixed z-20 top-4 left-4 bg-gray-700 p-2 rounded-md"
            >
                {sidebarOpen ? <X size={20} className="text-white" /> : <Menu size={20} className="text-white" />}
            </button>

            {/* Sidebar */}
            <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        transition-transform duration-300 ease-in-out fixed md:static z-10 
        w-64 bg-gray-800 h-screen p-6 shadow-xl`}>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center justify-between">
                    Dashboard
                    <button onClick={toggleSidebar} className="md:hidden">
                        <X size={20} className="text-gray-400 hover:text-white" />
                    </button>
                </h2>

                {user && (
                    <div className="mb-6 p-3 bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                            <div className="bg-gray-600 p-2 rounded-full">
                                <User size={18} className="text-green-400" />
                            </div>
                            <div className="w-full overflow-hidden">
                                <h3 className="text-lg font-medium text-white truncate">{user.name}</h3>
                                <p className="text-sm text-gray-400 truncate">{user.email}</p>
                            </div>
                        </div>
                    </div>
                )}

                <nav className="space-y-2">
                    <Link
                        to="/dashboard"
                        className={`flex items-center p-3 rounded-lg transition-all duration-200 ${activeLink === '/dashboard'
                                ? 'bg-gray-700 text-green-400'
                                : 'text-gray-300 hover:bg-gray-700 hover:text-green-300'
                            }`}
                        onClick={() => handleNavigation('/dashboard')}
                    >
                        <Book size={18} className="mr-3" />
                        <span>My Stories</span>
                        {activeLink === '/dashboard' && <ChevronRight size={16} className="ml-auto" />}
                    </Link>

                    <Link
                        to="/add-story"
                        className={`flex items-center p-3 rounded-lg transition-all duration-200 ${activeLink === '/add-story'
                                ? 'bg-gray-700 text-green-400'
                                : 'text-gray-300 hover:bg-gray-700 hover:text-green-300'
                            }`}
                        onClick={() => handleNavigation('/add-story')}
                    >
                        <PlusSquare size={18} className="mr-3" />
                        <span>Add Story</span>
                        {activeLink === '/add-story' && <ChevronRight size={16} className="ml-auto" />}
                    </Link>

                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full p-3 rounded-lg text-red-400 hover:bg-gray-700 hover:text-red-300 transition-all duration-200"
                    >
                        <LogOut size={18} className="mr-3" />
                        <span>Logout</span>
                    </button>
                </nav>
            </div>

            {/* Main content */}
            <div className="flex-1 h-screen overflow-auto">
                {/* Overlay for mobile when sidebar is open */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-0 md:hidden"
                        onClick={toggleSidebar}
                    ></div>
                )}
                <div className="p-4 md:p-8 h-full">
                    <div className="bg-gray-800 bg-opacity-70 rounded-xl p-6 shadow-lg h-full">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;