import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  Edit,
  ArrowRightCircle,
  User,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import TaskModal from '../components/TaskModal';

export const Projects = () => {
  const { user, isAdmin, isManager } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await api.getTasks({
        status: statusFilter,
        priority: priorityFilter,
      });
      if (res.success) {
        setTasks(res.data);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [statusFilter, priorityFilter]);

  const handleSaveTask = async (taskData, id) => {
    if (id) {
      await api.updateTask(id, taskData);
      setFeedbackMsg('Task updated successfully!');
    } else {
      await api.createTask(taskData);
      setFeedbackMsg('Task created and assigned successfully!');
    }
    loadTasks();
    setTimeout(() => setFeedbackMsg(''), 3500);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.deleteTask(id);
      setFeedbackMsg('Task deleted successfully!');
      loadTasks();
      setTimeout(() => setFeedbackMsg(''), 3500);
    } catch (err) {
      alert(err.message || 'Failed to delete task');
    }
  };

  // Quick forward workflow transition: Pending -> In Progress -> Completed
  const handleQuickAdvance = async (task) => {
    let nextStatus = '';
    if (task.status === 'pending') nextStatus = 'in-progress';
    else if (task.status === 'in-progress') nextStatus = 'completed';
    else return;

    try {
      await api.updateTask(task._id, { status: nextStatus });
      setFeedbackMsg(`Task moved to ${nextStatus.toUpperCase()}!`);
      loadTasks();
      setTimeout(() => setFeedbackMsg(''), 3000);
    } catch (err) {
      alert(err.message || 'Could not update status');
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase())) ||
      (t.assignedTo?.username && t.assignedTo.username.toLowerCase().includes(search.toLowerCase()));
    return matchSearch;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FolderKanban size={26} color="var(--primary)" /> Tasks & Project Board
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            {isAdmin
              ? 'Admin Mode: View and manage all organizational tasks and assign tasks to any employee.'
              : isManager
              ? 'Manager Mode: Assign tasks to team employees, manage workload, and add tasks.'
              : 'Employee Mode: Manage assigned tasks and add personal work items.'}
          </p>
        </div>

        <button
          onClick={() => {
            setEditingTask(null);
            setIsModalOpen(true);
          }}
          className="btn btn-primary"
        >
          <Plus size={16} /> New Task
        </button>
      </div>

      {feedbackMsg && (
        <div style={{ padding: '12px 18px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', color: '#065f46', fontSize: '14px', fontWeight: '600', marginBottom: '20px' }}>
          ✓ {feedbackMsg}
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
        <div style={{ flex: '1 1 240px', position: 'relative' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, description or assignee..."
            style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13px', background: '#fff', color: '#334155' }}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13px', background: '#fff', color: '#334155' }}
          >
            <option value="">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Task List Grid */}
      {loading ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
          <div className="loading-spinner-ring" style={{ margin: '0 auto 12px' }}></div>
          Loading tasks chunk...
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center', color: '#64748b' }}>
          <FolderKanban size={40} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>No tasks found</h3>
          <p style={{ fontSize: '13px', marginTop: '4px' }}>Try adjusting your filters or click "New Task" to create one.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {filteredTasks.map((task) => {
            const isCompleted = task.status === 'completed';
            const isInProgress = task.status === 'in-progress';
            const isPending = task.status === 'pending';

            const assignedToUser = task.assignedTo?.username || task.user?.username || 'Self';
            const assignedByUser = task.assignedBy?.username || 'Self';

            let priorityBadgeColor = { bg: '#e2e8f0', text: '#475569' };
            if (task.priority === 'high') priorityBadgeColor = { bg: '#fee2e2', text: '#b91c1c' };
            if (task.priority === 'medium') priorityBadgeColor = { bg: '#fef3c7', text: '#b45309' };
            if (task.priority === 'low') priorityBadgeColor = { bg: '#dcfce7', text: '#15803d' };

            return (
              <div
                key={task._id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: `4px solid ${task.priority === 'high' ? '#ef4444' : task.priority === 'medium' ? '#f59e0b' : '#10b981'}`,
                  position: 'relative',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        textTransform: 'uppercase',
                        background: priorityBadgeColor.bg,
                        color: priorityBadgeColor.text,
                      }}
                    >
                      {task.priority} Priority
                    </span>

                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: '700',
                        padding: '3px 10px',
                        borderRadius: '20px',
                        background: isCompleted ? '#ecfdf5' : isInProgress ? '#eff6ff' : '#fffbeb',
                        color: isCompleted ? '#047857' : isInProgress ? '#1d4ed8' : '#b45309',
                      }}
                    >
                      {task.status.toUpperCase()}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
                    {task.title}
                  </h3>

                  {task.description && (
                    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px', lineHeight: '1.5' }}>
                      {task.description}
                    </p>
                  )}

                  {/* Assignee / Assigner Info */}
                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', marginBottom: '16px' }}>
                    <div style={{ color: '#334155', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={13} color="#4f46e5" /> Assigned To: <span style={{ color: '#0f172a' }}>{assignedToUser}</span>
                    </div>
                    {task.assignedBy && task.assignedBy._id !== task.user?._id && (
                      <div style={{ color: '#64748b', marginTop: '2px', fontSize: '11px' }}>
                        Assigned By: {assignedByUser} ({task.assignedBy?.role || 'Staff'})
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {/* Status Forward Advance Button */}
                  <div>
                    {!isCompleted ? (
                      <button
                        onClick={() => handleQuickAdvance(task)}
                        className="btn btn-sm"
                        style={{
                          background: isPending ? '#eff6ff' : '#ecfdf5',
                          color: isPending ? '#2563eb' : '#059669',
                          fontWeight: '600',
                        }}
                        title={isPending ? 'Start working on this task' : 'Mark task completed'}
                      >
                        <ArrowRightCircle size={14} /> {isPending ? 'Start Task' : 'Mark Complete'}
                      </button>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={14} /> Completed
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => {
                        setEditingTask(task);
                        setIsModalOpen(true);
                      }}
                      className="btn btn-secondary btn-sm"
                      title="Edit Task"
                    >
                      <Edit size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(task._id)}
                      className="btn btn-danger btn-sm"
                      title="Delete Task"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        task={editingTask}
      />
    </div>
  );
};

export default Projects;
