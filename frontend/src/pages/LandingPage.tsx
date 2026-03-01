import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { 
  FileText, 
  Shield, 
  Zap, 
  MessageSquare, 
  ArrowRight,
  CheckCircle2,
  Users,
  BarChart3,
  Sun,
  Moon,
  Map as MapIcon
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { SiteFooter } from '../components/layout/SiteFooter';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api/client';

const CAMPUS_IMAGES = [
  {
    url: '/images/astu-gate.jpg',
    title: 'ASTU Geda Gate',
    description: 'Welcome to Adama Science and Technology University'
  },
  {
    url: '/images/astu-main-building.jpg',
    title: 'Lab Building',
    description: 'State-of-the-art laboratory facilities'
  },
  {
    url: '/images/astu2.jpg',
    title: 'Main Gate',
    description: 'Modern infrastructure for quality education'
  },
  {
    url: '/images/astu3.jpg',
    title: 'Academic Complex',
    description: 'Innovative learning spaces'
  },
  {
    url: '/images/astu4.jpg',
    title: 'Campus Grounds',
    description: 'Beautiful and serene learning environment'
  },
  {
    url: '/images/central.jpg',
    title: 'Central Library',
    description: 'Modern library with extensive resources'
  },
  {
    url: '/images/deans office.jpg',
    title: 'Administrative Building',
    description: 'Dean\'s office and administrative services'
  }
];

const CampusShowcase: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = (prev + 1) % CAMPUS_IMAGES.length;
        console.log(`Transitioning from image ${prev} to ${nextIndex} of ${CAMPUS_IMAGES.length} total images`);
        return nextIndex;
      });
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: isDark
            ? "linear-gradient(135deg, rgba(2,6,23,0.85) 0%, rgba(2,6,23,0.80) 50%, rgba(6,95,70,0.75) 100%), url('/images/astu-main-building.jpg')"
            : "linear-gradient(135deg, rgba(248,250,252,0.85) 0%, rgba(241,245,249,0.80) 50%, rgba(16,185,129,0.30) 100%), url('/images/astu-main-building.jpg')",
          backgroundSize: 'cover, cover',
          backgroundPosition: 'center, center',
          backgroundRepeat: 'no-repeat, no-repeat',
          backgroundAttachment: 'fixed, fixed'
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <Badge className="mb-4 px-4 py-1.5 text-sm bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-400/40 backdrop-blur-sm">
            Our Campus
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4 text-slate-900 dark:text-slate-100">
            Adama Science and Technology University
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto">
            A modern campus fostering innovation, excellence, and student success
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative rounded-3xl overflow-hidden border border-white/20 bg-white/70 backdrop-blur-2xl shadow-2xl dark:border-slate-800/70 dark:bg-slate-900/70"
        >
          {/* Image Carousel */}
          <div className="relative h-[400px] md:h-[500px] lg:h-[600px]">
            {CAMPUS_IMAGES.map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: currentIndex === index ? 1 : 0,
                  scale: currentIndex === index ? 1 : 1.1
                }}
                transition={{ duration: 1 }}
                className="absolute inset-0"
                style={{ pointerEvents: currentIndex === index ? 'auto' : 'none' }}
              >
                <img
                  src={image.url}
                  alt={image.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                
                {/* Image Info */}
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                      opacity: currentIndex === index ? 1 : 0,
                      y: currentIndex === index ? 0 : 20
                    }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                      {image.title}
                    </h3>
                    <p className="text-slate-200 text-base md:text-lg">
                      {image.description}
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Navigation Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {CAMPUS_IMAGES.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  currentIndex === index
                    ? 'w-8 bg-emerald-500'
                    : 'w-2 bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const statsCardClasses = isDark
    ? 'bg-emerald-900/40 backdrop-blur-md border border-emerald-500/30 hover:bg-emerald-900/60'
    : 'bg-white/90 backdrop-blur-xl border border-emerald-200/70 hover:bg-emerald-50/90';
  const statsIconWrapClasses = isDark ? 'bg-emerald-500/40' : 'bg-emerald-100';
  const statsIconClasses = isDark ? 'text-white' : 'text-emerald-700';
  const statsNumberClasses = isDark ? 'text-emerald-200' : 'text-emerald-900';
  const statsLabelClasses = isDark ? 'text-emerald-100' : 'text-emerald-900';
  const statsBodyClasses = isDark ? 'text-emerald-100/80' : 'text-emerald-900/80';

  return (
    <div className="min-h-screen bg-transparent text-slate-900 dark:text-slate-100 transition-colors">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/20 bg-white/70 backdrop-blur-2xl dark:border-slate-800/70 dark:bg-slate-900/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <img 
              src="/images/astu-logo.png" 
              alt="ASTU Logo" 
              className="h-10 w-10 rounded-lg object-contain"
            />
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300 bg-clip-text text-transparent">
              ASTU Smart
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400">
                  Sign In
                </Link>
                <Link to="/register">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            ) : (
              <Link to="/dashboard">
                <Button size="sm">Go to Dashboard</Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.25),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(5,46,22,0.95),_transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-40 mix-blend-soft-light"
             style={{
               backgroundImage:
                 "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2322c55e' fill-opacity='0.12'%3E%3Cpath d='M36 16c0-2.21 1.79-4 4-4s4 1.79 4 4-1.79 4-4 4-4-1.79-4-4zm0 24c0-2.21 1.79-4 4-4s4 1.79 4 4-1.79 4-4 4-4-1.79-4-4zM12 16c0-2.21 1.79-4 4-4s4 1.79 4 4-1.79 4-4 4-4-1.79-4-4zm0 24c0-2.21 1.79-4 4-4s4 1.79 4 4-1.79 4-4 4-4-1.79-4-4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
             }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge className="mb-6 py-1.5 px-4 text-sm bg-emerald-500/20 text-emerald-100 border border-emerald-400/30 backdrop-blur-sm">
                ASTU Smart Complaint System
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white drop-shadow-[0_18px_55px_rgba(15,118,110,0.75)]">
                Professional, Transparent <br />
                <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-200 bg-clip-text text-transparent">
                  Campus Issue Management
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-emerald-50/90 sm:text-xl">
                Report, track, and resolve campus issues with a modern, role-based platform built for students, staff, and administrators.
              </p>
              <div className="mt-8 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
                <Link to={isAuthenticated ? "/complaints/new" : "/register"}>
                  <Button
                    size="lg"
                    className="h-14 w-full px-8 text-lg shadow-[0_22px_60px_rgba(16,185,129,0.55)] hover:shadow-[0_26px_70px_rgba(16,185,129,0.7)] sm:w-auto"
                  >
                    {isAuthenticated ? 'File a Complaint' : 'Submit Registration Request'} <ArrowRight className="ml-2" />
                  </Button>
                </Link>
                <Link to={isAuthenticated ? "/dashboard" : "/login"} className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-14 w-full px-8 text-lg border-emerald-200/60 bg-white/10 text-emerald-50 hover:bg-emerald-50/10 hover:border-emerald-100/80 sm:w-auto"
                  >
                    View Dashboard
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Compact summary panel instead of big image */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="relative"
            >
              <Card className="card-modern p-6 sm:p-8">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Live Snapshot
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Role-aware view for Students, Staff, and Admins
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40">
                    <CheckCircle2 size={20} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 p-3">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Students</p>
                    <p className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">File</p>
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Smart reporting with attachments</p>
                  </div>
                  <div className="rounded-2xl bg-sky-50 dark:bg-sky-900/20 p-3">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Staff</p>
                    <p className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">Act</p>
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Department-based complaint queues</p>
                  </div>
                  <div className="rounded-2xl bg-purple-50 dark:bg-purple-900/20 p-3">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Admin</p>
                    <p className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">Analyse</p>
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">System-wide analytics and roles</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Campus Showcase Section */}
      <CampusShowcase isDark={isDark} />

      {/* Interactive Map Section */}
      <section className="py-24 relative overflow-hidden">
        {/* Background with image showing through */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: isDark
              ? "linear-gradient(135deg, rgba(2,6,23,0.88) 0%, rgba(2,6,23,0.82) 50%, rgba(6,95,70,0.78) 100%), url('/images/astu-main-building.jpg')"
              : "linear-gradient(135deg, rgba(248,250,252,0.88) 0%, rgba(241,245,249,0.82) 50%, rgba(16,185,129,0.35) 100%), url('/images/astu-main-building.jpg')",
            backgroundSize: 'cover, cover',
            backgroundPosition: 'center, center',
            backgroundRepeat: 'no-repeat, no-repeat',
            backgroundAttachment: 'fixed, fixed'
          }}
        />
        
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <Badge className="mb-4 px-4 py-1.5 text-sm bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-400/40 backdrop-blur-sm">
              Campus Location
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4 text-slate-900 dark:text-slate-100">
              Find Us at ASTU Campus
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto">
              Adama Science and Technology University - Your gateway to quality education and innovation.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="rounded-[32px] border border-white/20 bg-white/70 backdrop-blur-2xl p-6 shadow-2xl dark:border-slate-800/70 dark:bg-slate-900/70 overflow-hidden"
          >
            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold mb-1 text-slate-900 dark:text-slate-100">ASTU Campus Map</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Adama, Ethiopia - Interactive location on Google Maps
                </p>
              </div>
              <a 
                href="https://www.google.com/maps/search/Adama+Science+and+Technology+University" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button size="sm" variant="outline">
                  Open in Google Maps <ArrowRight size={16} className="ml-2" />
                </Button>
              </a>
            </div>

            <div className="rounded-2xl overflow-hidden border border-white/20 bg-white/50 backdrop-blur-sm shadow-xl dark:border-slate-800/70 dark:bg-slate-900/50">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3942.8!2d39.2675!3d8.54!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x164b21f0e6b3c5a5%3A0x5e5e5e5e5e5e5e5e!2sAdama%20Science%20and%20Technology%20University!5e0!3m2!1sen!2set!4v1234567890"
                width="100%"
                height="500"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="ASTU Campus Location"
              />
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-white/20 dark:bg-slate-800/60 dark:border-slate-700/50">
                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <MapIcon size={20} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Location</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Adama, Ethiopia</p>
                </div>
              </div>

              {isAuthenticated && (
                <Link to="/map" className="flex items-start gap-3 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-white/20 hover:bg-white/80 transition-colors dark:bg-slate-800/60 dark:border-slate-700/50 dark:hover:bg-slate-800/80">
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <MapIcon size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Complaint Map</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">View issues on campus</p>
                  </div>
                </Link>
              )}

              <a 
                href="https://www.google.com/maps/dir/?api=1&destination=Adama+Science+and+Technology+University" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-4 rounded-xl bg-slate-800/50 border border-white/10 hover:bg-slate-800/70 transition-colors"
              >
                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <ArrowRight size={20} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Get Directions</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Navigate to campus</p>
                </div>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative overflow-hidden">
        {/* Background with image showing through */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: isDark
              ? "linear-gradient(135deg, rgba(2,6,23,0.85) 0%, rgba(2,6,23,0.80) 50%, rgba(6,95,70,0.75) 100%), url('/images/astu-main-building.jpg')"
              : "linear-gradient(135deg, rgba(248,250,252,0.85) 0%, rgba(241,245,249,0.80) 50%, rgba(16,185,129,0.30) 100%), url('/images/astu-main-building.jpg')",
            backgroundSize: 'cover, cover',
            backgroundPosition: 'center, center',
            backgroundRepeat: 'no-repeat, no-repeat',
            backgroundAttachment: 'fixed, fixed'
          }}
        />
        
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[32px] border border-white/20 bg-white/70 backdrop-blur-2xl p-10 shadow-2xl dark:border-slate-800/70 dark:bg-slate-900/70 sm:p-14">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
                Built for the ASTU Community
              </h2>
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 sm:text-base">
                Everything you need to manage campus life effectively.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {[
              {
                title: 'Smart Reporting',
                description: 'Easily file complaints with multi-file attachments and detailed descriptions.',
                icon: FileText,
                color: 'bg-emerald-100 text-emerald-600'
              },
              {
                title: 'Real-time Tracking',
                description: 'Get instant notifications on status changes and administrative remarks.',
                icon: Zap,
                color: 'bg-amber-100 text-amber-600'
              },
              {
                title: 'AI Assistance',
                description: 'Our smart chatbot provides 24/7 guidance on filing and resolving issues.',
                icon: MessageSquare,
                color: 'bg-sky-100 text-sky-600'
              },
              {
                title: 'Role-based Access',
                description: 'Tailored experiences for Students, Staff, and Administrators.',
                icon: Users,
                color: 'bg-purple-100 text-purple-600'
              },
              {
                title: 'Advanced Analytics',
                description: 'Data-driven insights for administrators to improve campus services.',
                icon: BarChart3,
                color: 'bg-rose-100 text-rose-600'
              },
              {
                title: 'Secure & Private',
                description: 'Your data is protected with industry-standard encryption and security.',
                icon: Shield,
                color: 'bg-indigo-100 text-indigo-600'
              }
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -5 }}
                  className="group"
                >
                  <Card className="h-full border-white/20 bg-white/60 backdrop-blur-xl transition-all hover:-translate-y-1.5 hover:border-emerald-400/60 hover:shadow-2xl dark:border-slate-800/70 dark:bg-slate-900/60">
                    <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-xl ${feature.color}`}>
                      <feature.icon size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-slate-100">{feature.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{feature.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Industry-Leading Performance */}
      <section
        className="relative overflow-hidden py-24"
        style={{
          backgroundImage: isDark
            ? 'radial-gradient(120% 120% at 20% 10%, rgba(16, 185, 129, 0.18) 0%, rgba(15, 118, 110, 0.2) 45%, rgba(2, 6, 23, 1) 100%)'
            : 'radial-gradient(120% 120% at 20% 10%, rgba(16, 185, 129, 0.18) 0%, rgba(22, 163, 74, 0.18) 45%, rgba(240, 253, 250, 1) 100%)'
        }}
      >
        <div
          className={`absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMmM1NWUiIGZpbGwtb3BhY2l0eT0iMC4xNSI+PHBhdGggZD0iTTM2IDE2YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00em0wIDI0YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00ek0xMiAxNmMwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0LTEuNzkgNC00IDQtNC0xLjc5LTQtNHptMCAyNGMwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0LTEuNzkgNC00IDQtNC0xLjc5LTQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] ${
            isDark ? 'opacity-25' : 'opacity-15'
          }`}
        />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold mb-4 text-white">ASTU Smart System Impact</h2>
            <p className="text-white/90 mb-16 text-lg max-w-2xl mx-auto">
              Empowering ASTU students and staff with efficient complaint resolution and transparent communication
            </p>
          </motion.div>
          
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className={`${statsCardClasses} rounded-3xl p-8 transition-all hover:scale-105`}
            >
              <div className="flex justify-center mb-4">
                <div className={`h-16 w-16 rounded-2xl ${statsIconWrapClasses} flex items-center justify-center`}>
                  <Users className={statsIconClasses} size={32} />
                </div>
              </div>
              <p className={`text-6xl md:text-7xl font-extrabold mb-3 ${statsNumberClasses}`}>
                98%
              </p>
              <p className={`${statsLabelClasses} text-sm font-bold uppercase tracking-wider mb-2`}>
                User Satisfaction
              </p>
              <p className={`${statsBodyClasses} text-xs leading-relaxed`}>
                Students report improved campus experience with digital complaint systems
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={`${statsCardClasses} rounded-3xl p-8 transition-all hover:scale-105`}
            >
              <div className="flex justify-center mb-4">
                <div className={`h-16 w-16 rounded-2xl ${statsIconWrapClasses} flex items-center justify-center`}>
                  <Zap className={statsIconClasses} size={32} />
                </div>
              </div>
              <p className={`text-6xl md:text-7xl font-extrabold mb-3 ${statsNumberClasses}`}>
                3x
              </p>
              <p className={`${statsLabelClasses} text-sm font-bold uppercase tracking-wider mb-2`}>
                Faster Resolution
              </p>
              <p className={`${statsBodyClasses} text-xs leading-relaxed`}>
                Smart systems resolve issues 3x faster than traditional methods
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className={`${statsCardClasses} rounded-3xl p-8 transition-all hover:scale-105`}
            >
              <div className="flex justify-center mb-4">
                <div className={`h-16 w-16 rounded-2xl ${statsIconWrapClasses} flex items-center justify-center`}>
                  <CheckCircle2 className={statsIconClasses} size={32} />
                </div>
              </div>
              <p className={`text-6xl md:text-7xl font-extrabold mb-3 ${statsNumberClasses}`}>
                92%
              </p>
              <p className={`${statsLabelClasses} text-sm font-bold uppercase tracking-wider mb-2`}>
                Resolution Rate
              </p>
              <p className={`${statsBodyClasses} text-xs leading-relaxed`}>
                Industry-leading success rate in resolving campus issues
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className={`${statsCardClasses} rounded-3xl p-8 transition-all hover:scale-105`}
            >
              <div className="flex justify-center mb-4">
                <div className={`h-16 w-16 rounded-2xl ${statsIconWrapClasses} flex items-center justify-center`}>
                  <BarChart3 className={statsIconClasses} size={32} />
                </div>
              </div>
              <p className={`text-6xl md:text-7xl font-extrabold mb-3 ${statsNumberClasses}`}>
                24/7
              </p>
              <p className={`${statsLabelClasses} text-sm font-bold uppercase tracking-wider mb-2`}>
                AI Support
              </p>
              <p className={`${statsBodyClasses} text-xs leading-relaxed`}>
                Round-the-clock intelligent assistance for all users
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
};

export default LandingPage;

