import { useState, useEffect, useRef } from "react";
import MessageBox from "./MessageBox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import api from '@/lib/api';
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

export default function ChatWindow({ senderId, receiver, receiverProfile }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);
  const receiverId = receiver.id;
  const receiverName = receiver.name;
  console.log(receiver);
  const fetchChats = async () => {
    try {
      const response = await api.get(`http://localhost:5000/chat/getChat/${senderId}/${receiverId}`);
      setMessages(response.data);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  // useEffect(() => {
  //   if (!senderId || !receiverId) return;
  //   fetchChats();
  // }, [senderId, receiverId]);

  useEffect(() => {
    if (!senderId || !receiverId) return;

    socket.emit("joinChat", senderId);
    fetchChats();

    socket.on("receiveMessage", (messageData) => {
      if (messageData.senderId === receiverId) {
        setMessages((prev) => [...prev, messageData]);
      }
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [senderId, receiverId]);


  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await api.post("http://localhost:5000/chat/saveChat", {
        sender_id: senderId,
        receiver_id: receiverId,
        message: newMessage,
      });

      const messageData = {
        senderId,
        receiverId,
        message: newMessage,
      };

      socket.emit("sendMessage", messageData);

      setMessages([...messages, { sender_id: senderId, message: newMessage }]);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-800">
      <div className="p-4 flex items-center space-x-3 border-b dark:border-gray-700 bg-white dark:bg-gray-900">
        <img src={receiver.avatar} alt="User" className="w-10 h-10 rounded-full" />
        <div>
          <p className="text-lg font-semibold">{receiverName || "User"}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, index) => (
          <MessageBox 
            key={index} 
            text={msg.message} 
            sender={msg.sender_id === senderId ? "me" : "other"} 
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t dark:border-gray-700 flex items-center space-x-2 bg-white dark:bg-gray-900">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1"
        />
        <Button className="ml-2" onClick={sendMessage} disabled={!newMessage.trim()}>
          Send
        </Button>
      </div>
    </div>
  );
}
