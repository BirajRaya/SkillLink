const express = require('express');
const pool = require('../config/db');
const router = express.Router();
const redis = require("redis");

// Connect to Redis - we'll still use it for unread counts, just not for contact caching
const redisClient = redis.createClient({
    socket: {
      host: "localhost", 
      port: 6379,
    },
});

redisClient.on("error", (err) => console.error("Redis Error:", err));
redisClient.on("connect", () => console.log("Redis Connected Successfully in Chat Routes!"));

(async () => {
    try {
      await redisClient.connect();
      console.log("Redis Connection Established in Chat Routes!");
    } catch (err) {
      console.error("Redis Connection Error in Chat Routes:", err);
    }
})();


const CONTACTS_CACHE_EXPIRY = 300; 



// Get unread message counts for a user
router.get("/unreadMessages/:userId", async (req, res) => {
    const { userId } = req.params;
    
    try {
        // Get unread messages from Redis
        const unreadKey = `unread:${userId}`;
        const unreadCounts = await redisClient.hGetAll(unreadKey);
                res.json(unreadCounts || {});
    } catch (error) {
        console.error("Error fetching unread counts:", error);
        res.status(500).json({ error: error.message });
    }
});

// Get total unread messages count for a user
router.get("/totalUnreadMessages/:userId", async (req, res) => {
    const { userId } = req.params;
    
    try {
        // Get unread messages from Redis
        const unreadKey = `unread:${userId}`;
        const unreadCounts = await redisClient.hGetAll(unreadKey);
        
        // Calculate total unread messages
        let totalUnread = 0;
        for (const contactId in unreadCounts) {
            totalUnread += parseInt(unreadCounts[contactId] || 0);
        }
        
        console.log(`Total unread messages for user ${userId}: ${totalUnread}`);
        res.json({ total: totalUnread });
    } catch (error) {
        console.error("Error calculating total unread messages:", error);
        res.status(500).json({ error: error.message });
    }
});

// Mark messages as read
router.post("/markAsRead", async (req, res) => {
    const { userId, contactId } = req.body;
    
    try {
        // Clear unread count in Redis
        const unreadKey = `unread:${userId}`;
        await redisClient.hDel(unreadKey, contactId);
        
        console.log(`Marked messages from ${contactId} as read for user ${userId}`);
        res.json({ success: true });
    } catch (error) {
        console.error("Error marking messages as read:", error);
        res.status(500).json({ error: error.message });
    }
});

