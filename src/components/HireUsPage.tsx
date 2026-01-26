import { useState } from 'react';
import { Play, Check, Calendar } from 'lucide-react';
import MainNavigation from './MainNavigation';
import CountingNumber from './CountingNumber';
import Footer from './Footer';
import { SpotlightCard } from './ui/SpotlightCard';
import { MagneticButton } from './ui/MagneticButton';

interface HireUsPageProps {
  onBack: () => void;
}

export default function HireUsPage({ onBack }: HireUsPageProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);


  const portfolioItems = [
    {
      id: 1,
      title: "Tech Product Launch",
      category: "Promotional",
      thumbnail: "https://images.pexels.com/photos/4348404/pexels-photo-4348404.jpeg?auto=compress&cs=tinysrgb&w=600&h=800",
      duration: "2:30"
    },
    {
      id: 2,
      title: "Brand Story Documentary",
      category: "Long-Form",
      thumbnail: "https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=600&h=800",
      duration: "15:45"
    },
    {
      id: 3,
      title: "Social Media Campaign",
      category: "Short-Form",
      thumbnail: "https://images.pexels.com/photos/4348401/pexels-photo-4348401.jpeg?auto=compress&cs=tinysrgb&w=600&h=800",
      duration: "0:30"
    },
    {
      id: 4,
      title: "Corporate Training",
      category: "Educational",
      thumbnail: "https://images.pexels.com/photos/4348402/pexels-photo-4348402.jpeg?auto=compress&cs=tinysrgb&w=600&h=800",
      duration: "8:20"
    },
    {
      id: 5,
      title: "Event Highlights",
      category: "Event",
      thumbnail: "https://images.pexels.com/photos/4348406/pexels-photo-4348406.jpeg?auto=compress&cs=tinysrgb&w=600&h=800",
      duration: "5:15"
    },
    {
      id: 6,
      title: "Product Demo",
      category: "Commercial",
      thumbnail: "https://images.pexels.com/photos/4348407/pexels-photo-4348407.jpeg?auto=compress&cs=tinysrgb&w=600&h=800",
      duration: "3:45"
    },
    {
      id: 7,
      title: "Music Video",
      category: "Creative",
      thumbnail: "https://images.pexels.com/photos/3784424/pexels-photo-3784424.jpeg?auto=compress&cs=tinysrgb&w=600&h=800",
      duration: "4:12"
    },
    {
      id: 8,
      title: "Interview Series",
      category: "Documentary",
      thumbnail: "https://images.pexels.com/photos/3760263/pexels-photo-3760263.jpeg?auto=compress&cs=tinysrgb&w=600&h=800",
      duration: "12:30"
    }
  ];



  const packages = [
    {
      name: "Bronze Plan",
      price: 390,
      duration: "monthly",
      description: "Perfect for getting started with professional video editing",
      features: [
        "6 Videos",
        "6 Thumbnails",
        "Customized Editing Style",
        "Quick Turnarounds",
        "Unlimited Revisions"
      ],
      limitedFeatures: [
        "Content Curation",
        "Content Repurposing",
        "Access to Editing Style Inventory",
        "Limited Distribution System",
        "Limited Project Overview System"
      ],
      popular: false,
      color: "bronze",
      icon: "🟤"
    },
    {
      name: "Silver Plan",
      price: 780,
      duration: "monthly",
      originalPrice: 870,
      savings: "Save 10%",
      description: "Great value for growing content creators and small businesses",
      features: [
        "12 Videos",
        "12 Thumbnails",
        "Customized Editing Style",
        "Quick Turnarounds",
        "Unlimited revisions"
      ],
      limitedFeatures: [
        "Content Curation",
        "Content Repurposing",
        "Access to Editing Style Inventory",
        "Limited Distribution System",
        "Limited Project Overview System"
      ],
      popular: false,
      color: "silver",
      icon: "⚪"
    },
    {
      name: "Gold Plan",
      price: 1600,
      duration: "monthly",
      originalPrice: 1915,
      savings: "Save 15%",
      description: "Professional solution with advanced features and full support",
      features: [
        "25 Videos",
        "25 Thumbnails",
        "Customized Editing Style",
        "Quick Turnarounds",
        "Unlimited revisions",
        "Content Curation",
        "Content Repurposing",
        "Access to Editing Style Inventory",
        "Customized Distribution System",
        "Customized Project Overview System"
      ],
      limitedFeatures: [],
      popular: true,
      color: "gold",
      icon: "🟡"
    },
    {
      name: "Platinum Plan",
      price: 2900,
      duration: "monthly",
      originalPrice: 3660,
      savings: "Save 20%",
      description: "Ultimate package for serious content creators and enterprises",
      features: [
        "45 Videos",
        "45 Thumbnails",
        "Customized Editing Style",
        "Quick Turnarounds",
        "Unlimited Revisions",
        "Content Curation",
        "Content Repurposing",
        "Access to Editing Style Inventory",
        "Customized Distribution System",
        "Customized Project Overview System"
      ],
      limitedFeatures: [],
      popular: false,
      color: "platinum",
      icon: "🟣"
    }
  ];

  return (
    <div className="min-h-screen text-white relative">

      {/* Navigation */}
      <MainNavigation
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        onGetStarted={() => {
          const element = document.getElementById('pricing');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }}
        isHirePage={true}
        onBack={onBack}
      />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative z-10">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 animate-fade-in">
            <div className="w-2 h-2 rounded-full bg-custom-bright animate-pulse" />
            <span className="text-xs font-medium text-gray-300 tracking-wider uppercase">Premium Video Editing</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 md:mb-10 text-glow leading-[1.1]">
            Let's Create Something <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-custom-purple via-custom-bright to-white">
              Extraordinary.
            </span>
          </h1>

          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-12 leading-relaxed">
            Transform your vision into cinematic reality. From concept to completion, we deliver excellence at every frame.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <StatCard number={5000} suffix="+" label="Projects Completed" />
            <StatCard number={24} suffix="h" label="Avg Turnaround" />
            <StatCard number={98} suffix="%" label="Client Satisfaction" />
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section id="portfolio" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">Our Recent Work</h2>
            <p className="text-gray-400 text-lg">Professional edits that drive engagement.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {portfolioItems.map((item) => (
              <SpotlightCard key={item.id} className="group aspect-[9/16] rounded-2xl bg-black/40 border-white/10 p-0 overflow-hidden">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Play className="w-5 h-5 text-white fill-white" />
                </div>

                <div className="absolute bottom-4 left-4 right-4">
                  <div className="text-xs font-bold text-custom-bright mb-1 uppercase tracking-wider">{item.category}</div>
                  <div className="text-sm font-bold text-white">{item.duration}</div>
                </div>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">Pricing Plans</h2>
            <p className="text-gray-300">Choose the perfect plan for your needs.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map((pkg) => (
              <SpotlightCard
                key={pkg.name}
                className={`rounded-3xl p-8 flex flex-col h-full border-white/10 ${pkg.popular ? 'bg-custom-purple/10 border-custom-purple/30' : 'bg-black/20'}`}
                spotlightColor={pkg.popular ? "rgba(116, 36, 245, 0.4)" : "rgba(255, 255, 255, 0.1)"}
              >
                {pkg.popular && (
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-custom-purple/20 border border-custom-purple/50 text-xs font-bold text-custom-bright">
                    POPULAR
                  </div>
                )}

                <div className="mb-6">
                  <div className="text-4xl mb-4">{pkg.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-2">{pkg.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white">${pkg.price}</span>
                    <span className="text-sm text-gray-500">/{pkg.duration}</span>
                  </div>
                </div>

                <div className="space-y-3 mb-8 flex-grow">
                  {pkg.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <MagneticButton className="w-full">
                  <button className={`w-full py-3 rounded-xl font-bold transition-all ${pkg.popular
                    ? 'bg-custom-bright text-white hover:bg-custom-purple'
                    : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                    }`}>
                    Choose {pkg.name}
                  </button>
                </MagneticButton>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </section>

      {/* Booking CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <SpotlightCard className="p-12 rounded-3xl bg-gradient-to-br from-custom-purple/20 to-blue-900/20 border-white/10 text-center">
            <Calendar className="w-16 h-16 text-custom-bright mx-auto mb-6" />
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Ready to Scale?</h2>
            <p className="text-lg text-gray-300 mb-8 max-w-xl mx-auto">
              Book a free 30-minute consultation. No commitment, just value.
            </p>
            <MagneticButton className="inline-block">
              <a
                href="https://calendly.com/creativevision"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-gray-100 transition-colors"
              >
                <Calendar className="w-5 h-5" /> Book Consultation
              </a>
            </MagneticButton>
          </SpotlightCard>
        </div>
      </section>

      <Footer />
    </div>
  );
}

const StatCard = ({ number, suffix, label }: { number: number, suffix: string, label: string }) => (
  <div className="p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
    <div className="text-3xl font-bold text-white mb-1">
      <CountingNumber target={number} suffix={suffix} />
    </div>
    <div className="text-sm text-gray-400 uppercase tracking-widest">{label}</div>
  </div>
);