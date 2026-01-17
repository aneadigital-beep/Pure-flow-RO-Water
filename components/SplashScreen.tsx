
import React from 'react';

const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[999] bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 flex flex-col items-center justify-center text-white overflow-hidden">
      {/* Background Decorative Circles */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-700">
        {/* Animated Droplet Logo */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full scale-150 animate-pulse"></div>
          <div className="h-28 w-28 bg-white rounded-[2rem] flex items-center justify-center shadow-2xl transform rotate-12 animate-bounce transition-transform duration-1000">
            <i className="fas fa-droplet text-5xl text-blue-600 -rotate-12"></i>
          </div>
        </div>

        {/* Brand Name */}
        <h1 className="text-5xl font-black tracking-tighter mb-2 drop-shadow-lg">
          Pure<span className="text-blue-200">Flow</span>
        </h1>
        
        {/* Tagline */}
        <p className="text-blue-100 font-medium tracking-wide italic opacity-90 animate-in slide-in-from-bottom-4 duration-1000 delay-300">
          "Bringing water to your doorstep"
        </p>

        {/* Loading Indicator */}
        <div className="mt-12 w-48 h-1 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full animate-[loading_2s_ease-in-out_infinite]"></div>
        </div>
      </div>

      {/* Wave Decoration at bottom */}
      <div className="absolute bottom-0 left-0 w-full leading-[0]">
        <svg className="relative block w-full h-24" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35c63.59,10,122.14,13.11,184.19,5.47C223,28.7,263.3,42.55,321.39,56.44Z" className="fill-white/10"></path>
        </svg>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
};

export default SplashScreen;
