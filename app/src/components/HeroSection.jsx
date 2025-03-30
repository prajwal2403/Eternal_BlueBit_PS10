import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom'; // Add this import
import heroImage from '../assets/hero.png';

// Update the Header component to use Link
const Header = ({ isLoggedIn, onLogout }) => (
    <header className="fixed top-0 left-0 w-full bg-black z-50 shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="text-white font-bold text-2xl">Odysseus</div>
            <nav>
                <ul className="flex space-x-6">
                    {isLoggedIn ? (
                        <li><button onClick={onLogout} className="text-white bg-red-500 px-4 py-2 rounded-md">Logout</button></li>
                    ) : (
                        <li>
                            <Link
                                to="/auth"
                                className="text-black bg-green-500 px-4 py-2 rounded-md font-medium hover:bg-green-600 transition-all duration-200"
                            >
                                Login
                            </Link>
                        </li>
                    )}
                </ul>
            </nav>
        </div>
    </header>
);

// Helmet component for setting document head
const Helmet = ({ title, children }) => (
    <div>
        {/* This would normally set document title */}
        {children}
    </div>
);

const Home = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Sample image options
    const imageOptions = [
        { id: 1, name: "Sci-Fi Adventure", thumbnail: "/api/placeholder/100/100", fullImage: "/api/placeholder/500/400" },
        { id: 2, name: "Fantasy World", thumbnail: "/api/placeholder/100/100", fullImage: "/api/placeholder/500/400" },
        { id: 3, name: "Mystery Thriller", thumbnail: "/api/placeholder/100/100", fullImage: "/api/placeholder/500/400" },
        { id: 4, name: "Historical Fiction", thumbnail: "/api/placeholder/100/100", fullImage: "/api/placeholder/500/400" }
    ];

    useEffect(() => {
        setIsVisible(true);
        // Set default selected image
        setSelectedImage(imageOptions[0]);
    }, []);

    const handleImageSelect = (image) => {
        setSelectedImage(image);
        setIsModalOpen(false);
    };

    return (
        <>
            <Header isLoggedIn={false} onLogout={() => { }} />
            <Helmet title={"Odysseus AI Storytelling"}>
                <section id="home" className="min-h-screen bg-black text-white pt-24 pb-16">
                    <div className="container mx-auto px-4">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            {/* Left Column - Content */}
                            <motion.div
                                className="w-full md:w-1/2"
                                initial={{ opacity: 0, x: -50 }}
                                animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -50 }}
                                transition={{ duration: 0.8 }}
                            >
                                <div className="space-y-6">
                                    <h2 className="text-3xl md:text-4xl font-bold text-white">
                                        Unleash Your Creative Potential
                                    </h2>
                                    <h2 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-green-400 to-red-500 bg-clip-text text-transparent">
                                        Odysseus
                                    </h2>
                                    <div className="bg-gray-800 px-4 py-2 rounded-md inline-block">
                                        <p className="text-green-400 font-medium">Team ETERNALS | Blue Bit Hackathon 3.0</p>
                                    </div>

                                    <p className="text-lg text-gray-300 my-6">
                                        Empower your storytelling with advanced RAG-based AI technology that generates
                                        compelling plots, rich characters, and immersive worlds. Break through creative blocks,
                                        save time, and craft unforgettable narratives with ease.
                                    </p>

                                    <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                                        <motion.div>
                                            <Link
                                                to="/auth"
                                                className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-700 text-black font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center"
                                            >
                                                Start Creating
                                                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                                                </svg>
                                            </Link>
                                        </motion.div>
                                        <motion.a
                                            href="#examples"
                                            className="px-8 py-3 border-2 border-green-500 text-green-400 font-semibold rounded-lg hover:bg-gray-800 transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            View Examples
                                        </motion.a>
                                    </div>

                                    {/* Image selection trigger button */}
                                    <motion.button
                                        onClick={() => setIsModalOpen(true)}
                                        className="mt-6 px-4 py-2 bg-gray-800 text-white rounded-lg flex items-center space-x-2 hover:bg-gray-700 transition"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 1 }}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                        </svg>
                                        <span>Change Story Theme</span>
                                    </motion.button>

                                    <div className="flex mt-8 space-x-2">
                                        <div className="flex -space-x-2">
                                            <div className="w-10 h-10 rounded-full bg-green-400 flex items-center justify-center text-black text-xs font-bold">PK</div>
                                            <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-black text-xs font-bold">AK</div>
                                            <div className="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center text-black text-xs font-bold">PK</div>
                                            <div className="w-10 h-10 rounded-full bg-purple-400 flex items-center justify-center text-black text-xs font-bold">AL</div>
                                        </div>
                                        <p className="text-gray-400 ml-2">Created by Team ETERNALS</p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Right Column - Image */}
                            <motion.div
                                className="w-full md:w-1/2"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : 50 }}
                                transition={{ duration: 0.8, delay: 0.3 }}
                            >
                                <div className="relative">
                                    {/* Image container */}
                                    <div className="relative z-10 rounded-xl overflow-hidden">
                                        <img
                                            src={heroImage}
                                            alt="Hero"
                                            className="w-full h-auto rounded-lg transform hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Features Section */}
                    <div className="container mx-auto px-4 mt-32">
                        <motion.h3
                            className="text-2xl font-bold text-center mb-12 relative"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
                            transition={{ delay: 0.8 }}
                        >
                            <span className="bg-gradient-to-r from-green-400 to-red-500 bg-clip-text text-transparent">
                                STORYTELLING REIMAGINED
                            </span>
                            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-green-500"></div>
                        </motion.h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                {
                                    title: 'Dynamic Plot Generation',
                                    desc: 'Create compelling story arcs with AI-powered plot generation that adapts to your inputs and preferences.',
                                    icon: (
                                        <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
                                        </svg>
                                    )
                                },
                                {
                                    title: 'Character Development',
                                    desc: 'Build rich, complex characters with detailed backstories, motivations, and personality traits.',
                                    icon: (
                                        <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                        </svg>
                                    )
                                },
                                {
                                    title: 'World Building',
                                    desc: 'Craft immersive settings and universes with consistent rules, history, and atmospheric details.',
                                    icon: (
                                        <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        </svg>
                                    )
                                }
                            ].map((feature, index) => (
                                <motion.div
                                    key={index}
                                    className="bg-gray-900 p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2 border-t-4 border-green-500"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
                                    transition={{ delay: index * 0.2 + 1 }}
                                    whileHover={{ scale: 1.03 }}
                                >
                                    <div className="w-12 h-12 bg-black bg-opacity-50 rounded-full flex items-center justify-center mb-4">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                                    <p className="text-gray-400">
                                        {feature.desc}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Image selection modal */}
                    {isModalOpen && (
                        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                            <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-bold text-white">Select Story Theme</h3>
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="text-gray-400 hover:text-white"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                        </svg>
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {imageOptions.map(image => (
                                        <div
                                            key={image.id}
                                            className={`cursor-pointer rounded-lg overflow-hidden transition-all ${selectedImage?.id === image.id ? 'ring-2 ring-green-500' : ''}`}
                                            onClick={() => handleImageSelect(image)}
                                        >
                                            <img src={image.thumbnail} alt={image.name} className="w-full h-auto" />
                                            <p className="text-center text-sm py-2 bg-black bg-opacity-50">{image.name}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            </Helmet>
        </>
    );
};

export default Home;