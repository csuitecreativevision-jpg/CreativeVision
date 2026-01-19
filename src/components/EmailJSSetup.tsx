import React from 'react';
import { Mail, Key, Settings, CheckCircle, AlertCircle } from 'lucide-react';

export default function EmailJSSetup() {
  return (
    <div className="max-w-4xl mx-auto p-8 glass-premium rounded-3xl border" style={{borderColor: '#3a14b7'}}>
      <div className="text-center mb-8">
        <Mail className="w-16 h-16 mx-auto mb-4" style={{color: '#7424f5'}} />
        <h2 className="text-3xl font-bold text-white mb-4">EmailJS Setup Required</h2>
        <p className="text-gray-300">To receive form submissions, you need to configure EmailJS with your credentials.</p>
      </div>

      <div className="space-y-6">
        <div className="glass-premium p-6 rounded-2xl border" style={{borderColor: '#3a14b7'}}>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{background: 'linear-gradient(135deg, #7424f5 0%, #581cd9 100%)'}}>
              <span className="text-white font-bold text-sm">1</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Create EmailJS Account</h3>
              <p className="text-gray-300 mb-3">
                Go to <a href="https://www.emailjs.com/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">emailjs.com</a> and create a free account.
              </p>
            </div>
          </div>
        </div>

        <div className="glass-premium p-6 rounded-2xl border" style={{borderColor: '#3a14b7'}}>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{background: 'linear-gradient(135deg, #7424f5 0%, #581cd9 100%)'}}>
              <span className="text-white font-bold text-sm">2</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Setup Email Service</h3>
              <p className="text-gray-300 mb-3">
                Connect your email service (Gmail, Outlook, etc.) in the EmailJS dashboard.
              </p>
            </div>
          </div>
        </div>

        <div className="glass-premium p-6 rounded-2xl border" style={{borderColor: '#3a14b7'}}>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{background: 'linear-gradient(135deg, #7424f5 0%, #581cd9 100%)'}}>
              <span className="text-white font-bold text-sm">3</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Create Email Template</h3>
              <p className="text-gray-300 mb-3">
                Create a template with the following variables:
              </p>
              <div className="bg-black bg-opacity-30 p-4 rounded-lg font-mono text-sm text-gray-200">
                <div>{'{{from_name}}'} - Applicant's name</div>
                <div>{'{{from_email}}'} - Applicant's email</div>
                <div>{'{{specialization}}'} - Applied position</div>
                <div>{'{{message}}'} - Application summary</div>
                <div>{'{{portfolio_link}}'} - Portfolio URL</div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-premium p-6 rounded-2xl border" style={{borderColor: '#3a14b7'}}>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{background: 'linear-gradient(135deg, #7424f5 0%, #581cd9 100%)'}}>
              <span className="text-white font-bold text-sm">4</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Update Configuration</h3>
              <p className="text-gray-300 mb-3">
                Replace the placeholder values in <code className="bg-black bg-opacity-30 px-2 py-1 rounded text-purple-300">src/services/emailService.ts</code>:
              </p>
              <div className="bg-black bg-opacity-30 p-4 rounded-lg font-mono text-sm text-gray-200">
                <div>EMAILJS_SERVICE_ID = 'your_service_id'</div>
                <div>EMAILJS_TEMPLATE_ID = 'your_template_id'</div>
                <div>EMAILJS_PUBLIC_KEY = 'your_public_key'</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 rounded-lg border border-yellow-500 bg-yellow-500 bg-opacity-10">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400" />
          <p className="text-yellow-200 text-sm">
            <strong>Important:</strong> Until you configure EmailJS, form submissions will only show in the browser console.
          </p>
        </div>
      </div>
    </div>
  );
}