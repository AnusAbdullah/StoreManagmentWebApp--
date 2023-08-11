import mongoose from "mongoose";
const { Schema } = mongoose;

const tableSchema = new Schema({
  name: String,
  phone: Number,
  address: String,
});
mongoose.set("strictQuery", true);
export default new mongoose.model("companies", tableSchema);