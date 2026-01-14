const express = require("express");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const OpenAI = require("openai");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const SECRET_KEY = process.env.SECRET_KEY;

const openai = new OpenAI();

app.use(bodyParser.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL, // Replace this with your actual frontend URL
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Middleware to authenticate and extract userId from token
const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.userId = user.userId;
    next();
  });
};

app.get("/protected", authenticateToken, (req, res) => {
  res.json({ message: "This is a protected route", userId: req.userId });
});

// Register endpoint
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newuser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
    });

    // Issue JWT so frontend can log the user in immediately after registration
    const token = jwt.sign({ userId: newuser.id }, SECRET_KEY);

    res.json({ success: true, user: newuser, token });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error registering user",
        error: error.message,
      });
  }
});

// Login endpoint
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign({ userId: user.id }, SECRET_KEY);

      // Return both token and user object for frontend stores
      res.json({ message: "Login successful", token, user });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
});

// Fetch user profile
app.get("/user/:id", async (req, res) => {
  const userId = parseInt(req.params.id);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user data:", error);
    res
      .status(500)
      .json({ message: "Error fetching user data", error: error.message });
  }
});

// Update user profile
app.put("/user/:id", async (req, res) => {
  const userId = parseInt(req.params.id);
  const { username } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { username },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user profile:", error);
    res
      .status(500)
      .json({ message: "Error updating user profile", error: error.message });
  }
});

// Change user password
app.put("/user/:id/change-password", async (req, res) => {
  const userId = parseInt(req.params.id);
  const { oldPassword, newPassword } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect old password" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res
      .status(500)
      .json({ message: "Error changing password", error: error.message });
  }
});

// Generate recipe endpoint
app.post("/generate-recipe", async (req, res) => {
  const { userId, ingredients } = req.body;
  try {
    const gptResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a retired world-class 3 star Michelin star chef and now you are focused more on suggesting home cooked recipes based in south east asia region",
        },
        {
          role: "user",
          content: `list 2 to 4 recipes (recipe name only) that primarily use these ingredients: ${ingredients.join(
            ", "
          )}`,
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
      top_p: 1,
      presence_penalty: 0,
      frequency_penalty: 0,
    });

    // Debugging: Log the full response
    console.log("OpenAI Response:", gptResponse);

    if (gptResponse && gptResponse.choices && gptResponse.choices.length > 0) {
      const recipesText = gptResponse.choices[0].message.content.trim();
      const recipeTitles = recipesText.split("\n").filter((title) => title); // Splitting by new lines

      // Constructing recipe objects
      const recipes = recipeTitles.map((title, index) => ({
        id: index + 1,
        userId: userId,
        title: title.trim(),
        description: "Click to see the full recipe",
        ingredients: JSON.stringify(ingredients),
      }));

      res.json({ recipes });
    } else {
      res.status(500).json({ message: "Invalid response from OpenAI API" });
    }
  } catch (error) {
    console.error("Error generating recipe:", error);
    res
      .status(500)
      .json({ message: "Error generating recipe", error: error.message });
  }
});

app.post("/generate-recipe-details", async (req, res) => {
  const { userId, title, ingredients } = req.body;
  try {
    const gptResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a retired world-class 3 star Michelin star chef and now you are focused more on suggesting home cooked recipes based in south east asia region",
        },
        {
          role: "user",
          content: `Provide a detailed recipe for the following dish: ${title} with these ingredients: ${ingredients.join(
            ", "
          )}`,
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
      top_p: 1,
      presence_penalty: 0,
      frequency_penalty: 0,
    });

    // Debugging: Log the full response
    console.log("OpenAI Response:", gptResponse);

    if (gptResponse && gptResponse.choices && gptResponse.choices.length > 0) {
      const recipeText = gptResponse.choices[0].message.content.trim();

      // Save the detailed recipe in the database
      const recipe = await prisma.recipe.create({
        data: {
          userId: userId,
          title: title,
          ingredients: JSON.stringify(ingredients),
          steps: recipeText,
        },
      });

      res.json({ recipe });
    } else {
      res.status(500).json({ message: "Invalid response from OpenAI API" });
    }
  } catch (error) {
    console.error("Error generating recipe details:", error);
    res
      .status(500)
      .json({
        message: "Error generating recipe details",
        error: error.message,
      });
  }
});

// Fetch user's past recipes
app.get("/user/:id/recipes", async (req, res) => {
  const userId = parseInt(req.params.id);

  try {
    const recipes = await prisma.recipe.findMany({
      where: { userId: userId },
    });

    res.json({ recipes });
  } catch (error) {
    console.error("Error fetching user recipes:", error);
    res
      .status(500)
      .json({ message: "Error fetching user recipes", error: error.message });
  }
});

// Delete a recipe
app.delete("/user/:userId/recipes/:recipeId", async (req, res) => {
  const userId = parseInt(req.params.userId);
  const recipeId = parseInt(req.params.recipeId);

  try {
    await prisma.recipe.delete({
      where: { id: recipeId, userId: userId },
    });

    res.json({ message: "Recipe deleted successfully" });
  } catch (error) {
    console.error("Error deleting recipe:", error);
    res
      .status(500)
      .json({ message: "Error deleting recipe", error: error.message });
  }
});

// Default route
app.get("/", (req, res) => {
  res.send("Welcome to the Recipe Generator API");
});

// Start server
const PORT = process.env.PORT || 3000; // Use the port Heroku provides or default to 3000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
