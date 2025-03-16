import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
const About_us = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white">
        
      {/* Enhanced Hero Section with Gradient */}
      <section className="bg-gradient-to-r from-blue-700 to-blue-500 text-white py-20">
      <div className="absolute inset-0 w-full h-full opacity-30">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none" className="absolute w-full h-full">
      <path fill="rgba(255, 255, 255, 0.3)" d="M0,64L48,80C96,96,192,128,288,128C384,128,480,96,576,106.7C672,117,768,171,864,197.3C960,224,1056,224,1152,202.7C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
    </svg>
  </div>
        <div className="container mx-auto px-6 md:px-12 lg:px-24 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-5xl font-bold mb-6">About SkillLink</h1>
            <p className="text-xl mb-8">Connecting talented professionals with the projects that need them most</p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-5 py-3 inline-flex items-center">
                <span className="font-bold text-2xl mr-2">50+</span>
                <span className="text-sm">Skilled Partners</span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-5 py-3 inline-flex items-center">
                <span className="font-bold text-2xl mr-2">10+</span>
                <span className="text-sm">Active Projects</span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-5 py-3 inline-flex items-center">
                <span className="font-bold text-2xl mr-2">24/7</span>
                <span className="text-sm">Client Support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Content with Enhanced Design and Better Margins */}
      <section className="py-20">
        <div className="container mx-auto px-6 md:px-12 lg:px-24">
          <div className="grid md:grid-cols-2 gap-16">
            <div>
              <div className="inline-block mb-6 bg-blue-100 text-blue-600 px-4 py-2 rounded-full text-sm font-semibold">Our Story</div>
              <h2 className="text-4xl font-bold mb-8 text-gray-800">Our Mission</h2>
              <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                At SkillLink, we believe that every project deserves the right talent, and every skilled professional deserves 
                meaningful work opportunities. Our platform bridges this gap by creating a seamless connection between 
                project needs and verified professional skills.
              </p>
              <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                Founded in 2025, SkillLink has grown to serve thousands of clients and professionals across the country. 
                Our commitment to quality, trust, and efficiency has made us a leading platform in the industry.
              </p>
              
              <div className="flex items-center mt-10">
                <div className="h-1 w-20 bg-blue-500 mr-4"></div>
                <blockquote className="italic text-gray-700 text-lg">"We're building a community where talent meets opportunity."</blockquote>
              </div>
            </div>
            <div>
              <Card className="shadow-xl border-blue-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50 rounded-full -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-blue-50 rounded-full -ml-10 -mb-10"></div>
                <CardContent className="p-8 relative z-10">
                  <h3 className="text-2xl font-bold mb-6 text-blue-600">Why Choose SkillLink?</h3>
                  <ul className="space-y-6">
                    <li className="flex items-start gap-4">
                      <div className="bg-blue-100 p-3 rounded-xl text-blue-600 mt-1 shadow-sm flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-lg">Verified Professionals</h4>
                        <p className="text-gray-600 mt-1">Every professional on our platform goes through a thorough vetting process</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="bg-blue-100 p-3 rounded-xl text-blue-600 mt-1 shadow-sm flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 6v6l4 2" />
                        </svg>
                      </div>
                      <div>
                      <h4 className="font-bold text-gray-800 text-lg">Easy Booking</h4>
                      <p className="text-gray-600 mt-1">Our streamlined booking system lets you instantly schedule professionals based on your project timeline and needs</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="bg-blue-100 p-3 rounded-xl text-blue-600 mt-1 shadow-sm flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-lg">Secure Platform</h4>
                        <p className="text-gray-600 mt-1">End-to-end encrypted communication and secure payment processing</p>
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-white to-blue-50">
      <div className="container mx-auto px-6 md:px-12 lg:px-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block mb-6 bg-blue-100 text-blue-600 px-4 py-2 rounded-full text-sm font-semibold">Our Values</div>
          <h2 className="text-4xl font-bold mb-6 text-gray-800">What We Stand For</h2>
          <p className="text-lg text-gray-600">Our core values guide everything we do at SkillLink, from how we build our platform to how we interact with our community.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-10">
          {/* Quality Card */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl opacity-75 blur-lg group-hover:opacity-100 transition duration-300"></div>
            <div className="relative bg-white rounded-2xl p-8 shadow-lg h-full transform transition duration-300 group-hover:-translate-y-2 border border-blue-100">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-full -mr-10 -mt-10 opacity-50"></div>
              
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl w-16 h-16 flex items-center justify-center text-white mb-6 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Quality</h3>
              <p className="text-gray-600 text-lg">We're committed to maintaining the highest standards of excellence in our platform and services.</p>
              
              <div className="mt-6 pt-6 border-t border-gray-100">
                <ul className="space-y-2">
                  <li className="flex items-center text-gray-600">
                    <svg className="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                    Thorough vetting process
                  </li>
                  <li className="flex items-center text-gray-600">
                    <svg className="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                    Rigorous testing
                  </li>
                  <li className="flex items-center text-gray-600">
                    <svg className="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                    Continuous improvement
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Trust Card */}
          <div className="relative group mt-10 md:mt-0">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl opacity-75 blur-lg group-hover:opacity-100 transition duration-300"></div>
            <div className="relative bg-white rounded-2xl p-8 shadow-lg h-full transform transition duration-300 group-hover:-translate-y-2 border border-blue-100">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-full -mr-10 -mt-10 opacity-50"></div>
              
              <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl w-16 h-16 flex items-center justify-center text-white mb-6 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Trust</h3>
              <p className="text-gray-600 text-lg">We build relationships based on transparency, reliability, and consistently delivering on our promises.</p>
              
              <div className="mt-6 pt-6 border-t border-gray-100">
                <ul className="space-y-2">
                  <li className="flex items-center text-gray-600">
                    <svg className="w-4 h-4 mr-2 text-indigo-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                    Transparent pricing
                  </li>
                  <li className="flex items-center text-gray-600">
                    <svg className="w-4 h-4 mr-2 text-indigo-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                    Secure transactions
                  </li>
                  <li className="flex items-center text-gray-600">
                    <svg className="w-4 h-4 mr-2 text-indigo-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                    Data protection
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Innovation Card */}
          <div className="relative group mt-10 md:mt-0">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl opacity-75 blur-lg group-hover:opacity-100 transition duration-300"></div>
            <div className="relative bg-white rounded-2xl p-8 shadow-lg h-full transform transition duration-300 group-hover:-translate-y-2 border border-blue-100">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-full -mr-10 -mt-10 opacity-50"></div>
              
              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl w-16 h-16 flex items-center justify-center text-white mb-6 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="2" x2="12" y2="6" />
                  <line x1="12" y1="18" x2="12" y2="22" />
                  <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                  <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                  <line x1="2" y1="12" x2="6" y2="12" />
                  <line x1="18" y1="12" x2="22" y2="12" />
                  <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                  <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                </svg>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Innovation</h3>
              <p className="text-gray-600 text-lg">We constantly seek new ways to improve and evolve, using technology to create better experiences.</p>
              
              <div className="mt-6 pt-6 border-t border-gray-100">
                <ul className="space-y-2">
                  <li className="flex items-center text-gray-600">
                    <svg className="w-4 h-4 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                    Forward-thinking solutions
                  </li>
                  <li className="flex items-center text-gray-600">
                    <svg className="w-4 h-4 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                    Responsive designs
                  </li>
                  <li className="flex items-center text-gray-600">
                    <svg className="w-4 h-4 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                    Cutting-edge technology
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-6 md:px-12 lg:px-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block mb-6 bg-blue-100 text-blue-600 px-4 py-2 rounded-full text-sm font-semibold">Meet The Team</div>
          <h2 className="text-4xl font-bold mb-6 text-gray-800">Our Leadership Team</h2>
          <p className="text-lg text-gray-600">The passionate individuals driving SkillLink's mission and vision forward</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
          {[
            {
              name: "Biraj Raya",
              position: "CEO & Founder",
              bio: "With a background in tech entrepreneurship, Biraj founded SkillLink to bridge the gap between skilled professionals and meaningful projects."
            },
            {
              name: "Sudeep Banjade",
              position: "CTO",
              bio: "Sudeep leads our technology initiatives, ensuring the platform delivers seamless experiences and cutting-edge solutions."
            },
            {
              name: "Mit Kotak",
              position: "Head of Operations",
              bio: "Mit oversees daily operations, focusing on quality assurance and continuous improvement of our service delivery."
            },
            {
              name: "Piyushkumar Vaghasiya",
              position: "Lead Developer",
              bio: "Piyush spearheads our development team, building robust and innovative features that power the SkillLink platform."
            }
          ].map((member, index) => (
            <div key={index} className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl opacity-75 blur-lg group-hover:opacity-100 transition duration-300 -mt-1"></div>
              <Card className="border-0 shadow-xl overflow-hidden group relative bg-white rounded-2xl transform transition duration-300 group-hover:-translate-y-2">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-white/20 to-white/5 rounded-t-2xl"></div>
                <div className="p-8 text-center relative z-10">
                  <div className="w-28 h-28 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg transform transition-transform duration-300 group-hover:scale-110 border-4 border-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-800 mb-1">{member.name}</h3>
                  <p className="text-blue-600 font-medium mb-4">{member.position}</p>
                  
                  <div className="w-16 h-1 bg-blue-100 mx-auto mb-4 rounded-full"></div>
                  
                  <p className="text-gray-600 leading-relaxed mb-6">{member.bio}</p>
          
                  
            
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>



      
      {/* Enhanced Call to Action with Better Margins */}
      <section className="bg-gradient-to-r from-blue-700 to-blue-500 py-16 text-white">
        <div className="container mx-auto px-6 md:px-12 lg:px-24 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to find the perfect professional for your project?</h2>
          <p className="text-xl max-w-2xl mx-auto mb-8">Join our growing community on SkillLink today</p>
          <div
      className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-50 transition-colors cursor-pointer shadow-lg"
      onClick={() => navigate("/register")}
    >
      Get Started Now
    </div>
        </div>
      </section>
    </div>
  );
};

export default About_us;