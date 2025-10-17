import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Example route
app.get("/", (req, res) => {
  res.send("Timeee Backend is Running 🚀");
});

// Use Render’s dynamic port
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
