/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from "react";
import { Avatar } from "@/components/ui/avatar";
import api from '@/lib/api';
import { User, X } from "lucide-react";
import { io } from "socket.io-client";
import { useAuth } from "../utils/AuthContext";

// Create a single socket instance to be reused
const socket = io("http://localhost:5000");

export default function ContactList({ userId, onSelect, userRole }) {
    const { currentUser, logout, setCurrentUser } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isMounted = useRef(true);
  const joinedChat = useRef(false);
  const lastFetchTime = useRef(0);
  
  // Determine if user is admin
  const isAdmin = currentUser.role === 'admin';

  useEffect(() => {
    isMounted.current = true;
    
    // Only join chat once
    if (!joinedChat.current && userId) {
      console.log("Joining chat as user:", userId);
      socket.emit("joinChat", userId);
      joinedChat.current = true;
    }
    
    // Initial fetch of contacts
    initialFetchContacts();
    
    // Set up socket listener for new messages
    const handleReceiveMessage = (messageData) => {
      // Only update contacts if the message is from someone else
      if (messageData.senderId && messageData.senderId !== userId) {
        console.log("Received new message from:", messageData.senderId);
        
        // Update unread counts locally without fetching the entire list
        setContacts(prevContacts => {
          return prevContacts.map(contact => {
            // If this contact is the sender and it's not the selected contact
            if (contact.id === messageData.senderId && 
                (!selectedContact || selectedContact.id !== messageData.senderId)) {
              // Increment unread count and update last message
              return {
                ...contact,
                unreadcount: (parseInt(contact.unreadcount || 0) + 1),
                lastmessage: messageData.message,
                lastmessagetime: new Date().toISOString()
              };
            }
            return contact;
          });
        });
        
        // Only fetch from server every 30 seconds at most
        const now = Date.now();
        if (now - lastFetchTime.current > 30000) {
          quietlyFetchContacts();
          lastFetchTime.current = now;
        }
      }
    };
    
    // Set up socket listener for when messages are marked as read
    const handleMessagesMarkedAsRead = ({ userId: markedByUserId, contactId }) => {
      console.log("Messages marked as read by:", markedByUserId, "for contact:", contactId);
      
      // If this user's messages were marked as read by someone else,
      // the unread count should be zero for that user
      if (markedByUserId !== userId && contactId === userId) {
        setContacts(prevContacts => {
          return prevContacts.map(contact => {
            if (contact.id === markedByUserId) {
              return {
                ...contact,
                unreadcount: 0
              };
            }
            return contact;
          });
        });
      }
    };
    
    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("messagesMarkedAsRead", handleMessagesMarkedAsRead);
    
    // Set up a refresh interval for contacts - every 60 seconds
    const interval = setInterval(() => {
      if (isMounted.current) {
        quietlyFetchContacts();
      }
    }, 60000);
    
    return () => {
      isMounted.current = false;
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("messagesMarkedAsRead", handleMessagesMarkedAsRead);
      clearInterval(interval);
    };
  }, [userId, selectedContact]);

  // Initial fetch with loading animation
  const initialFetchContacts = async () => {
    if (!isMounted.current || !userId) return;
    
    try {
      setInitialLoading(true);
      const response = await api.get(`http://localhost:5000/chat/contacts/${userId}`);
      
      if (isMounted.current) {
        let contactsList = response.data;
        
        // If user is a vendor, ensure admin is in the contact list
        if (userRole === 'vendor') {
          // Check if admin is already in the contacts list
          const adminExists = contactsList.some(contact => contact.role === 'admin');
          
          if (!adminExists) {
            // Fetch admin details
            try {
              const adminResponse = await api.get('http://localhost:5000/users/admin');
              if (adminResponse.data && adminResponse.data.id) {
                // Add admin to the top of the contacts list
                contactsList = [
                  {
                    id: adminResponse.data.id,
                    name: adminResponse.data.name || 'Admin Support',
                    avatar: adminResponse.data.avatar || null,
                    role: 'admin',
                    unreadcount: 0,
                    lastmessage: 'Contact admin for support'
                  },
                  ...contactsList
                ];
              }
            } catch (adminError) {
              console.error("Error fetching admin details:", adminError);
            }
          }
        }
        
        setContacts(contactsList);
        lastFetchTime.current = Date.now();
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      if (isMounted.current) {
        setInitialLoading(false);
      }
    }
  };

  // Background fetch without animation
  const quietlyFetchContacts = async () => {
    if (!isMounted.current || !userId) return;
    
    try {
      setRefreshing(true);
      const response = await api.get(`http://localhost:5000/chat/contacts/${userId}`);
      
      if (isMounted.current) {
        let contactsList = response.data;
        
        // If user is a vendor, ensure admin contact is preserved
        if (userRole === 'vendor') {
          // Find admin contact in existing contacts
          const adminContact = contacts.find(contact => contact.role === 'admin');
          
          if (adminContact) {
            // Check if admin exists in new contacts
            const adminExists = contactsList.some(contact => contact.role === 'admin' || contact.id === adminContact.id);
            
            if (!adminExists) {
              // Keep admin at the top of the list
              contactsList = [adminContact, ...contactsList];
            }
          }
        }
        
        setContacts(contactsList);
        lastFetchTime.current = Date.now();
      }
    } catch (error) {
      console.error("Error refreshing contacts:", error);
    } finally {
      if (isMounted.current) {
        setRefreshing(false);
      }
    }
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim().length > 0) {
      try {
        setInitialLoading(true);
        const response = await api.get(`http://localhost:5000/chat/search?query=${query}&userId=${userId}`);
        if (isMounted.current) {
          setContacts(response.data);
        }
      } catch (error) {
        console.error("Error searching users:", error);
      } finally {
        if (isMounted.current) {
          setInitialLoading(false);
        }
      }
    } else {
      initialFetchContacts();
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    initialFetchContacts();
  };

  const handleSelectContact = async (contact) => {
    // Immediately update UI state without waiting for API
    setSelectedContact(contact);
    onSelect(contact);
    
    // Optimistically update the unread count in local state immediately
    setContacts(prevContacts => 
      prevContacts.map(c => 
        c.id === contact.id ? { ...c, unreadcount: 0 } : c
      )
    );
    
    // Then handle the API calls in the background
    try {
      await api.post("http://localhost:5000/chat/markAsRead", {
        userId: userId,
        contactId: contact.id
      });
      
      // Emit socket event to mark as read
      socket.emit("markAsRead", {
        userId: userId,
        contactId: contact.id
      });
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  // Loading skeleton for contacts
  const LoadingSkeleton = () => (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3, 4, 5].map((index) => (
        <div key={index} className="flex items-center p-3 rounded-lg">
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 mr-3"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Chats</h2>
      
      {/* Only show search box for admin users */}
      {isAdmin && (
        <div className="relative">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full p-2 border rounded-lg pr-10"
          />
          {searchQuery && (
            <button onClick={clearSearch} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700">
              <X size={18} />
            </button>
          )}
        </div>
      )}

      <div className="overflow-y-auto max-h-[calc(100vh-10rem)]">
        {initialLoading ? (
          <LoadingSkeleton />
        ) : contacts.length === 0 ? (
          <div className="text-center text-gray-500 my-6">
            No contacts found
          </div>
        ) : (
          contacts.map((contact) => {
            // Make sure the unread count is a number
            const unreadCount = parseInt(contact.unreadcount || 0);
            const hasUnread = unreadCount > 0;
            
            // Check if this is the selected contact
            const isSelected = selectedContact?.id === contact.id;
            
            // Highlight admin contact for vendors
            const isAdminContact = contact.role === 'admin';
            
            return (
              <div
                key={contact.id}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer 
                  ${isSelected 
                    ? "bg-gray-200 dark:bg-gray-800" 
                    : hasUnread
                      ? "bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30" 
                      : isAdminContact && userRole === 'vendor'
                        ? "bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30"
                        : "hover:bg-gray-200 dark:hover:bg-gray-800"
                  }
                  ${hasUnread && !isSelected ? "border-l-4 border-blue-500" : isAdminContact && userRole === 'vendor' && !isSelected ? "border-l-4 border-green-500" : "border-l-4 border-transparent"}
                  transition-colors duration-200
                `}
                onClick={() => handleSelectContact(contact)}
              >
                <div className="flex items-center">
                  <Avatar className={`mr-3 ${hasUnread && !isSelected ? "ring-2 ring-blue-500" : isAdminContact && userRole === 'vendor' && !isSelected ? "ring-2 ring-green-500" : ""}`}>
                    {contact.avatar ? (
                      <img 
                        src={contact.avatar} 
                        alt={contact.name} 
                        className="rounded-full"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/40';
                        }}
                      />
                    ) : (
                      <div className="rounded-full">
                        <User/>
                      </div>
                    )}
                  </Avatar>
                  
                  <div className="min-w-0">
                    <p className={`font-medium truncate ${
                      (hasUnread || (isAdminContact && userRole === 'vendor')) && !isSelected 
                        ? "font-bold text-black dark:text-white" 
                        : ""
                    }`}>
                      {contact.name}
                      {isAdminContact && userRole === 'vendor' && <span className="ml-1 text-xs text-green-600 dark:text-green-400">(Admin)</span>}
                    </p>
                    <p className={`text-sm truncate ${
                      hasUnread && !isSelected
                        ? "text-gray-900 dark:text-gray-200" 
                        : isAdminContact && userRole === 'vendor' && !isSelected
                        ? "text-green-700 dark:text-green-400"
                        : "text-gray-600 dark:text-gray-400"
                    }`}>
                      {contact.lastmessage || "Start a conversation..."}
                    </p>
                  </div>
                </div>
                
                {/* Unread count badge on the right side */}
                {hasUnread && !isSelected && (
                  <div className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-2">
                    {unreadCount}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}