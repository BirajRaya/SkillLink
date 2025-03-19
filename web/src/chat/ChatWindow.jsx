/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from "react";
import MessageBox from "./MessageBox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import api from '@/lib/api';
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

export default function ChatWindow({ senderId, receiver }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const isMounted = useRef(true);
  const receiverId = receiver.id;
  const receiverName = receiver.name;
  
  const fetchChats = async () => {
    try {
      setLoading(true);
      console.log(`Fetching chat messages between ${senderId} and ${receiverId}`);
      
      const response = await api.get(`http://localhost:5000/chat/getChat/${senderId}/${receiverId}`);
      
      if (isMounted.current) {
        console.log(`Loaded ${response.data.length} messages`);
        setMessages(response.data);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMounted.current = true;
    
    if (!senderId || !receiverId) return;

    // Reset messages when changing receivers
    setMessages([]);
    socket.emit("joinChat", senderId);
    fetchChats();

    // Listen for new messages
    const handleReceiveMessage = (messageData) => {
      // Only add messages from the current receiver
      if (messageData.senderId === receiverId) {
        console.log(`Received message from ${receiverId}`);
        
        // Add the received message to our messages
        if (isMounted.current) {
          setMessages((prev) => [...prev, {
            sender_id: messageData.senderId,
            message: messageData.message,
            created_at: messageData.created_at || new Date().toISOString()
          }]);
        }
        
        // Mark messages as read immediately since we're in the chat
        api.post("http://localhost:5000/chat/markAsRead", {
          userId: senderId,
          contactId: receiverId
        }).catch(err => console.error("Error marking message as read:", err));
        
        // Emit socket event
        socket.emit("markAsRead", {
          userId: senderId,
          contactId: receiverId
        });
      }
    };

    socket.on("receiveMessage", handleReceiveMessage);

    return () => {
      isMounted.current = false;
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [senderId, receiverId]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const currentTimestamp = new Date().toISOString();
      
      // First update UI for immediate feedback
      const optimisticMessage = { 
        sender_id: senderId, 
        message: newMessage,
        created_at: currentTimestamp
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
      setNewMessage("");
      
      // Then send to server
      await api.post("http://localhost:5000/chat/saveChat", {
        sender_id: senderId,
        receiver_id: receiverId,
        message: newMessage,
      });

      // Emit socket event
      socket.emit("sendMessage", {
        senderId,
        receiverId,
        message: newMessage,
        created_at: currentTimestamp
      });
    } catch (error) {
      console.error("Error sending message:", error);
      // Could add error handling feedback here
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-800">
      <div className="p-4 flex items-center space-x-3 border-b dark:border-gray-700 bg-white dark:bg-gray-900">
        <img 
          src={receiver.avatar} 
          alt={receiverName} 
          className="w-10 h-10 rounded-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://via.placeholder.com/40';
          }}
        />
        <div>
          <p className="text-lg font-semibold">{receiverName || "User"}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <div className="text-gray-500">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No messages yet. Start a conversation!
          </div>
        ) : (
          messages.map((msg, index) => (
            <MessageBox 
              key={index} 
              text={msg.message} 
              sender={msg.sender_id === senderId ? "me" : "other"} 
              timestamp={msg.created_at}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t dark:border-gray-700 flex items-center space-x-2 bg-white dark:bg-gray-900">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="flex-1"
          disabled={loading}
        />
        <Button 
          className="ml-2" 
          onClick={sendMessage} 
          disabled={loading || !newMessage.trim()}
        >
          Send
        </Button>
      </div>
    </div>
  );
}