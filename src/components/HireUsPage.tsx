import React from 'react';
import { Play, Star, Check, Calendar, Users, Clock, Award } from 'lucide-react';
import MainNavigation from './MainNavigation';
import CountingNumber from './CountingNumber';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

interface HireUsPageProps {
  onBack: () => void;
}

export default function HireUsPage({ onBack }: HireUsPageProps) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const visibleSections = useScrollAnimation();

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

  const testimonials = [
    {
      id: 1,
      name: "Sarah Johnson",
      title: "Marketing Director, TechFlow",
      content: "Creative Vision transformed our raw footage into a compelling brand story. Their attention to detail and quick turnaround exceeded our expectations.",
      rating: 5,
      avatar: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150"
    },
    {
      id: 2,
      name: "Michael Chen",
      title: "CEO, StartupX",
      content: "The team delivered exceptional quality edits for our product launch. The cinematic quality and professional polish helped us secure major partnerships.",
      rating: 5,
      avatar: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150"
    },
    {
      id: 3,
      name: "Emily Rodriguez",
      title: "Content Creator",
      content: "Working with Creative Vision has been a game-changer for my content. They understand my vision and consistently deliver beyond expectations.",
      rating: 5,
      avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150"
    },
    {
      id: 4,
      name: "David Thompson",
      title: "Event Coordinator, EventPro",
      content: "Their event highlight reels capture the energy and emotion perfectly. Our clients are always thrilled with the final results.",
      rating: 5,
      avatar: "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150"
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
      <section className="pt-24 pb-20 px-4 md:pt-32 md:pb-16 md:px-6 relative z-10">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-8 md:mb-6 text-glow">
            <span className="block text-3xl md:text-7xl">Let's Create Something</span>
            <span className="block text-3xl md:text-7xl" style={{background: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 30%, #7c3aed 60%, #6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>
              Extraordinary
            </span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto mb-10 md:mb-8 leading-relaxed">
            Transform your vision into cinematic reality with our premium video editing services. 
            From concept to completion, we deliver excellence at every frame.
          </p>
          <div className="flex flex-wrap justify-center gap-6 md:gap-8 text-center">
            <div className="glass-premium p-6 rounded-2xl">
              <div className="text-3xl font-bold mb-2" style={{background: 'linear-gradient(135deg, #7424f5 0%, #581cd9 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>
                <CountingNumber target={5000} suffix="+" />
              </div>
              <p className="text-gray-300 text-sm md:text-base">Projects Completed</p>
            </div>
            <div className="glass-premium p-6 rounded-2xl">
              <div className="text-3xl font-bold mb-2" style={{background: 'linear-gradient(135deg, #7424f5 0%, #581cd9 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>
                <CountingNumber target={24} />h
              </div>
              <p className="text-gray-300 text-sm md:text-base">Average Turnaround</p>
            </div>
            <div className="glass-premium p-6 rounded-2xl">
              <div className="text-3xl font-bold mb-2" style={{background: 'linear-gradient(135deg, #7424f5 0%, #581cd9 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>
                <CountingNumber target={98} suffix="%" />
              </div>
              <p className="text-gray-300 text-sm md:text-base">Client Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section id="portfolio" className="py-24 px-6 relative overflow-hidden" style={{backgroundColor: '#100024'}}>
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full opacity-20 blur-3xl animate-pulse glow-purple" style={{background: 'radial-gradient(circle, #7424f5 0%, #581cd9 100%)'}}></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full opacity-15 blur-3xl animate-pulse delay-1000 glow-purple" style={{background: 'radial-gradient(circle, #581cd9 0%, #3a14b7 100%)'}}></div>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Simple Header */}
          <div className="text-center mb-20">
            <div 
              id="hire-portfolio-badge"
              data-animate
              className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full glass-premium shadow-cinematic hover:shadow-cinematic-lg hover-glow transition-all duration-300"
              style={{
                opacity: visibleSections.has('hire-portfolio-badge') ? 1 : 0,
                transform: visibleSections.has('hire-portfolio-badge') 
                  ? 'translateY(0px)' 
                  : 'translateY(30px)',
                transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <span className="text-sm font-medium" style={{color: '#7424f5'}}>Portfolio</span>
            </div>
            <h2 
              id="hire-portfolio-title"
              data-animate
              className="text-5xl md:text-6xl font-poppins font-bold text-white mb-8 text-glow"
              style={{
                opacity: visibleSections.has('hire-portfolio-title') ? 1 : 0,
                transform: visibleSections.has('hire-portfolio-title') 
                  ? 'translateY(0px)' 
                  : 'translateY(30px)',
                transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1) 200ms'
              }}
            >
              Our Recent Work
            </h2>
            <p 
              id="hire-portfolio-subtitle"
              data-animate
              className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
              style={{
                opacity: visibleSections.has('hire-portfolio-subtitle') ? 1 : 0,
                transform: visibleSections.has('hire-portfolio-subtitle') 
                  ? 'translateY(0px)' 
                  : 'translateY(30px)',
                transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1) 400ms'
              }}
            >
              Professional portrait video editing that transforms your content into engaging visual stories
            </p>
          </div>

          {/* Video Specs */}
          <div 
            id="hire-video-specs"
            data-animate
            className="glass-premium p-6 rounded-2xl mb-12 max-w-4xl mx-auto border"
            style={{
              borderColor: '#3a14b7',
              opacity: visibleSections.has('hire-video-specs') ? 1 : 0,
              transform: visibleSections.has('hire-video-specs') 
                ? 'translateY(0px)' 
                : 'translateY(30px)',
              transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1) 600ms'
            }}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center glow-purple" style={{background: 'linear-gradient(135deg, #3a14b7 0%, #7424f5 100%)'}}>
                  <span className="text-lg font-bold text-white">9:16</span>
                </div>
                <p className="text-gray-200 text-sm font-medium">Portrait Format</p>
              </div>
              <div>
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center glow-purple" style={{background: 'linear-gradient(135deg, #3a14b7 0%, #7424f5 100%)'}}>
                  <span className="text-lg font-bold text-white">4K</span>
                </div>
                <p className="text-gray-200 text-sm font-medium">Ultra HD Quality</p>
              </div>
              <div>
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center glow-purple" style={{background: 'linear-gradient(135deg, #3a14b7 0%, #7424f5 100%)'}}>
                  <span className="text-lg font-bold text-white">60</span>
                </div>
                <p className="text-gray-200 text-sm font-medium">Smooth Motion</p>
              </div>
              <div>
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center glow-purple" style={{background: 'linear-gradient(135deg, #3a14b7 0%, #7424f5 100%)'}}>
                  <span className="text-lg font-bold text-white">HDR</span>
                </div>
                <p className="text-gray-200 text-sm font-medium">Rich Colors</p>
              </div>
            </div>
          </div>

          {/* Compact Portfolio Grid */}
          <div className="max-w-5xl mx-auto">
            <div 
              id="hire-portfolio-grid"
              data-animate
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
              style={{
                opacity: visibleSections.has('hire-portfolio-grid') ? 1 : 0,
                transform: visibleSections.has('hire-portfolio-grid') 
                  ? 'translateY(0px)' 
                  : 'translateY(30px)',
                transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1) 800ms'
              }}
            >
            {portfolioItems.map((item, index) => (
              <div
                key={item.id}
                className="group cursor-pointer"
              >
                <div className="aspect-[9/16] relative overflow-hidden rounded-2xl">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-300" />
                  
                  {/* Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center group-hover:scale-110 transition-all duration-300 glow-purple-intense" style={{background: 'linear-gradient(135deg, #3a14b7 0%, #7424f5 100%)'}}>
                      <Play className="w-6 h-6 text-white ml-0.5 drop-shadow-lg" />
                    </div>
                  </div>
                  
                  {/* Category Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-lg bg-black bg-opacity-80 backdrop-blur-sm border border-white border-opacity-20">
                      {item.category}
                    </span>
                  </div>
                  
                  {/* Duration */}
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1.5 bg-black bg-opacity-90 backdrop-blur-md rounded-full text-xs font-bold text-white shadow-lg border border-white border-opacity-10">
                      {item.duration}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>

        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 px-6 relative z-10">
        <div className="max-w-full mx-auto">
          {/* Simple Header */}
          <div className="text-center mb-20 max-w-7xl mx-auto px-6">
            <div 
              id="hire-testimonials-badge"
              data-animate
              className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full glass-premium shadow-cinematic hover:shadow-cinematic-lg hover-glow transition-all duration-300"
              style={{
                opacity: visibleSections.has('hire-testimonials-badge') ? 1 : 0,
                transform: visibleSections.has('hire-testimonials-badge') 
                  ? 'translateY(0px)' 
                  : 'translateY(30px)',
                transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <span className="text-sm font-medium" style={{color: '#7424f5'}}>Testimonials</span>
            </div>
            <h2 
              id="hire-testimonials-title"
              data-animate
              className="text-5xl md:text-6xl font-poppins font-bold text-white mb-8 text-glow"
              style={{
                opacity: visibleSections.has('hire-testimonials-title') ? 1 : 0,
                transform: visibleSections.has('hire-testimonials-title') 
                  ? 'translateY(0px)' 
                  : 'translateY(30px)',
                transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1) 200ms'
              }}
            >
              What Our Clients Say
            </h2>
            <p 
              id="hire-testimonials-subtitle"
              data-animate
              className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
              style={{
                opacity: visibleSections.has('hire-testimonials-subtitle') ? 1 : 0,
                transform: visibleSections.has('hire-testimonials-subtitle') 
                  ? 'translateY(0px)' 
                  : 'translateY(30px)',
                transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1) 400ms'
              }}
            >
              Real stories from creators who've experienced the Creative Vision difference
            </p>
          </div>

          {/* Auto-sliding Testimonial Carousel */}
          <div 
            id="hire-testimonials-carousel"
            data-animate
            className="relative overflow-hidden -mx-6"
            style={{
              opacity: visibleSections.has('hire-testimonials-carousel') ? 1 : 0,
              transform: visibleSections.has('hire-testimonials-carousel') 
                ? 'translateY(0px)' 
                : 'translateY(30px)',
              transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1) 600ms'
            }}
          >
            <div className="flex animate-slide-left">
              {/* Duplicate testimonials for seamless loop */}
              {[...testimonials, ...testimonials].map((testimonial, index) => (
                <div
                  key={`${testimonial.id}-${index}`}
                  className="flex-shrink-0 w-96 mx-4 first:ml-6"
                >
                  <div className="glass-premium p-6 rounded-2xl hover-glow group relative overflow-hidden h-full">
                    {/* Star Rating */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <span className="text-yellow-400 font-semibold text-sm">{testimonial.rating}.0</span>
                    </div>
                    
                    {/* Testimonial Content */}
                    <blockquote className="text-gray-200 mb-6 leading-relaxed italic text-sm">
                      "{testimonial.content}"
                    </blockquote>
                    
                    {/* Client Info */}
                    <div className="flex items-center gap-4">
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        className="w-12 h-12 rounded-full object-cover border-2 glow-purple" style={{borderColor: '#3a14b7'}}
                      />
                      <div>
                        <h4 className="text-white font-semibold text-sm">{testimonial.name}</h4>
                        <p className="text-xs text-gray-300">{testimonial.title}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Packages Section */}
      <section id="pricing" className="py-24 px-6 relative z-10 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full opacity-20 blur-3xl animate-pulse glow-purple" style={{background: 'radial-gradient(circle, #7424f5 0%, #581cd9 100%)'}}></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full opacity-15 blur-3xl animate-pulse delay-1000 glow-purple" style={{background: 'radial-gradient(circle, #581cd9 0%, #3a14b7 100%)'}}></div>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Simple Header */}
          <div className="text-center mb-20">
            <h2 
              id="hire-pricing-title"
              data-animate
              className="text-5xl md:text-6xl font-poppins font-bold text-white mb-8 text-glow"
              style={{
                opacity: visibleSections.has('hire-pricing-title') ? 1 : 0,
                transform: visibleSections.has('hire-pricing-title') 
                  ? 'translateY(0px)' 
                  : 'translateY(30px)',
                transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              Pricing Plans
            </h2>
            <p 
              id="hire-pricing-subtitle"
              data-animate
              className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
              style={{
                opacity: visibleSections.has('hire-pricing-subtitle') ? 1 : 0,
                transform: visibleSections.has('hire-pricing-subtitle') 
                  ? 'translateY(0px)' 
                  : 'translateY(30px)',
                transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1) 200ms'
              }}
            >
              Choose the perfect plan for your content creation needs
            </p>
          </div>

          {/* Compact Grid Layout */}
          <div className="max-w-6xl mx-auto mt-8">
            <div 
              id="hire-pricing-grid"
              data-animate
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
              style={{
                opacity: visibleSections.has('hire-pricing-grid') ? 1 : 0,
                transform: visibleSections.has('hire-pricing-grid') 
                  ? 'translateY(0px)' 
                  : 'translateY(30px)',
                transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1) 400ms'
              }}
            >
            {packages.map((pkg, index) => {
              return (
                <div
                  key={pkg.name}
                  className={`relative ${pkg.popular ? 'transform scale-105 z-10' : ''}`}
                >
                  <div className={`glass-premium p-6 rounded-2xl h-full ${
                    pkg.popular ? 'border-2 shadow-lg glow-purple-intense' : 'border' 
                  }`} style={{borderColor: pkg.popular ? '#7424f5' : '#3a14b7'}}>
                    
                    {/* Popular Badge */}
                    {pkg.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <div className="px-4 py-1 rounded-full" style={{background: 'linear-gradient(135deg, #7424f5 0%, #581cd9 100%)'}}>
                          <span className="text-white font-semibold text-xs">MOST POPULAR</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Savings Badge */}
                    {pkg.savings && (
                      <div className="absolute -top-2 -right-2">
                        <div className="px-3 py-1 rounded-full" style={{background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'}}>
                          <span className="text-white font-semibold text-xs">{pkg.savings}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Header */}
                    <div className="text-center mb-4">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <span className="text-xl">{pkg.icon}</span>
                        <h3 className="text-xl font-bold text-white">{pkg.name}</h3>
                      </div>
                      
                      <div className="mb-3">
                        <div className="text-3xl font-bold text-white mb-1">
                          ${pkg.price.toLocaleString()}
                        </div>
                        <span className="text-gray-300">/{pkg.duration}</span>
                        
                        {pkg.originalPrice && (
                          <div className="mt-1">
                            <span className="text-gray-400 text-xs line-through">
                              ${pkg.originalPrice.toLocaleString()}/mo
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-2 mb-4">
                      {pkg.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-green-400" />
                          </div>
                          <span className="text-gray-200">{feature}</span>
                        </div>
                      ))}
                      
                      {pkg.limitedFeatures && pkg.limitedFeatures.map((feature, i) => (
                        <div key={`limited-${i}`} className="flex items-center gap-2 text-sm">
                          <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                            {feature.includes('Limited') ? (
                              <span className="text-yellow-400 text-xs">⚠️</span>
                            ) : (
                              <span className="text-red-400 text-xs">❌</span>
                            )}
                          </div>
                          <span className="text-gray-200">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA Button */}
                    <button className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                      pkg.popular 
                        ? 'text-white glow-purple-intense' 
                        : 'text-white glass-premium border'
                    }`} style={{
                      background: pkg.popular ? 'linear-gradient(135deg, #7424f5 0%, #581cd9 100%)' : 'transparent',
                      borderColor: pkg.popular ? 'transparent' : '#3a14b7'
                    }}>
                     Book a Call
                    </button>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        </div>
      </section>

      {/* Booking Section */}
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div 
            id="hire-booking-section"
            data-animate
            className="glass-premium p-12 rounded-3xl glow-purple-intense border"
            style={{
              borderColor: '#3a14b7',
              opacity: visibleSections.has('hire-booking-section') ? 1 : 0,
              transform: visibleSections.has('hire-booking-section') 
                ? 'translateY(0px)' 
                : 'translateY(30px)',
              transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1) 600ms'
            }}
          >
            <Calendar className="w-16 h-16 mx-auto mb-6 icon-pulse" style={{color: '#7424f5'}} />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto">
              Book a free consultation call with our team to discuss your project requirements, 
              timeline, and how we can bring your vision to life.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="flex items-center justify-center gap-3 text-gray-200">
                <Users className="w-5 h-5" style={{color: '#7424f5'}} />
                <span>Free Consultation</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-gray-200">
                <Clock className="w-5 h-5" style={{color: '#7424f5'}} />
                <span>30-Minute Call</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-gray-200">
                <Award className="w-5 h-5" style={{color: '#7424f5'}} />
                <span>Free Trial Edit</span>
              </div>
            </div>

            <a
              href="https://calendly.com/creativevision"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 button-premium py-3 px-6 rounded-xl font-semibold transition-all duration-300 text-white shadow-depth glow-purple-intense overflow-hidden" style={{background: 'linear-gradient(135deg, #3a14b7 0%, #7424f5 100%)'}}
            >
              <span className="relative flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Book a Call With Us
              </span>
            </a>
            
            <p className="text-gray-300 text-sm mt-4">
              No commitment required - let's discuss your vision
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t relative z-10 mt-8" style={{borderColor: 'rgba(116, 36, 245, 0.3)'}}>
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img 
              src="/Untitled design (3).png" 
              alt="CreativeVision Logo" 
              className="h-8 w-auto"
            />
            <span className="text-2xl font-poppins font-bold text-glow" style={{background: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 30%, #7c3aed 60%, #6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>
              CreativeVision
            </span>
          </div>
          <p className="text-gray-200 font-medium mb-1">
            © 2025 CreativeVision. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}