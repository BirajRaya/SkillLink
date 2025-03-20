/* eslint-disable react/prop-types */
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Avatar } from "@/components/ui/avatar";
import api from '@/lib/api';
import { User, X } from "lucide-react";
import { io } from "socket.io-client";
import { useAuth } from "../utils/AuthContext";

// Enhanced debounce utility with cancel capability
const createDebouncedFunction = (func, delay) => {
  let timeoutId = null;
  
  // The debounced function
  const debouncedFn = (...args) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  };
  
  // Add a cancel method
  debouncedFn.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
  
  return debouncedFn;
};

// Create a single socket instance to be reused
const socket = io("http://localhost:5000");

export default React.memo(function ContactList({ userId, onSelect, userRole }) {
  const { currentUser } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isMounted = useRef(true);
  const joinedChat = useRef(false);
  const lastFetchTime = useRef(0);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const activeSearchRef = useRef(false);
  const currentSearchQueryRef = useRef("");

  
  
  // Determine if user is admin
  const isAdmin = currentUser.role === 'admin';

  // Create a debounced search function (defined inside component to access state)
  const debouncedSearch = useRef(
    createDebouncedFunction(async (query) => {
      if (!query.trim() || !isMounted.current) return;
      
      // Store the search query to verify it later
      const currentQuery = query;
      const searchStartTime = Date.now();
      
      console.log(`Starting search for: "${currentQuery}" at ${searchStartTime}`);
      try {
        setInitialLoading(true);
        // First get all our existing contacts to make sure we have complete data
        const allContactsResponse = await api.get(`http://localhost:5000/chat/contacts/${userId}`);
        const allContacts = allContactsResponse.data;
        
        // Create a map of all existing contacts with their full data
        const existingContactsMap = new Map(
          allContacts.map(contact => [contact.id, contact])
        );
        
        // Now get the search results
        const response = await api.get(`http://localhost:5000/chat/search?query=${query}&userId=${userId}`);
        
        console.log(`Got response for "${currentQuery}" search. Current query: "${currentSearchQueryRef.current}", isSearchMode: ${isSearchMode}, activeSearch: ${activeSearchRef.current}`);
        
        // Check if we're still in search mode AND the search query is still relevant
        if (isMounted.current && activeSearchRef.current && 
            currentSearchQueryRef.current.toLowerCase().includes(currentQuery.toLowerCase())) {
          console.log(`Found ${response.data.length} users matching query "${currentQuery}"`);
          if (response.data.length > 0) {
            // Enhance search results with full conversation data from existing contacts
            const enhancedResults = response.data.map(searchResult => {
              // If we have this contact in our existing list, merge the data to preserve history
              const existingContact = existingContactsMap.get(searchResult.id);
              if (existingContact) {
                console.log(`Merging search result for ${searchResult.name} with existing contact data:`, {
                  searchResult,
                  existingContact
                });
                return {
                  ...searchResult,
                  // Always prioritize existing contact data for conversation history
                  lastmessage: existingContact.lastmessage || searchResult.lastmessage || "Start a conversation...",
                  lastmessagetime: existingContact.lastmessagetime || searchResult.lastmessagetime,
                  unreadcount: existingContact.unreadcount || searchResult.unreadcount || 0
                };
              }
              // No existing contact found, use search result data as is
              return searchResult;
            });
            
            console.log("Enhanced search results with conversation history:", enhancedResults);
            setContacts(enhancedResults);
          } else {
            console.log(`No users found matching "${currentQuery}"`);
          }
        } else {
          console.log(`Search results for "${currentQuery}" ignored - current search: "${currentSearchQueryRef.current}", mode: ${isSearchMode}, activeSearch: ${activeSearchRef.current}`);
        }
      } catch (error) {
        console.error(`Error searching for "${currentQuery}":`, error);
      } finally {
        if (isMounted.current) {
          setInitialLoading(false);
        }
      }
    }, 500) // Increased debounce time for more stability
  ).current;

  // Memoized contacts sorted by unread count and last message time
  const displayedContacts = useMemo(() => {
    // If we have a search query, we've already fetched filtered contacts from the server
    if (searchQuery.trim().length > 0) {
      return contacts;
    }
    
    // Otherwise, sort contacts by unread count (higher first) and lastmessagetime
    return [...contacts].sort((a, b) => {
      // Admin contacts always come first for vendors
      if (a.role === 'admin' && userRole === 'vendor') return -1;
      if (b.role === 'admin' && userRole === 'vendor') return 1;
      
      // Sort by unread count first (descending)
      if ((b.unreadcount || 0) - (a.unreadcount || 0) !== 0) {
        return (b.unreadcount || 0) - (a.unreadcount || 0);
      }
      
      // Then sort by last message time (most recent first)
      const timeA = a.lastmessagetime ? new Date(a.lastmessagetime).getTime() : 0;
      const timeB = b.lastmessagetime ? new Date(b.lastmessagetime).getTime() : 0;
      return timeB - timeA;
    });
  }, [contacts, searchQuery, userRole]);

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
      if (isMounted.current && !isSearchMode) {
        quietlyFetchContacts();
      }
    }, 60000);
    
    return () => {
      isMounted.current = false;
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("messagesMarkedAsRead", handleMessagesMarkedAsRead);
      clearInterval(interval);
      
      // Cancel any pending debounced searches
      debouncedSearch.cancel();
      
      // Clear search refs on unmount
      activeSearchRef.current = false;
      currentSearchQueryRef.current = "";
    };
  }, [userId, debouncedSearch]);

  // Initial fetch with loading animation
  const initialFetchContacts = async () => {
    if (!isMounted.current || !userId) return;
    
    // Cancel any pending searches
    debouncedSearch.cancel();
    console.log(`Fetching contacts for user ${userId}`);
    
    try {
      setInitialLoading(true);
      const response = await api.get(`http://localhost:5000/chat/contacts/${userId}`);
      const adminResponse = await api.get('http://localhost:5000/chat/admin');
      
      if (isMounted.current && !activeSearchRef.current) {
        console.log(`Received ${response.data.length} contacts from server`);
        let contactsList = response.data;
        console.log("Contacts list:", contactsList);
        
        // If user is a vendor, ensure admin is always in the contact list
        if (userRole === 'vendor') {
          // Check if admin is already in the contacts list
          const adminExists = contactsList.some(contact => contact.role === 'admin');
          
          if (!adminExists) {
            // Fetch admin details
            try {
            
              if (adminResponse.data && adminResponse.data.id) {
                // Add admin to the top of the contacts list
                contactsList = [
                  {
                    id: adminResponse.data.id,
                    name: adminResponse.data.name || 'Admin Support',
                    avatar: adminResponse.data.avatar || null,
                    role: 'admin',
                    unreadcount: 0,
                    lastmessage: 'Start a conversation...'
                  },
                  ...contactsList
                ];
              }
            } catch (adminError) {
              console.error("Error fetching admin details:", adminError);
              
              // Even if admin fetch fails, add a placeholder admin
              contactsList = [
                {
                  id: 'admin',
                  name: 'Admin Support',
                  role: 'admin',
                  unreadcount: 0,
                  lastmessage: 'Start a conversation...'
                },
                ...contactsList
              ];
            }
          }
        }
        
        setContacts(contactsList);
        lastFetchTime.current = Date.now();
      } else {
        console.log('Contact results ignored because search is active');
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
      
      // If there's an error but user is a vendor, still show admin
      if (userRole === 'vendor' && isMounted.current) {
        setContacts([{
          id: 'admin',
          name: 'Admin Support',
          role: 'admin',
          unreadcount: 0,
          lastmessage: 'Start a conversation...'
        }]);
      }
    } finally {
      if (isMounted.current) {
        setInitialLoading(false);
      }
    }
  };

  // Background fetch without animation
  const quietlyFetchContacts = createDebouncedFunction(async () => {
    if (!isMounted.current || !userId || activeSearchRef.current) return;
    
    try {
      setRefreshing(true);
      const response = await api.get(`http://localhost:5000/chat/contacts/${userId}`);
      
      if (isMounted.current && !activeSearchRef.current) {
        let contactsList = response.data;
        
        // If user is a vendor, ensure admin contact is preserved
        if (userRole === 'vendor') {
          // Find admin contact in existing contacts
          const adminContact = contacts.find(contact => contact.role === 'admin');
          
          if (adminContact) {
            // Create a map of contact IDs for O(1) lookup
            const contactIds = new Set(contactsList.map(contact => contact.id));
            
            // Only add the admin if it doesn't already exist in the new contacts list
            if (!contactIds.has(adminContact.id)) {
              // Keep admin at the top of the list
              contactsList = [adminContact, ...contactsList];
            }
          } else {
            // If admin not in current contacts, fetch admin details
            try {
              const adminResponse = await api.get('http://localhost:5000/chat/admin');
              if (adminResponse.data && adminResponse.data.id) {
                // Create a map of contact IDs for O(1) lookup
                const contactIds = new Set(contactsList.map(contact => contact.id));
                
                // Only add the admin if it doesn't already exist in the new contacts list
                if (!contactIds.has(adminResponse.data.id)) {
                  // Add admin to the top of the contacts list
                  contactsList = [
                    {
                      id: adminResponse.data.id,
                      name: adminResponse.data.name || 'Admin Support',
                      avatar: adminResponse.data.avatar || null,
                      role: 'admin',
                      unreadcount: 0,
                      lastmessage: 'Start a conversation...'
                    },
                    ...contactsList
                  ];
                }
              }
            } catch (adminError) {
              console.error("Error fetching admin details:", adminError);
              // Add placeholder admin if fetch fails
              contactsList = [
                {
                  id: 'admin',
                  name: 'Admin Support',
                  role: 'admin',
                  unreadcount: 0,
                  lastmessage: 'Start a conversation...'
                },
                ...contactsList
              ];
            }
          }
        }
        
        // Ensure no duplicate IDs in the final list (just in case)
        const uniqueContacts = [];
        const seenIds = new Set();
        
        for (const contact of contactsList) {
          if (!seenIds.has(contact.id)) {
            uniqueContacts.push(contact);
            seenIds.add(contact.id);
          } else {
            console.warn(`Duplicate contact ID detected: ${contact.id}`);
          }
        }
        
        setContacts(uniqueContacts);
        lastFetchTime.current = Date.now();
      }
    } catch (error) {
      console.error("Error refreshing contacts:", error);
      
      // If error but user is vendor with no contacts, still show admin
      if (userRole === 'vendor' && contacts.length === 0 && isMounted.current) {
        setContacts([{
          id: 'admin',
          name: 'Admin Support',
          role: 'admin',
          unreadcount: 0,
          lastmessage: 'Start a conversation...'
        }]);
      }
    } finally {
      if (isMounted.current) {
        setRefreshing(false);
      }
    }
  }, 300);

  // Handle input field changes immediately
  const handleInputChange = (e) => {
    const value = e.target.value;
    console.log("Search input changed:", value);
    
    // Update the input value immediately
    setSearchQuery(value);
    // Keep a reference to current search query
    currentSearchQueryRef.current = value;
    
    // Handle empty search query
    if (value.trim() === '') {
      console.log("Search query empty, restoring contacts");
      
      // Cancel any pending search requests
      debouncedSearch.cancel();
      
      // Update both the state and ref
      setIsSearchMode(false);
      activeSearchRef.current = false;
      
      initialFetchContacts();
      return;
    }
    
    // Update both the state and ref
    setIsSearchMode(true);
    activeSearchRef.current = true;
    
    // Trigger debounced search
    debouncedSearch(value);
  };

  const clearSearch = () => {
    console.log("Clearing search and restoring contacts");
    
    // Cancel any pending search requests
    debouncedSearch.cancel();
    
    setSearchQuery("");
    currentSearchQueryRef.current = "";
    setIsSearchMode(false);
    activeSearchRef.current = false;
    initialFetchContacts();
  };

  const handleSelectContact = async (contact) => {
    // Prevent selecting the same contact again
    if (selectedContact?.id === contact.id) {
      return; // Exit early if the same contact is clicked
    }
    
    // Update local state
    setSelectedContact(contact);
    
    // Notify parent component
    onSelect(contact);
    
    // Optimistically update unread count
    setContacts(prevContacts => 
      prevContacts.map(c => 
        c.id === contact.id ? { ...c, unreadcount: 0 } : c
      )
    );
    
    // Background API calls
    try {
      await api.post("http://localhost:5000/chat/markAsRead", {
        userId: userId,
        contactId: contact.id
      });
      
      // Emit socket event
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
            onChange={handleInputChange}
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
        ) : displayedContacts.length === 0 ? (
          // Show "No contacts" message only for admin users, vendors should always have at least the admin contact
          <div className="text-center text-gray-500 my-6">
            {isAdmin ? "No contacts found" : "Loading contacts..."}
          </div>
        ) : (
          displayedContacts.map((contact) => {
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
                <Avatar className={`mr-3 ${hasUnread && !isSelected ? "ring-2 ring-blue-500" : 
                    (isAdminContact && userRole === 'vendor' && !isSelected ? " ring-green-500" : "")}`}>
  {
    contact.avatar ? (
      <img 
        src={contact.avatar} 
        alt={contact.name} 
        className="rounded-full"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = 'https://via.placeholder.com/40'; // Fallback image if loading fails
        }} 
      />
    ) : (
      <div className="h-9 w-9 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
        <User className="h-5 w-5 text-white" />
      </div>
    )
  }
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
});