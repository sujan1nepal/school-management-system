import mongoose from "mongoose";
const studentSchema = new mongoose.Schema({
  name: String,
  grade: String,
  parentEmail: String,
  // Add more fields as needed
});
export default mongoose.model('Student', studentSchema);