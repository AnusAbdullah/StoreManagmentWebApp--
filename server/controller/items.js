// const { Item } = require("../models/items.js"); // Assuming you have a model defined for Item
import Item from "../models/items.js";

export const createItem = async (req, res) => {
  try {
    const { name, brand, pattern, size, origin, dot, costPrice, price, quantity } = req.body;
    const category = req.body.category || req.body.catagory || "Passenger Car";
    const newItem = await Item.create({
      name: name || `${brand || "Tyre"} ${pattern || ""}`.trim(),
      brand: brand || "",
      pattern: pattern || "",
      size: String(size ?? ""),
      category,
      origin: origin || "",
      dot: dot || "",
      costPrice: Number(costPrice || 0),
      price: Number(price || 0),
      quantity: Number(quantity || 0),
    });

    const items = await Item.findAll();

    res.status(201).json(items);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const getAllItems = async (req, res) => {
  try {
    const items = await Item.findAll();
    res.status(200).json(items);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const updateItemById = async (req, res) => {
  try {
    const { id, name, brand, pattern, size, category, origin, dot, costPrice, price, quantity } = req.body;
    const updatedItem = await Item.findByPk(id);
    if (!updatedItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (name !== undefined) updatedItem.name = name;
    if (brand !== undefined) updatedItem.brand = brand;
    if (pattern !== undefined) updatedItem.pattern = pattern;
    if (size !== undefined) updatedItem.size = String(size);
    if (category !== undefined) updatedItem.category = category;
    if (origin !== undefined) updatedItem.origin = origin;
    if (dot !== undefined) updatedItem.dot = dot;
    if (costPrice !== undefined) updatedItem.costPrice = Number(costPrice);
    if (price !== undefined) updatedItem.price = Number(price);
    if (quantity !== undefined) updatedItem.quantity = Number(quantity);

    await updatedItem.save();

    res.status(200).json(updatedItem);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const deleteItemById = async (req, res) => {
  try {
    const { id } = req.params;
    await Item.destroy({ where: { id } });
    res.status(200).json({ msg: `Deleted the item with ID: ${id}` });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};
