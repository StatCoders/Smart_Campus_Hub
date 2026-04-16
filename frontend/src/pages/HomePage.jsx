import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Calendar, Wrench, Users, Clock, Zap, ArrowRight, Bell, User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import campusLogo from '../assets/campus-logo.png';
import universityBg from '../assets/university-bg.jpg';
import bg2 from '../assets/bg2.jpg';
import bg4 from '../assets/bg4.jpg';

export default function HomePage() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const backgroundImages = [universityBg, bg2, bg4];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [backgroundImages.length]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleNavigate = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white/95">
      {/* Navigation Header - White with subtle elevation */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/98 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <img src={campusLogo} alt="Winterfall Northern University" className="h-12 w-12" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Winterfall Northern University</h1>
                <p className="text-xs text-blue-600 font-medium">Operations Hub</p>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="hidden md:flex items-center gap-8">
              <button
                onClick={() => handleNavigate('/student-resources')}
                className="text-gray-700 hover:text-blue-600 transition font-medium"
              >
                Resources
              </button>
              <button
                onClick={() => handleNavigate('/bookings')}
                className="text-gray-700 hover:text-blue-600 transition font-medium"
              >
                Bookings
              </button>
              <button
                onClick={() => handleNavigate('/student-tickets')}
                className="text-gray-700 hover:text-blue-600 transition font-medium"
              >
                Tickets
              </button>
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-3 relative">
              <button className="p-2 hover:bg-blue-50 rounded-lg transition">
                <Bell className="w-5 h-5 text-blue-600" />
              </button>
              
              {/* Profile Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-blue-50 rounded-lg transition"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {user?.firstName?.charAt(0) || 'U'}
                </div>
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                  {/* User Info */}
                  <div className="p-4 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{user?.firstName} {user?.lastName || ''}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {user?.role || 'USER'}
                      </span>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="p-2">
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg transition"
                    >
                      <User className="w-4 h-4" />
                      Your Profile
                    </button>
                    <button
                      onClick={() => {
                        navigate('/settings');
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Background Image */}
      <section
        className="relative py-24 sm:py-40 overflow-hidden transition-all duration-1000"
        style={{
          backgroundImage: `url(${backgroundImages[currentImageIndex]})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        {/* Minimal overlay for text readability */}
        <div className="absolute inset-0 bg-black/20" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content - Glassmorphic Card */}
            <div className="backdrop-blur-md bg-white/15 border border-white/30 rounded-3xl p-8 sm:p-12 shadow-2xl">
              <div className="space-y-6">
                <div className="space-y-4">
                  <p className="text-sm font-semibold uppercase tracking-widest text-blue-100">
                    Winterfall Northern University
                  </p>
                  <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
                    A Smarter Campus, Crafted For Serious Ambition
                  </h2>
                  <p className="text-lg text-blue-50 leading-relaxed">
                    Plan your schedule, reserve spaces, and stay connected with every part of university life from one refined platform.
                  </p>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    onClick={() => handleNavigate('/student-resources')}
                    className="group inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-semibold transition transform hover:scale-105"
                  >
                    Explore Campus Resources
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
                  </button>
                  <button
                    onClick={() => handleNavigate('/bookings')}
                    className="inline-flex items-center justify-center gap-2 border-2 border-white hover:bg-white/10 text-white px-8 py-3 rounded-full font-semibold transition"
                  >
                    Reserve Facilities
                  </button>
                </div>
              </div>
            </div>

            {/* Right Statistics - Glassmorphic Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="backdrop-blur-md bg-blue-500/20 border border-blue-300/30 rounded-2xl p-6 text-center">
                <p className="text-3xl font-bold text-white">24/7</p>
                <p className="text-sm text-blue-100 mt-2 uppercase tracking-wider">Service Access</p>
              </div>
              <div className="backdrop-blur-md bg-blue-500/20 border border-blue-300/30 rounded-2xl p-6 text-center">
                <p className="text-3xl font-bold text-white">&lt;10m</p>
                <p className="text-sm text-blue-100 mt-2 uppercase tracking-wider">Avg Response</p>
              </div>
              <div className="backdrop-blur-md bg-blue-500/20 border border-blue-300/30 rounded-2xl p-6 text-center col-span-2">
                <p className="text-3xl font-bold text-white">One</p>
                <p className="text-sm text-blue-100 mt-2 uppercase tracking-wider">Unified Campus Portal</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Clock, title: '24/7 Service Access', description: 'Resources available round the clock for your convenience', color: 'bg-blue-50 border-blue-200' },
              { icon: Zap, title: '<10m Response Time', description: 'Average ticket response time for maintenance requests', color: 'bg-blue-50 border-blue-200' },
              { icon: Users, title: 'Unified Campus Portal', description: 'One platform for all your campus needs', color: 'bg-blue-50 border-blue-200' },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className={`rounded-2xl border ${feature.color} bg-white p-8 hover:shadow-lg transition`}
                >
                  <div className="inline-flex p-3 bg-blue-100 rounded-lg mb-4">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Resources Overview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold text-gray-900">Campus Resources & Services</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Everything you need to manage your campus life in one unified platform
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Building2,
                  title: 'Facilities',
                  description: 'Browse and manage campus facilities, labs, and study rooms',
                  path: '/student-resources',
                  color: 'bg-blue-600',
                  lightColor: 'from-blue-50 to-blue-100',
                },
                {
                  icon: Calendar,
                  title: 'Bookings',
                  description: 'Reserve spaces, rooms, and equipment for your activities',
                  path: '/bookings',
                  color: 'bg-blue-700',
                  lightColor: 'from-blue-50 to-blue-100',
                },
                {
                  icon: Wrench,
                  title: 'Maintenance',
                  description: 'Report issues and track maintenance requests in real-time',
                  path: '/student-tickets',
                  color: 'bg-blue-800',
                  lightColor: 'from-blue-50 to-blue-100',
                },
              ].map((resource) => {
                const Icon = resource.icon;
                return (
                  <div
                    key={resource.title}
                    className={`group rounded-2xl border border-blue-200 bg-gradient-to-br ${resource.lightColor} backdrop-blur overflow-hidden hover:shadow-lg transition p-8`}
                  >
                    <div className={`inline-flex p-4 ${resource.color} rounded-xl mb-6 group-hover:scale-110 transition`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{resource.title}</h3>
                    <p className="text-gray-700 mb-6">{resource.description}</p>
                    <button
                      onClick={() => handleNavigate(resource.path)}
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold group/link transition"
                    >
                      Explore <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* How to Use Guide */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold text-gray-900">How to Use the Platform</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Get started in four simple steps
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { number: '01', title: 'Explore Resources', description: 'Browse through all available campus facilities, rooms, and equipment with detailed information and availability status.' },
                { number: '02', title: 'Make Reservations', description: 'Book facilities and resources that suit your needs with our intuitive reservation system.' },
                { number: '03', title: 'Report Issues', description: 'Create maintenance tickets for any issues and track them in real-time until resolution.' },
                { number: '04', title: 'Stay Connected', description: 'Receive notifications and updates about your bookings, tickets, and important campus announcements.' },
              ].map((step, index) => (
                <div key={index} className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-bold bg-gradient-to-br from-blue-600 to-blue-700 bg-clip-text text-transparent">
                      {step.number}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Highlight */}
      <section className="py-20 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-4xl font-bold text-gray-900">Why Choose Our Platform</h2>
                <p className="text-lg text-gray-600">
                  Built with students and staff in mind, designed for efficiency and accessibility
                </p>
              </div>

              <div className="space-y-4">
                {[
                  'Real-time availability updates for all facilities',
                  'Instant ticket tracking and status updates',
                  'Seamless booking and reservation system',
                  'Mobile-friendly interface for on-the-go access',
                  'Comprehensive notification system',
                  'Dedicated support for all users',
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className="flex items-center justify-center h-6 w-6 rounded-md bg-blue-100">
                        <Zap className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <p className="text-gray-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 backdrop-blur p-12">
              <div className="space-y-8">
                <div>
                  <p className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                    500+
                  </p>
                  <p className="text-gray-600 mt-2">Active Users</p>
                </div>
                <div>
                  <p className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                    1000+
                  </p>
                  <p className="text-gray-600 mt-2">Bookings Per Month</p>
                </div>
                <div>
                  <p className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                    98%
                  </p>
                  <p className="text-gray-600 mt-2">User Satisfaction</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="py-20 bg-gradient-to-r from-blue-900 to-blue-950 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-white">Ready to Get Started?</h2>
            <p className="text-lg text-blue-100">
              Access all campus resources and manage your schedule efficiently
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => handleNavigate('/student-resources')}
              className="inline-flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-8 py-3 rounded-full font-semibold transition transform hover:scale-105"
            >
              Explore Resources
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleNavigate('/student-tickets')}
              className="inline-flex items-center justify-center gap-2 border-2 border-white hover:bg-white/10 text-white px-8 py-3 rounded-full font-semibold transition"
            >
              View Tickets
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold mb-4">Winterfall Northern University</h3>
              <p className="text-gray-400 text-sm">
                Campus Operations Hub
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><button onClick={() => handleNavigate('/student-resources')} className="hover:text-white transition">Resources</button></li>
                <li><button onClick={() => handleNavigate('/bookings')} className="hover:text-white transition">Bookings</button></li>
                <li><button onClick={() => handleNavigate('/student-tickets')} className="hover:text-white transition">Tickets</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8">
            <p className="text-center text-gray-500 text-sm">
              ┬® 2024 Winterfall Northern University. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
