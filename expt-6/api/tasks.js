import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  deadline: Date,
  status: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' }
});

const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);

const tasksHandler = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI);
  }

  const { method, query, body } = req;
  const id = query.id;

  try {
    if (method === 'GET') {
      const tasks = await Task.find({});
      return res.status(200).json(tasks);
    }

    if (method === 'POST') {
      const task = new Task(body);
      await task.save();
      return res.status(201).json(task);
    }

    if (method === 'PUT') {
      if (!id) return res.status(400).json({ error: 'ID required' });
      const task = await Task.findByIdAndUpdate(id, body, { new: true });
      return res.status(200).json(task);
    }

    if (method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'ID required' });
      await Task.findByIdAndDelete(id);
      return res.status(200).json({ message: 'Deleted' });
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({ error: `Method ${method} Not Allowed` });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export default tasksHandler;
