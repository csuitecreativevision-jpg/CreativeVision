import React from 'react';
import MainNavigation from './MainNavigation';

export default function LoginPage() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen text-white relative overflow-hidden" style={{backgroundColor: '#100024'}}>
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated Grid */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{background: 'linear-gradient(135deg, transparent 0%, rgba(116, 36, 245, 0.2) 50%, transparent 100%)'}}></div>
          <div className="grid grid-cols-12 gap-4 h-full w-full transform rotate-12 scale-150">
            {[...Array(144)].map((_, i) => (
              <div
                key={i}
                className="border rounded-lg"
                style={{borderColor: 'rgba(116, 36, 245, 0.1)', animationDelay: `${i * 50}ms`, animation: 'gridMove 20s ease-in-out infinite'}}
              ></div>
            ))}
          </div>
        </div>

        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full particle"
            style={{backgroundColor: 'rgba(116, 36, 245, 0.3)', left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 8}s`, animationDuration: `${8 + Math.random() * 4}s`}}
          ></div>
        ))}

        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse glow-purple" style={{background: 'radial-gradient(circle, rgba(116, 36, 245, 0.2) 0%, rgba(88, 28, 217, 0.2) 100%)'}}></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse delay-1000 glow-purple" style={{background: 'radial-gradient(circle, rgba(88, 28, 217, 0.2) 0%, rgba(58, 20, 183, 0.2) 100%)'}}></div>
      </div>

      {/* Navigation */}
      <MainNavigation 
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        onGetStarted={() => {}}
        isHirePage={false}
        onBack={() => window.history.back()}
      />

      {/* Login Section */}
      <section className="pt-24 pb-20 px-4 md:pt-32 md:pb-16 md:px-6 relative z-10 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="glass-premium p-8 rounded-2xl border" style={{borderColor: '#3a14b7'}}>
            <h2 className="text-3xl font-bold text-center mb-6 text-glow">
              <span style={{background: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 30%, #7c3aed 60%, #6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>
                Admin Portal
              </span>
            </h2>
            <form>
              <div className="mb-4">
                <label htmlFor="email" className="block text-gray-300 text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-4 py-3 rounded-lg bg-black/30 border border-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-600 transition"
                  placeholder="Enter your email"
                />
              </div>
              <div className="mb-6">
                <label htmlFor="password" className="block text-gray-300 text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  id="password"
                  className="w-full px-4 py-3 rounded-lg bg-black/30 border border-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-600 transition"
                  placeholder="Enter your password"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 text-white glow-purple-intense"
                style={{background: 'linear-gradient(135deg, #7424f5 0%, #581cd9 100%)'}}
              >
                Login
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
