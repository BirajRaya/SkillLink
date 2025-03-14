import { useState, useEffect } from "react";
import { Avatar } from "@/components/ui/avatar";
import api from '@/lib/api';
import { User, X } from "lucide-react";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

export default function ContactList({ userId, onSelect }) {
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCounts, setUnreadCounts] = useState({});

  useEffect(() => {
    fetchContacts();
    socket.on("receiveMessage", (messageData) => {
      setUnreadCounts((prev) => ({
        ...prev,
        [messageData.senderId]: (prev[messageData.senderId] || 0) + 1
      }));
    });

    return () => socket.off("receiveMessage");
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await api.get(`http://localhost:5000/chat/contacts/${userId}`);
      setContacts(response.data);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    }
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim().length > 0) {
      try {
        const response = await api.get(`http://localhost:5000/chat/search?query=${query}&userId=${userId}`);
        setContacts(response.data);
      } catch (error) {
        console.error("Error searching users:", error);
      }
    } else {
      fetchContacts();
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    fetchContacts();
  };

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Chats</h2>
      
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

      {contacts.map((contact) => (
        <div
          key={contact.id}
          className="flex items-center p-3 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800"
          onClick={() => onSelect(contact)}
        >
          <Avatar className="mr-3">
          {contact.avatar ? (
               <img src={contact.avatar} alt={contact.name} className="rounded-full" />
              ) : (
                <div className="rounded-full">
                  <User/>
                </div>
              )}
          </Avatar>
          <div>
            <p className="font-medium">{contact.name}</p>
            {unreadCounts[contact.id] > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCounts[contact.id]}
            </span>
          )}
            <p className="text-sm text-gray-600 dark:text-gray-400">{contact.lastmessage || "Start a conversation..."}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
