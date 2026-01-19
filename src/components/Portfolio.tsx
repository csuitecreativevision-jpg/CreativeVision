import React from 'react';
import { Eye, Play, Heart, Zap, Award, Star, Quote, ArrowRight } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

interface PortfolioProps {
  onGetStarted: () => void;
}

export default function Portfolio({ onGetStarted }: PortfolioProps) {
  const visibleSections = useScrollAnimation();

  return (
    <section id="portfolio" className="py-24 px-6 relative overflow-hidden" style={{backgroundColor: '#100024'}}>
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full opacity-20 blur-3xl animate-pulse glow-purple" style={{background: 'radial-gradient(circle, #7424f5 0%, #581cd9 100%)'}}></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full opacity-15 blur-3xl animate-pulse delay-1000 glow-purple" style={{background: 'radial-gradient(circle, #581cd9 0%, #3a14b7 100%)'}}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <div 
            id="portfolio-badge"
            data-animate
            className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full glass-premium shadow-cinematic hover:shadow-cinematic-lg hover-glow transition-all duration-300"
            style={{
              opacity: visibleSections.has('portfolio-badge') ? 1 : 0,
              transform: visibleSections.has('portfolio-badge') 
                ? 'translateY(0px)' 
                : 'translateY(30px)',
              transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <Eye className="w-4 h-4" style={{color: '#7424f5'}} />
            <span className="text-sm font-medium" style={{color: '#7424f5'}}>Our Portfolio</span>
          </div>
          
          <h2 
            id="portfolio-title"
            data-animate
            className="text-5xl md:text-6xl font-poppins font-bold text-white mb-8 text-glow"
            style={{
              opacity: visibleSections.has('portfolio-title') ? 1 : 0,
              transform: visibleSections.has('portfolio-title') 
                ? 'translateY(0px)' 
                : 'translateY(30px)',
              transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1) 200ms'
            }}
          >
            Cinematic
            <span style={{background: 'linear-gradient(135deg, #7424f5 0%, #581cd9 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}> Excellence</span>
          </h2>
          <p 
            id="portfolio-subtitle"
            data-animate
            className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
            style={{
              opacity: visibleSections.has('portfolio-subtitle') ? 1 : 0,
              transform: visibleSections.has('portfolio-subtitle') 
                ? 'translateY(0px)' 
                : 'translateY(30px)',
              transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1) 400ms'
            }}
          >
            Discover the magic we create through our premium video edits and the stories our clients tell about their transformative experiences.
          </p>
        </div>

        {/* Video Showcase Grid */}
        <div 
          id="portfolio-videos"
          data-animate
          className="grid md:grid-cols-3 gap-8 mb-20"
          style={{
            opacity: visibleSections.has('portfolio-videos') ? 1 : 0,
            transform: visibleSections.has('portfolio-videos') 
              ? 'translateY(0px)' 
              : 'translateY(30px)',
            transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1) 600ms'
          }}
        >
          {/* Video Edit 1 */}
          <div className="group relative rounded-3xl overflow-hidden glass-premium shadow-depth hover-glow transition-all duration-500 border" style={{borderColor: '#3a14b7'}}>
            <div className="aspect-video bg-gradient-to-br from-purple-900 to-indigo-900 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center glow-purple-intense group-hover:scale-110 transition-transform duration-300" style={{background: 'linear-gradient(135deg, #3a14b7 0%, #7424f5 100%)'}}>
                  <Play className="w-8 h-8 text-white ml-1" />
                </div>
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-60 group-hover:bg-opacity-40 transition-all duration-300"></div>
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black bg-opacity-80 backdrop-blur-sm text-xs font-semibold text-white shadow-lg">
                Short Form
              </div>
            </div>
          </div>

          {/* Video Edit 2 */}
          <div className="group relative rounded-3xl overflow-hidden glass-premium shadow-depth hover-glow transition-all duration-500 border" style={{borderColor: '#3a14b7'}}>
            <div className="aspect-video bg-gradient-to-br from-indigo-900 to-purple-900 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center glow-purple-intense group-hover:scale-110 transition-transform duration-300" style={{background: 'linear-gradient(135deg, #581cd9 0%, #7424f5 100%)'}}>
                  <Play className="w-8 h-8 text-white ml-1" />
                </div>
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-60 group-hover:bg-opacity-40 transition-all duration-300"></div>
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black bg-opacity-80 backdrop-blur-sm text-xs font-semibold text-white shadow-lg">
                Long Form
              </div>
            </div>
          </div>

          {/* Video Edit 3 */}
          <div className="group relative rounded-3xl overflow-hidden glass-premium shadow-depth hover-glow transition-all duration-500 border" style={{borderColor: '#3a14b7'}}>
            <div className="aspect-video bg-gradient-to-br from-purple-900 to-blue-900 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center glow-purple-intense group-hover:scale-110 transition-transform duration-300" style={{background: 'linear-gradient(135deg, #7424f5 0%, #3a14b7 100%)'}}>
                  <Play className="w-8 h-8 text-white ml-1" />
                </div>
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-60 group-hover:bg-opacity-40 transition-all duration-300"></div>
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black bg-opacity-80 backdrop-blur-sm text-xs font-semibold text-white shadow-lg">
                Commercial
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h3 
              id="testimonials-title"
              data-animate
              className="text-3xl md:text-4xl font-poppins font-bold text-white mb-4 text-glow"
              style={{
                opacity: visibleSections.has('testimonials-title') ? 1 : 0,
                transform: visibleSections.has('testimonials-title') 
                  ? 'translateY(0px)' 
                  : 'translateY(30px)',
                transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1) 800ms'
              }}
            >
              What Our Clients
              <span style={{background: 'linear-gradient(135deg, #7424f5 0%, #581cd9 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}> Say</span>
            </h3>
            <p 
              id="testimonials-subtitle"
              data-animate
              className="text-lg text-gray-300"
              style={{
                opacity: visibleSections.has('testimonials-subtitle') ? 1 : 0,
                transform: visibleSections.has('testimonials-subtitle') 
                  ? 'translateY(0px)' 
                  : 'translateY(30px)',
                transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1) 1000ms'
              }}
            >
              Real stories from creators who transformed their content with us
            </p>
          </div>

          <div 
            id="testimonials-grid"
            data-animate
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            style={{
              opacity: visibleSections.has('testimonials-grid') ? 1 : 0,
              transform: visibleSections.has('testimonials-grid') 
                ? 'translateY(0px)' 
                : 'translateY(30px)',
              transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1) 1200ms'
            }}
          >
            {/* Testimonial 1 */}
            <div className="group relative rounded-3xl p-8 glass-premium shadow-depth hover-glow transition-all duration-500 border" style={{borderColor: '#3a14b7'}}>
              <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full flex items-center justify-center glow-purple-intense" style={{background: 'linear-gradient(135deg, #7424f5 0%, #581cd9 100%)'}}>
                <Quote className="w-4 h-4 text-white" />
              </div>
              
              <div className="mb-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" style={{color: '#7424f5'}} />
                  ))}
                </div>
                <p className="text-gray-200 leading-relaxed mb-6">
                  "CreativeVision transformed my raw footage into a cinematic masterpiece. The attention to detail and creative vision exceeded all my expectations. My engagement skyrocketed!"
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full glow-purple" style={{background: 'linear-gradient(135deg, #3a14b7 0%, #7424f5 100%)'}}></div>
                <div>
                  <div className="font-poppins font-semibold text-white">Sarah Chen</div>
                  <div className="text-sm text-gray-300">Content Creator</div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="group relative rounded-3xl p-8 glass-premium shadow-depth hover-glow transition-all duration-500 border" style={{borderColor: '#3a14b7'}}>
              <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full flex items-center justify-center glow-purple-intense" style={{background: 'linear-gradient(135deg, #581cd9 0%, #7424f5 100%)'}}>
                <Quote className="w-4 h-4 text-white" />
              </div>
              
              <div className="mb-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" style={{color: '#7424f5'}} />
                  ))}
                </div>
                <p className="text-gray-200 leading-relaxed mb-6">
                  "The 24-hour turnaround is incredible! Professional quality editing delivered faster than I ever imagined possible. CreativeVision is now my go-to editing partner."
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full glow-purple" style={{background: 'linear-gradient(135deg, #7424f5 0%, #581cd9 100%)'}}></div>
                <div>
                  <div className="font-poppins font-semibold text-white">Marcus Rodriguez</div>
                  <div className="text-sm text-gray-300">YouTuber</div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="group relative rounded-3xl p-8 glass-premium shadow-depth hover-glow transition-all duration-500 border" style={{borderColor: '#3a14b7'}}>
              <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full flex items-center justify-center glow-purple-intense" style={{background: 'linear-gradient(135deg, #3a14b7 0%, #7424f5 100%)'}}>
                <Quote className="w-4 h-4 text-white" />
              </div>
              
              <div className="mb-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" style={{color: '#7424f5'}} />
                  ))}
                </div>
                <p className="text-gray-200 leading-relaxed mb-6">
                  "Working with CreativeVision elevated our brand's video content to a whole new level. The team's expertise in motion graphics and storytelling is unmatched."
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full glow-purple" style={{background: 'linear-gradient(135deg, #581cd9 0%, #3a14b7 100%)'}}></div>
                <div>
                  <div className="font-poppins font-semibold text-white">Emma Thompson</div>
                  <div className="text-sm text-gray-300">Brand Manager</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div 
          id="portfolio-cta"
          data-animate
          className="text-center"
          style={{
            opacity: visibleSections.has('portfolio-cta') ? 1 : 0,
            transform: visibleSections.has('portfolio-cta') 
              ? 'translateY(0px)' 
              : 'translateY(30px)',
            transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1) 1400ms'
          }}
        >
          <button 
            onClick={onGetStarted}
            className="group button-premium px-8 py-4 text-white font-poppins font-semibold rounded-full shadow-depth glow-purple-intense overflow-hidden" 
            style={{background: 'linear-gradient(135deg, #3a14b7 0%, #7424f5 100%)'}}
          >
            <span className="relative flex items-center gap-2">
              <Play className="w-5 h-5" />
              View Full Portfolio
            </span>
          </button>
        </div>
      </div>

      {/* Floating Decorative Elements */}
      <div className="absolute top-32 right-20 w-4 h-4 rounded-full float-animation glow-purple" style={{backgroundColor: '#7424f5'}}></div>
      <div className="absolute bottom-40 left-16 w-3 h-3 rounded-full float-rotate glow-purple-intense" style={{background: 'linear-gradient(135deg, #581cd9 0%, #7424f5 100%)'}}></div>
      <div className="absolute top-2/3 right-32 w-2 h-2 rounded-full float-animation delay-700 glow-purple" style={{backgroundColor: '#3a14b7'}}></div>
    </section>
  );
}