import mongoose from "mongoose";
const schema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['admin', 'teacher', 'parent', 'student'], default: 'student' }
});
export default mongoose.model('User', schema);