import { useState, useEffect } from "react";
import ContactList from "./ContactList";
// import ChatWindow from "./ChatWindow";
import { useAuth } from '../utils/AuthContext';
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

export default function ChatApp() {
  const { currentUser } = useAuth();
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simulate initial loading
  useEffect(() => {
    // Set loading to false after a brief delay to ensure UI components have time to initialize
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
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
      <div className="flex h-[calc(100vh-4rem)] w-full bg-gray-100 dark:bg-gray-900">
        <div className="w-1/3 md:w-1/4 border-r dark:border-gray-700 animate-pulse">
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

        <div className="w-2/3 md:w-3/4 flex items-center justify-center">
          <div className="text-gray-400 animate-pulse">
            Loading chat application...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(95vh-4rem)] w-full bg-gray-100 dark:bg-gray-900">
      <div className="w-1/3 md:w-1/4 border-r dark:border-gray-700">
        <ContactList userId={currentUser.id} onSelect={setSelectedUser} />
      </div>

      {/* <div className="w-2/3 md:w-3/4">
        {selectedUser ? (
          <ChatWindow senderId={currentUser.id} receiver={selectedUser} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a contact to start chatting
          </div>
        )}
      </div> */}
    </div>
  );
}