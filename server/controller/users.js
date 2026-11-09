import User from "../models/users.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "store_management_jwt_secret_key_2026";

export const createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: "User with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password: hashedPassword });

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, name: newUser.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User created successfully",
      user: { id: newUser.id, name: newUser.name, email: newUser.email },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({ attributes: { exclude: ["password"] } });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};

export const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Support both bcrypt hashes and legacy plain-text during migration
    let isMatch = false;
    if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$")) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = user.password === password;
      if (isMatch) {
        // Upgrade legacy password to bcrypt hash
        const newHash = await bcrypt.hash(password, 10);
        await user.update({ password: newHash });
      }
    }

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Authentication successful",
      user: { id: user.id, name: user.name, email: user.email },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};

export const deleteUserByEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const deletedUser = await User.destroy({ where: { email } });

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};

export const forgetPassword = async (req, res) => {
  try {
    const { email, name, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const [rowsUpdated] = await User.update(
      { name, password: hashedPassword },
      { where: { email } }
    );

    if (rowsUpdated === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};
