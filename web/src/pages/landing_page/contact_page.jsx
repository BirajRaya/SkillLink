import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const Contact_page = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
 
<section className="bg-blue-600 text-white py-20 relative overflow-hidden">

  <div className="absolute inset-0 w-full h-full opacity-30">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none" className="absolute w-full h-full">
      <path fill="rgba(255, 255, 255, 0.3)" d="M0,64L48,80C96,96,192,128,288,128C384,128,480,96,576,106.7C672,117,768,171,864,197.3C960,224,1056,224,1152,202.7C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
    </svg>
  </div>

  <div className="container mx-auto px-6 md:px-12 lg:px-24 text-center relative z-10">
    {/* Your existing content */}
    <div className="max-w-3xl mx-auto">
      <h1 className="text-5xl font-bold mb-6">Contact Us</h1>
      <p className="text-xl mb-8">Get in touch with our team for any inquiries or support</p>
      <div className="flex flex-wrap justify-center gap-4">
        <div className="bg-white/20 backdrop-blur-sm rounded-lg px-5 py-3 inline-flex items-center">
          <span className="font-bold text-2xl mr-2">24/7</span>
          <span className="text-sm">Customer Support</span>
        </div>
        <div className="bg-white/20 backdrop-blur-sm rounded-lg px-5 py-3 inline-flex items-center">
          <span className="font-bold text-2xl mr-2">1hr</span>
          <span className="text-sm">Response Time</span>
        </div>
        <div className="bg-white/20 backdrop-blur-sm rounded-lg px-5 py-3 inline-flex items-center">
          <span className="font-bold text-2xl mr-2">100%</span>
          <span className="text-sm">Satisfaction</span>
        </div>
      </div>
    </div>
  </div>
</section>

      {/* Contact Information */}
      <section className="py-20">
        <div className="container mx-auto px-6 md:px-12 lg:px-24">
          <div className="grid md:grid-cols-2 gap-16">
            <div>
              <div className="inline-block mb-6 bg-blue-100 text-blue-600 px-4 py-2 rounded-full text-sm font-semibold">Get In Touch</div>
              <h2 className="text-4xl font-bold mb-8 text-gray-800">Reach Out To Us</h2>
              <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                Have questions about our services? Want to learn more about how SkillLink can help with your projects? 
                Our team is here to assist you. Reach out through any of the following channels:
              </p>
              
              <div className="space-y-8">
                <div className="flex items-start gap-6">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl text-white shadow-lg flex-shrink-0 transform transition-transform duration-300 hover:scale-110">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Phone</h3>
                    <p className="text-gray-600 text-lg font-medium">+1 (555) 123-4567</p>
                    <p className="text-gray-500 mt-1">Monday - Friday: 9AM - 6PM EST</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-6">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl text-white shadow-lg flex-shrink-0 transform transition-transform duration-300 hover:scale-110">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Email</h3>
                    <p className="text-gray-600 text-lg font-medium">info@skilllink.com</p>
                    <p className="text-gray-500 mt-1">For general inquiries</p>
                    <p className="text-gray-600 text-lg font-medium mt-2">support@skilllink.com</p>
                    <p className="text-gray-500 mt-1">For technical assistance</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-6">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl text-white shadow-lg flex-shrink-0 transform transition-transform duration-300 hover:scale-110">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Office Address</h3>
                    <p className="text-gray-600 text-lg font-medium">123 Main Street, Suite 100</p>
                    <p className="text-gray-600">Mississauga, CA 94103</p>
                    <p className="text-gray-500 mt-1">Canada</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-12 pt-8 border-t border-gray-200">
  <h3 className="text-2xl font-bold mb-6 text-gray-800">Connect With Us</h3>
  <div className="flex gap-5">
    <a href="https://www.facebook.com/login" target="_blank" className="group" rel="noopener noreferrer">
      <div className="bg-blue-50 group-hover:bg-blue-100 p-4 rounded-xl text-blue-600 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      </div>
      <p className="text-xs text-center mt-2 text-gray-500 font-medium">Facebook</p>
    </a>
    
    <a href="https://twitter.com/login" target="_blank" className="group" rel="noopener noreferrer">
      <div className="bg-blue-50 group-hover:bg-blue-100 p-4 rounded-xl text-blue-600 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
        </svg>
      </div>
      <p className="text-xs text-center mt-2 text-gray-500 font-medium">Twitter</p>
    </a>

    <a href="https://www.linkedin.com/login" target="_blank" className="group" rel="noopener noreferrer">
      <div className="bg-blue-50 group-hover:bg-blue-100 p-4 rounded-xl text-blue-600 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
          <rect x="2" y="9" width="4" height="12" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      </div>
      <p className="text-xs text-center mt-2 text-gray-500 font-medium">LinkedIn</p>
    </a>

    <a href="https://www.instagram.com/accounts/login/" target="_blank" className="group" rel="noopener noreferrer">
      <div className="bg-blue-50 group-hover:bg-blue-100 p-4 rounded-xl text-blue-600 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      </div>
      <p className="text-xs text-center mt-2 text-gray-500 font-medium">Instagram</p>
    </a>
  </div>
