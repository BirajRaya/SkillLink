/* eslint-disable react/prop-types */
import { useMemo } from "react";

export default function MessageBox({ text, sender, timestamp }) {
  // Format timestamp if available
  const formattedTime = useMemo(() => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      
      // Check if date is valid
      if (isNaN(date.getTime())) return '';
      
      // Format time differently based on whether it's today, yesterday, or earlier
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (date >= today) {
        // Today - show just the time
        return date.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit'
        });
      } else if (date >= yesterday) {
        // Yesterday - show "Yesterday" with time
        return `Yesterday ${date.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit'
        })}`;
      } else {
        // Earlier - show date and time
        return date.toLocaleDateString([], {
          month: 'short',
          day: 'numeric'
        }) + ' ' + date.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit'
        });
      }
    } catch (error) {
      console.error("Error formatting time:", error);
      return '';
    }
  }, [timestamp]);
  
  return (
    <div className={`flex ${sender === "me" ? "justify-end" : "justify-start"}`}>
      <div 
        className={`p-3 rounded-lg max-w-xs md:max-w-md ${
          sender === "me" 
            ? "bg-blue-600 text-white" 
            : "bg-gray-700 text-white"
        }`}
      >
        <div className="break-words whitespace-pre-wrap">{text}</div>
        {formattedTime && (
          <div className={`text-xs mt-1 text-right ${
            sender === "me" ? "text-blue-200" : "text-gray-300"
          }`}>
            {formattedTime}
          </div>
        )}
      </div>
    </div>
  );
}