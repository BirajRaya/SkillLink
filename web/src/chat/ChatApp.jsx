import { useState, useEffect, useCallback } from "react";
import ContactList from "./ContactList";
import ChatWindow from "./ChatWindow";
import { useAuth } from '../utils/AuthContext';
import { io } from "socket.io-client";
import { ChevronLeft } from "lucide-react"; // Import ChevronLeft icon for back button

const socket = io("http://localhost:5000");

export default function ChatApp() {
  const { currentUser } = useAuth();
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobileView, setIsMobileView] = useState(false);

  // Detect mobile view
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    // Set initial value
    checkMobileView();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkMobileView);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobileView);
  }, []);

  // Simulate initial loading
  useEffect(() => {
    // Set loading to false after a brief delay to ensure UI components have time to initialize
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Add this new function to handle contact selection with optimization
  const handleContactSelect = useCallback((contact) => {
    // Only update state if selecting a different contact
    if (!selectedUser || selectedUser.id !== contact.id) {
      setSelectedUser(contact);
    }
  }, [selectedUser]);
  
  const handleBackToContacts = useCallback(() => {
    setSelectedUser(null);
  }, []);
  
  // Handle Socket.io connections
  useEffect(() => {
    if (!currentUser?.id) return;

    // Join socket room for this user
    socket.emit("joinChat", currentUser.id);

    return () => {
      // Cleanup if needed
    };
  }, [currentUser]);

  // If still in initial loading state, show app skeleton
  if (loading) {
    return (
      <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)] w-full bg-gray-100 dark:bg-gray-900">
        <div className="w-full md:w-1/4 border-r dark:border-gray-700 animate-pulse">
          <div className="p-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-4"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((index) => (
                <div key={index} className="flex items-center p-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 mr-3"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="hidden md:flex md:w-3/4 items-center justify-center">
          <div className="text-gray-400 animate-pulse">
            Loading chat application...
          </div>
        </div>
      </div>
    );
  }

  // For mobile: show only contacts when no chat is selected, or only chat when a chat is selected
  // For desktop: show both side by side
  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)] md:h-[calc(95vh-4rem)] w-full bg-gray-100 dark:bg-gray-900">
      {/* Contact List - visible on mobile only when no chat is selected */}
      <div 
        className={`${
          isMobileView && selectedUser ? 'hidden' : 'block'
        } w-full md:w-1/4 border-r dark:border-gray-700 md:block`}
      >
        <ContactList 
          userId={currentUser.id} 
          onSelect={handleContactSelect} 
          userRole={currentUser.role} 
        />
      </div>

      {/* Chat Window - visible on mobile only when a chat is selected */}
      <div 
        className={`${
          isMobileView && !selectedUser ? 'hidden' : 'block'
        } w-full md:w-3/4 flex flex-col h-full`}
      >
        {selectedUser ? (
          <>
            {/* Back button for mobile */}
            {isMobileView && (
              <button 
                onClick={handleBackToContacts}
                className="flex items-center p-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                <ChevronLeft className="h-5 w-5 mr-1" />
                <span>Back to contacts</span>
              </button>
            )}
            <div className="flex-1 overflow-hidden">
              <ChatWindow senderId={currentUser.id} receiver={selectedUser} />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a contact to start chatting
          </div>
        )}
      </div>
    </div>
  );
}