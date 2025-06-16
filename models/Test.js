import mongoose from "mongoose";
const testSchema = new mongoose.Schema({
  subject: String,
  chapter: String,
  date: Date,
  marks: [{ student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' }, score: Number }]
});
export default mongoose.model('Test', testSchema);