router.get("/getChat/:user1/:user2", async (req, res) => {
    const { user1, user2 } = req.params;
    const cacheKey = `chat:${user1}:${user2}`;
    const cacheKey2 = `chat:${user2}:${user1}`;
    const startTime = Date.now();

    try {  
        const cachedMessages = await redisClient.get(cacheKey);

        if (cachedMessages) {
          const endTime = Date.now();
          console.log(`CACHE HIT: Serving messages from Redis in ${endTime - startTime}ms`);
            
            // Mark messages as read when fetching chat
            const unreadKey = `unread:${user1}`;
            await redisClient.hDel(unreadKey, user2);
            
            return res.json(JSON.parse(cachedMessages));
        }   

        console.log("CACHE MISS: Fetching messages from PostgreSQL...");
        const dbStartTime = Date.now();

        // Find existing chat
        let chat = await pool.query(
            `SELECT id FROM chats 
             WHERE (user1_id = $1 AND user2_id = $2) 
             OR (user1_id = $2 AND user2_id = $1)`,
            [user1, user2]
        );

        if (chat.rows.length === 0) return res.json([]); // No chat found

        const chatId = chat.rows[0].id;

        const messages = await pool.query(
            `SELECT sender_id, message, created_at 
             FROM messages WHERE chat_id = $1 ORDER BY created_at ASC`,
            [chatId]
        );

        const dbEndTime = Date.now();
        console.log(`DB QUERY: Fetched messages from PostgreSQL in ${dbEndTime - dbStartTime}ms`);

        // Store data in redis cache for one hour
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(messages.rows));
        await redisClient.setEx(cacheKey2, 3600, JSON.stringify(messages.rows));

        // Mark messages as read when fetching chat
        const unreadKey = `unread:${user1}`;
        await redisClient.hDel(unreadKey, user2);

        const totalEndTime = Date.now();
        console.log(`TOTAL REQUEST TIME: ${totalEndTime - startTime}ms`);

        res.json(messages.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/contacts/:userId", async (req, res) => {
    const { userId } = req.params;
    const contactsCacheKey = `contacts:${userId}`;
    
    try {
      // Try to get contacts from Redis cache first
      const cachedContacts = await redisClient.get(contactsCacheKey);
      
      if (cachedContacts) {
        console.log("Cache Hit! Serving contacts from Redis...");
        const contacts = JSON.parse(cachedContacts);
        
        // Get unread counts from Redis
        const unreadKey = `unread:${userId}`;
        const unreadCounts = await redisClient.hGetAll(unreadKey);
        
        // Update unread counts in cached contacts
        const contactsWithUpdatedCounts = contacts.map(contact => {
          return {
            ...contact,
            unreadcount: parseInt(unreadCounts[contact.id] || 0)
          };
        });
        
        return res.json(contactsWithUpdatedCounts);
      }
            
      // Optimized SQL query
      const query = `
      SELECT DISTINCT 
        u.id, 
        u.full_name AS name, 
        u.profile_picture AS avatar,
        u.role,
        m.message as lastmessage,
        m.created_at as lastmessagetime
      FROM users u
      JOIN chats c ON c.user1_id = u.id OR c.user2_id = u.id
      LEFT JOIN LATERAL (
        SELECT message, created_at
        FROM messages
        WHERE chat_id = c.id
        ORDER BY created_at DESC
        LIMIT 1
      ) m ON true
      WHERE (c.user1_id = $1 OR c.user2_id = $1) 
        AND u.id != $1
      ORDER BY m.created_at DESC NULLS LAST;
      `;
  
      const { rows } = await pool.query(query, [userId]);
      
      // Get unread messages from Redis
      const unreadKey = `unread:${userId}`;
      const unreadCounts = await redisClient.hGetAll(unreadKey);
      
      // Add unread count to each contact
      const contactsWithUnreadCounts = rows.map(contact => {
        return {
          ...contact,
          unreadcount: parseInt(unreadCounts[contact.id] || 0)
        };
      });
      
      // Store contacts in Redis cache (without unread counts to avoid staleness)
      await redisClient.setEx(contactsCacheKey, CONTACTS_CACHE_EXPIRY, JSON.stringify(rows));
      
      res.json(contactsWithUnreadCounts);
    } catch (error) {
      console.error("Error in contacts route:", error);
      res.status(500).json({ error: "Server error" });
    }
});
  
// Add this route to your chatRoutes.js
router.get("/admin", async (req, res) => {
  try {
    // Find admin user by email
    const adminQuery = `
      SELECT id, full_name AS name, profile_picture AS avatar, role
      FROM users
      WHERE email = 'admin@gmail.com'
      LIMIT 1;
    `;
    
    const { rows } = await pool.query(adminQuery);
    
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ error: "Admin user not found" });
    }
  } catch (error) {
    console.error("Error fetching admin user:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Search users
router.get("/search", async (req, res) => {
    try {
      const { query, userId } = req.query; // userId to exclude self
      const searchQuery = `
        SELECT id, full_name AS name, profile_picture AS avatar
        FROM users
        WHERE full_name ILIKE $1 AND id != $2
        And role = 'vendor'
        LIMIT 10;
      `;
  
      const { rows } = await pool.query(searchQuery, [`%${query}%`, userId]);
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
});

router.post("/saveChat", async (req, res) => {
    const { sender_id, receiver_id, message } = req.body;
    const cacheKey = `chat:${sender_id}:${receiver_id}`;
    const cacheKey2 = `chat:${receiver_id}:${sender_id}`;

    try {
        let chat = await pool.query(
            `SELECT id FROM chats 
             WHERE (user1_id = $1 AND user2_id = $2) 
             OR (user1_id = $2 AND user2_id = $1)`,
            [sender_id, receiver_id]
        );

        let chatId;
        if (chat.rows.length === 0) {
            const newChat = await pool.query(
                `INSERT INTO chats (user1_id, user2_id) VALUES ($1, $2) RETURNING id`,
                [sender_id, receiver_id]
            );
            chatId = newChat.rows[0].id;
        } else {
            chatId = chat.rows[0].id;
        }

        // Insert new message
        const newMessage = await pool.query(
            `INSERT INTO messages (chat_id, sender_id, message) 
             VALUES ($1, $2, $3) RETURNING sender_id, message, created_at`,
            [chatId, sender_id, message]
        );

        const newMessageData = newMessage.rows[0];


        const cachedMessages = await redisClient.get(cacheKey);

        if (cachedMessages) {
            let messages = JSON.parse(cachedMessages);
            messages.push(newMessageData);
            await redisClient.setEx(cacheKey, 3600, JSON.stringify(messages));
            await redisClient.setEx(cacheKey2, 3600, JSON.stringify(messages));
        } else {
            const messages = await pool.query(
                `SELECT sender_id, message, created_at 
                 FROM messages WHERE chat_id = $1 ORDER BY created_at ASC`,
                [chatId]
            );
            await redisClient.setEx(cacheKey, 3600, JSON.stringify(messages.rows));
            await redisClient.setEx(cacheKey2, 3600, JSON.stringify(messages.rows));
        }

          // Invalidate contacts cache for both users
          try {
            await redisClient.del(`contacts:${sender_id}`);
            await redisClient.del(`contacts:${receiver_id}`);
        } catch (cacheError) {
            console.error("Error clearing contacts cache:", cacheError);
            // Continue even if cache invalidation fails
        }
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;