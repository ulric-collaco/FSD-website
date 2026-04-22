import { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', deadline: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const normalizeTasks = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.tasks)) return data.tasks;
    return [];
  };

  const fetchTasks = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await axios.get('/api/tasks');
      const normalizedTasks = normalizeTasks(res.data);

      if (!Array.isArray(res.data) && !Array.isArray(res.data?.tasks)) {
        console.error('Unexpected /api/tasks response shape. Type:', typeof res.data);
        setErrorMessage('Could not load tasks: unexpected response from API.');
      }

      setTasks(normalizedTasks);
    } catch (error) {
      setTasks([]);
      setErrorMessage('Error fetching tasks. Make sure backend/API is running.');
      console.error('Error fetching tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      await axios.post('/api/tasks', form);
      setForm({ title: '', description: '', deadline: '' });
      fetchTasks();
    } catch (error) {
      setErrorMessage('Error adding task.');
      console.error('Error adding task:', error);
    }
  };

  const toggleStatus = async (task) => {
    setErrorMessage('');

    try {
      const newStatus = task.status === 'Pending' ? 'Completed' : 'Pending';
      await axios.put(`/api/tasks?id=${task._id}`, { status: newStatus });
      fetchTasks();
    } catch (error) {
      setErrorMessage('Error updating task status.');
      console.error('Error updating task:', error);
    }
  };

  const deleteTask = async (id) => {
    setErrorMessage('');

    try {
      await axios.delete(`/api/tasks?id=${id}`);
      fetchTasks();
    } catch (error) {
      setErrorMessage('Error deleting task.');
      console.error('Error deleting task:', error);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Task Tracker System</h1>
      </header>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Title</label>
          <input 
            type="text" 
            name="title" 
            value={form.title} 
            onChange={handleChange} 
            required 
          />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea 
            name="description" 
            value={form.description} 
            onChange={handleChange} 
            rows="3"
          />
        </div>
        <div className="form-group">
          <label>Deadline</label>
          <input 
            type="date" 
            name="deadline" 
            value={form.deadline} 
            onChange={handleChange} 
          />
        </div>
        <button type="submit">Add Task</button>
      </form>

      <div className="task-list">
        {isLoading && <p style={{color: 'var(--text-muted)'}}>Loading tasks...</p>}
        {errorMessage && <p style={{color: 'crimson'}}>{errorMessage}</p>}
        {tasks.map(task => (
          <div key={task._id} className={`task-card ${task.status === 'Completed' ? 'completed' : ''}`}>
            <div className="task-content">
              <h3>{task.title}</h3>
              <div className="task-meta">
                {task.description && <p>{task.description}</p>}
                {task.deadline && <p>Deadline: {new Date(task.deadline).toLocaleDateString()}</p>}
                <p>Status: {task.status}</p>
              </div>
            </div>
            <div className="task-actions">
              <button className="outline" onClick={() => toggleStatus(task)}>
                {task.status === 'Pending' ? 'Complete' : 'Undo'}
              </button>
              <button className="danger outline" onClick={() => deleteTask(task._id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
        {!isLoading && tasks.length === 0 && <p style={{color: 'var(--text-muted)'}}>No tasks found. Add a task above.</p>}
      </div>
    </div>
  );
}

export default App;
