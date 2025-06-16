import mongoose from "mongoose";
const attendanceSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  date: Date,
  status: { type: String, enum: ['present', 'absent'] }
});
export default mongoose.model('Attendance', attendanceSchema);