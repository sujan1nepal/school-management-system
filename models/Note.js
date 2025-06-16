import mongoose from "mongoose";
const noteSchema = new mongoose.Schema({
  title: String,
  fileUrl: String,
  grade: String,
  subject: String,
  chapter: String,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});
export default mongoose.model('Note', noteSchema);