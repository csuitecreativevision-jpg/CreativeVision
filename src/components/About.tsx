import React from 'react';
import { Award, Play, Users } from 'lucide-react';
import CountingNumber from './CountingNumber';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

export default function About() {
  const visibleSections = useScrollAnimation();

  return (
    <section id="about" className="py-24 px-6" style={{backgroundColor: '#100024'}}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div 
            id="about-header"
            data-animate
            className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full glass-premium shadow-cinematic hover:shadow-cinematic-lg hover-glow transition-all duration-300"
            style={{
              opacity: visibleSections.has('about-header') ? 1 : 0,
              transform: visibleSections.has('about-header') 
                ? 'translateY(0px)' 
                : 'translateY(30px)',
              transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <Award className="w-4 h-4" style={{color: '#7424f5'}} />
            <span className="text-sm font-medium" style={{color: '#7424f5'}}>About Creative Vision</span>
          </div>
          
          <h2 
            id="about-title"
            data-animate
            className="text-5xl md:text-6xl font-poppins font-bold text-white mb-8 text-glow"
            style={{
              opacity: visibleSections.has('about-title') ? 1 : 0,
              transform: visibleSections.has('about-title') 
                ? 'translateY(0px)' 
                : 'translateY(30px)',
              transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1) 200ms'
            }}
          >
            Crafting Visual
            <span style={{background: 'linear-gradient(135deg, #7424f5 0%, #581cd9 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}> Stories</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div 
            id="about-content"
            data-animate
            className="space-y-6"
            style={{
              opacity: visibleSections.has('about-content') ? 1 : 0,
              transform: visibleSections.has('about-content') 
                ? 'translateY(0px)' 
                : 'translateY(30px)',
              transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1) 400ms'
            }}
          >
            <p className="text-lg text-gray-300 leading-relaxed">
              CreativeVision is a dedicated video editing agency that turns raw footage into engaging, professional-quality edits. Our mission is to bring stories to life with creativity and precision — whether short-form, long-form, or promotional content.
            </p>
            
            <p className="text-lg text-gray-300 leading-relaxed">
              With years of experience in the industry, we understand that every frame matters. Our team of skilled editors combines technical expertise with artistic vision to deliver content that not only meets but exceeds expectations.
            </p>

            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center">
                <div className="text-3xl font-poppins font-bold" style={{background: 'linear-gradient(135deg, #7424f5 0%, #581cd9 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>
                  <CountingNumber target={5000} suffix="+" />
                </div>
                <div className="text-sm text-gray-400 mt-1">Projects Completed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-poppins font-bold" style={{background: 'linear-gradient(135deg, #7424f5 0%, #581cd9 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>98%</div>
                <div className="text-sm text-gray-400 mt-1">Client Satisfaction</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-poppins font-bold" style={{background: 'linear-gradient(135deg, #7424f5 0%, #581cd9 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>
                  <CountingNumber target={24} suffix="h" />
                </div>
                <div className="text-sm text-gray-400 mt-1">Average Turnaround</div>
              </div>
            </div>
          </div>

          <div 
            id="about-features"
            data-animate
            className="relative"
            style={{
              opacity: visibleSections.has('about-features') ? 1 : 0,
              transform: visibleSections.has('about-features') 
                ? 'translateY(0px)' 
                : 'translateY(30px)',
              transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1) 600ms'
            }}
          >
            <div className="relative rounded-3xl p-8 glass-premium shadow-depth hover-glow transition-all duration-500 border" style={{borderColor: '#3a14b7'}}>
              <div className="absolute inset-0 rounded-3xl" style={{background: 'linear-gradient(135deg, rgba(58, 20, 183, 0.2) 0%, rgba(116, 36, 245, 0.1) 100%)'}}></div>
              <div className="relative space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center glow-purple" style={{background: 'linear-gradient(135deg, #3a14b7 0%, #7424f5 100%)'}}>
                    <Play className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-poppins font-semibold text-white">Premium Quality</h3>
                    <p className="text-sm text-gray-200">Cinema-grade editing standards</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center glow-purple" style={{background: 'linear-gradient(135deg, #3a14b7 0%, #7424f5 100%)'}}>
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-poppins font-semibold text-white">Expert Team</h3>
                    <p className="text-sm text-gray-200">Skilled professionals with industry experience</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center glow-purple" style={{background: 'linear-gradient(135deg, #3a14b7 0%, #7424f5 100%)'}}>
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-poppins font-semibold text-white">Fast Delivery</h3>
                    <p className="text-sm text-gray-200">Quick turnaround without compromising quality</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating decoration */}
            <div className="absolute -top-6 -right-6 w-12 h-12 rounded-full float-animation glow-purple-intense" style={{background: 'linear-gradient(135deg, #7424f5 0%, #581cd9 100%)'}}></div>
            <div className="absolute -bottom-4 -left-4 w-8 h-8 rounded-full float-rotate glow-purple" style={{background: 'linear-gradient(135deg, #581cd9 0%, #7424f5 100%)'}}></div>
          </div>
        </div>
      </div>
    </section>
  );
}