</div>
    
            </div>
            
            <div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl opacity-75 blur-lg"></div>
                <Card className="relative shadow-xl border-blue-100 bg-white rounded-2xl overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50 rounded-full -mr-20 -mt-20 opacity-30"></div>
                  <div className="absolute bottom-0 left-0 w-20 h-20 bg-blue-50 rounded-full -ml-10 -mb-10 opacity-30"></div>
                  <CardContent className="p-8 relative z-10">
                    <h3 className="text-2xl font-bold mb-6 text-blue-600">Office Hours</h3>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between pb-3 border-b border-gray-200">
                        <span className="font-medium text-gray-800">Monday - Friday</span>
                        <span className="text-gray-600">9:00 AM - 6:00 PM</span>
                      </div>
                      <div className="flex justify-between pb-3 border-b border-gray-200">
                        <span className="font-medium text-gray-800">Saturday</span>
                        <span className="text-gray-600">10:00 AM - 4:00 PM</span>
                      </div>
                      <div className="flex justify-between pb-3 border-b border-gray-200">
                        <span className="font-medium text-gray-800">Sunday</span>
                        <span className="text-gray-600">Closed</span>
                      </div>
                    </div>
                    
                    <div className="mt-10">
  <h3 className="text-xl font-bold mb-6 text-gray-800">Frequently Asked Questions</h3>
  <div className="space-y-5">
    <div className="p-5 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
      <h4 className="font-bold text-gray-800 mb-2">How does the booking process work?</h4>
      <p className="text-gray-600">Simply browse available professionals, select one that matches your needs, and book them directly through our platform by selecting your preferred date and time.</p>
    </div>
    <div className="p-5 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
      <h4 className="font-bold text-gray-800 mb-2">How quickly will vendors respond to my booking?</h4>
      <p className="text-gray-600">Most vendors respond to booking requests within 2-4 hours. You'll receive a notification once your booking is confirmed.</p>
    </div>
    <div className="p-5 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
      <h4 className="font-bold text-gray-800 mb-2">Can I reschedule or cancel a booking?</h4>
      <p className="text-gray-600">Yes, you can reschedule or cancel bookings service without any fee. Changes made with less notice may incur a small fee.</p>
    </div>
  </div>
</div>
                    
                    <div className="mt-10 pt-6 border-t border-gray-200">
                      <div className="bg-blue-50 p-6 rounded-xl">
                        <h4 className="text-lg font-bold text-gray-800 mb-3">Need Immediate Assistance?</h4>
                        <p className="text-gray-600 mb-4">Our support team is always ready to help you with any questions, and we will contact you back as soon as possible.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      
      {/* Call to Action */}
      <section className="bg-gradient-to-r from-blue-700 to-blue-500 py-16 text-white">
        <div className="container mx-auto px-6 md:px-12 lg:px-24 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to connect with SkillLink?</h2>
          <p className="text-xl max-w-2xl mx-auto mb-8">Join our growing community of professionals and clients today</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/register" className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-50 transition-colors cursor-pointer shadow-lg">
              Sign Up Now
            </a>
            <a href="/about" className="inline-block bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white/10 transition-colors cursor-pointer">
              Learn More
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact_page;