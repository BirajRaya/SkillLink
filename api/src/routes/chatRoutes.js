const express = require('express');
const pool = require('../config/db');
const router = express.Router();
const redis = require("redis");

// const redisClient = redis.createClient(); // Default localhost:6379
const redisClient = redis.createClient({
    socket: {
      host: "localhost", 
      port: 6379,
    },
  });

redisClient.on("error", (err) => console.error("Redis Error:", err));

(async () => {
    try {
      await redisClient.connect();
      console.log("Redis Connected Successfully!");
    } catch (err) {
      console.error("Redis Connection Error:", err);
    }
  })();

console.log('hello it is redis' + redisClient);


router.get("/getChat/:user1/:user2", async (req, res) => {
    const { user1, user2 } = req.params;
    const cacheKey = `chat:${user1}:${user2}`;
    const cacheKey2 = `chat:${user2}:${user1}`


    try {  

        const cachedMessages = await redisClient.get(cacheKey);

        if (cachedMessages) {
            console.log("Cache Hit! Serving data from Redis...");
            // console.log(cachedMessages);
            return res.json(JSON.parse(cachedMessages));
        }   

        console.log("Cache Miss! Fetching data from PostgreSQL...");

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

        //store data in redis cache for one hour
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(messages.rows));
        await redisClient.setEx(cacheKey2, 3600, JSON.stringify(messages.rows));

        res.json(messages.rows);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});

router.get("/contacts/:userId", async (req, res) => {
    const { userId } = req.params;
    try {  
      const query = `
       SELECT DISTINCT u.id, u.full_name AS name, u.profile_picture AS avatar,
    (
        SELECT message FROM messages 
        WHERE chat_id = c.id 
        ORDER BY created_at DESC 
        LIMIT 1
    ) AS lastMessage
FROM users u
JOIN chats c ON c.user1_id = u.id OR c.user2_id = u.id
WHERE (c.user1_id = $1 OR c.user2_id = $1) 
AND u.id != $1
ORDER BY lastMessage DESC NULLS LAST;
      `;
  
      const { rows } = await pool.query(query, [userId]);
      res.json(rows);
    } catch (error) {
      console.error(error);
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
    const cacheKey2 = `chat:${receiver_id}:${sender_id}`


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
        console.log(cacheKey);

        if (cachedMessages) {
            let messages = JSON.parse(cachedMessages);

            messages.push(newMessageData);

            // console.log('helo' + JSON.stringify(messages));

            await redisClient.setEx(cacheKey, 3600, JSON.stringify(messages));
            await redisClient.setEx(cacheKey2, 3600, JSON.stringify(messages));
        } else {
            const messages = await pool.query(
                `SELECT sender_id, message, created_at 
                 FROM messages WHERE chat_id = $1 ORDER BY created_at ASC`,
                [chatId]
            );
            await redisClient.setEx(cacheKey, 3600, JSON.stringify(messages.rows));
            await redisClient.setEx(cacheKey2, 3600, JSON.stringify(messages));
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;