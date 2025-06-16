import express from 'express';
import Student from '../models/Student.js';
const router = express.Router();

// Create
router.post('/', async (req, res) => {
  const student = await Student.create(req.body);
  res.json(student);
});
// Read
router.get('/', async (req, res) => {
  const students = await Student.find();
  res.json(students);
});
// Update
router.put('/:id', async (req, res) => {
  const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(student);
});
// Delete
router.delete('/:id', async (req, res) => {
  await Student.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

export default router;