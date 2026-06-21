import Redis from "ioredis";

// Use environment variable or fallback to localhost for local dev outside Docker
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const redisClient = new Redis(redisUrl);

redisClient.on("error", (err) => {
    console.error("Redis Client Error", err);
});

redisClient.on("connect", () => {
    console.log("Connected to Redis");
});

export default redisClient;
