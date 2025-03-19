import ContactList from "./ContactList";
// import ChatWindow from "./ChatWindow";
import { useAuth } from '../utils/AuthContext';
import { useState } from "react";

export default function ChatApp() {

  const { currentUser} = useAuth();
  const [selectedUser, setSelectedUser] = useState(null);


  return (
    <div className="flex h-[calc(100vh-4rem)] w-full bg-gray-100 dark:bg-gray-900">
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
