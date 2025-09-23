import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  EyeIcon,
  EyeSlashIcon,
  TrophyIcon,
  UserIcon,
  KeyIcon,
  SparklesIcon,
  ShieldCheckIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError(t('auth.loginError'));
      return;
    }

    try {
      setIsLoading(true);
      await login(username, password);
      navigate('/');
    } catch (error: any) {
      setError(error.message || 'Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-teal-400/10 to-cyan-500/20"></div>

        {/* Floating Soccer Balls */}
        <div className="absolute top-10 left-10 animate-bounce delay-0">
          <div className="w-8 h-8 bg-white/20 rounded-full shadow-lg animate-pulse"></div>
        </div>
        <div className="absolute top-32 right-20 animate-bounce delay-1000">
          <div className="w-6 h-6 bg-emerald-300/30 rounded-full shadow-lg animate-pulse"></div>
        </div>
        <div className="absolute bottom-40 left-20 animate-bounce delay-2000">
          <div className="w-10 h-10 bg-teal-300/25 rounded-full shadow-lg animate-pulse"></div>
        </div>
        <div className="absolute bottom-20 right-32 animate-bounce delay-500">
          <div className="w-4 h-4 bg-cyan-300/40 rounded-full shadow-lg animate-pulse"></div>
        </div>

        {/* Floating Trophy Icons */}
        <div className="absolute top-20 right-10 animate-float delay-0">
          <TrophyIcon className="h-8 w-8 text-yellow-300/40 animate-pulse" />
        </div>
        <div className="absolute bottom-60 left-32 animate-float delay-1500">
          <TrophyIcon className="h-6 w-6 text-yellow-400/30 animate-pulse" />
        </div>

        {/* Geometric Shapes */}
        <div className="absolute top-1/4 left-1/4 w-20 h-20 bg-gradient-to-br from-emerald-400/20 to-teal-500/20 rounded-full animate-pulse shadow-2xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-16 h-16 bg-gradient-to-br from-cyan-400/15 to-blue-500/15 transform rotate-45 animate-spin-slow shadow-2xl"></div>

        {/* Parallax Stars */}
        <div className="absolute top-16 left-1/3 w-2 h-2 bg-white/60 rounded-full animate-twinkle"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-emerald-200/80 rounded-full animate-twinkle delay-700"></div>
        <div className="absolute bottom-1/3 left-1/2 w-1.5 h-1.5 bg-teal-200/70 rounded-full animate-twinkle delay-1400"></div>
        <div className="absolute top-2/3 left-20 w-1 h-1 bg-cyan-200/60 rounded-full animate-twinkle delay-2100"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 animate-fade-in-up">
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-6 animate-float">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 rounded-3xl flex items-center justify-center shadow-2xl backdrop-blur-sm border border-white/20 animate-glow">
                <TrophyIcon className="h-12 w-12 text-white animate-pulse" />
              </div>
            </div>
            <h2 className="text-5xl font-bold text-white -mb-2 animate-slide-down">
              Welcome to
            </h2>
            <div className="flex justify-center -mt-2 -mb-2 animate-zoom-in delay-300">
              <img
                src="/soccer_tagger.png"
                alt="Soccer Tagger"
                className="h-32 w-auto object-contain drop-shadow-2xl"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'block';
                }}
              />
              <div
                className="text-5xl font-bold text-emerald-300 drop-shadow-lg"
                style={{ display: 'none' }}
              >
                Soccer Tagger
              </div>
            </div>
            <p className="text-xl text-emerald-100 mb-4 -mt-2 animate-slide-up delay-500">
              Professional Tagging System
            </p>
            <div className="flex justify-center space-x-3 animate-fade-in delay-700">
              <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-100 border-emerald-400/30 backdrop-blur-sm hover:bg-emerald-400/30 transition-all duration-300">
                <SparklesIcon className="h-4 w-4 mr-1 animate-pulse" />
                Advanced Analytics
              </Badge>
              <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-100 border-cyan-400/30 backdrop-blur-sm hover:bg-cyan-400/30 transition-all duration-300">
                <ShieldCheckIcon className="h-4 w-4 mr-1 animate-pulse" />
                Secure Access
              </Badge>
            </div>
          </div>

          {/* Login Card */}
          <Card className="border-0 shadow-2xl bg-white/10 backdrop-blur-lg border border-white/20 animate-slide-up delay-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold text-center text-white">Sign In</CardTitle>
              <CardDescription className="text-center text-emerald-100">
                Enter your credentials to access the system
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-500/20 border border-red-400/30 rounded-lg backdrop-blur-sm animate-shake">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 bg-red-400/30 rounded-full flex items-center justify-center">
                        <span className="text-red-100 text-xs font-bold">!</span>
                      </div>
                      <div className="text-sm text-red-100">{error}</div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="username" className="block text-sm font-medium text-emerald-100">
                      <UserIcon className="h-4 w-4 inline mr-2" />
{t('auth.username')}
                    </label>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      required
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-12 text-base bg-white/10 border-white/30 text-white placeholder-emerald-200 focus:border-emerald-400 focus:ring-emerald-400/50 backdrop-blur-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-medium text-emerald-100">
                      <KeyIcon className="h-4 w-4 inline mr-2" />
{t('auth.password')}
                    </label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        required
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 text-base pr-12 bg-white/10 border-white/30 text-white placeholder-emerald-200 focus:border-emerald-400 focus:ring-emerald-400/50 backdrop-blur-sm"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-10 w-10 p-0 hover:bg-white/20 text-emerald-200"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 text-base bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 shadow-2xl transform hover:scale-105 transition-all duration-300 animate-glow"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LockClosedIcon className="h-4 w-4 mr-2" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Demo Credentials */}
          <Card className="border-0 shadow-2xl bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 backdrop-blur-lg border border-white/20 animate-slide-up delay-500">
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <h4 className="text-lg font-semibold text-white mb-2">🔑 Demo Credentials</h4>
                <p className="text-sm text-blue-200">Use these accounts to explore the system</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/10 rounded-lg p-4 border border-white/20 backdrop-blur-sm hover:bg-white/20 transition-all duration-300">
                  <div className="flex items-center space-x-2 mb-2">
                    <ShieldCheckIcon className="h-4 w-4 text-red-400" />
                    <span className="font-semibold text-red-300">Super Admin</span>
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="flex items-center space-x-2">
                      <UserIcon className="h-3 w-3 text-emerald-300" />
                      <code className="text-xs bg-black/20 text-emerald-200 px-2 py-1 rounded">admin</code>
                    </div>
                    <div className="flex items-center space-x-2">
                      <KeyIcon className="h-3 w-3 text-emerald-300" />
                      <code className="text-xs bg-black/20 text-emerald-200 px-2 py-1 rounded">admin123</code>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 rounded-lg p-4 border border-white/20 backdrop-blur-sm hover:bg-white/20 transition-all duration-300">
                  <div className="flex items-center space-x-2 mb-2">
                    <UserIcon className="h-4 w-4 text-blue-400" />
                    <span className="font-semibold text-blue-300">Tagger</span>
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="flex items-center space-x-2">
                      <UserIcon className="h-3 w-3 text-cyan-300" />
                      <code className="text-xs bg-black/20 text-cyan-200 px-2 py-1 rounded">tagger</code>
                    </div>
                    <div className="flex items-center space-x-2">
                      <KeyIcon className="h-3 w-3 text-cyan-300" />
                      <code className="text-xs bg-black/20 text-cyan-200 px-2 py-1 rounded">tagger123</code>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.5); }
          50% { box-shadow: 0 0 40px rgba(16, 185, 129, 0.8), 0 0 60px rgba(16, 185, 129, 0.3); }
        }
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-down {
          0% { opacity: 0; transform: translateY(-30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes zoom-in {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        .animate-twinkle {
          animation: twinkle 2s ease-in-out infinite;
        }
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out;
        }
        .animate-slide-down {
          animation: slide-down 0.6s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }
        .animate-zoom-in {
          animation: zoom-in 0.8s ease-out;
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        .delay-300 {
          animation-delay: 0.3s;
        }
        .delay-500 {
          animation-delay: 0.5s;
        }
        .delay-700 {
          animation-delay: 0.7s;
        }
        .delay-1000 {
          animation-delay: 1s;
        }
        .delay-1400 {
          animation-delay: 1.4s;
        }
        .delay-1500 {
          animation-delay: 1.5s;
        }
        .delay-2000 {
          animation-delay: 2s;
        }
        .delay-2100 {
          animation-delay: 2.1s;
        }
      `}</style>
    </div>
  );
};

export default Login;