import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { X, Plus, Edit2, AlertCircle } from 'lucide-react';

export const TaskModal = ({ isOpen, onClose, onSave, task = null }) => {
  const { user, isAdmin, isManager } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('pending');
  const [assignedTo, setAssignedTo] = useState('');
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!task;

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'medium');
      setStatus(task.status || 'pending');
      setAssignedTo(task.assignedTo?._id || task.user?._id || user?.id || '');
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatus('pending');
      setAssignedTo(user?.id || '');
    }
    setError('');
  }, [task, isOpen, user]);

  useEffect(() => {
    if ((isAdmin || isManager) && isOpen) {
      setLoadingUsers(true);
      api.getUsers()
        .then((res) => {
          if (res.success && res.users) {
            setUsersList(res.users);
          }
        })
        .catch((err) => console.error('Failed to load user list:', err))
        .finally(() => setLoadingUsers(false));
    }
  }, [isAdmin, isManager, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        priority,
        status,
      };

      if (isAdmin || isManager) {
        payload.assignedTo = assignedTo || user?.id;
      }

      await onSave(payload, task?._id);
      onClose();
    } catch (err) {
      setError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Status options with forward only indicator
  const statusRanks = { pending: 1, 'in-progress': 2, completed: 3 };
  const currentRank = task ? statusRanks[task.status] || 1 : 1;

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isEditing ? <Edit2 size={18} color="var(--primary)" /> : <Plus size={18} color="var(--primary)" />}
            {isEditing ? 'Update Task' : 'Create New Task'}
          </h2>
          <button onClick={onClose} style={{ color: '#64748b', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ margin: '16px 24px 0', padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {/* Title */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
              Task Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement performance lazy loading"
              required
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add key deliverables, acceptance criteria, or notes..."
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', outline: 'none', resize: 'vertical' }}
            />
          </div>

          {/* RBAC: Assignee Selector for Admin / Manager */}
          {(isAdmin || isManager) && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                {isAdmin ? 'Assign To (Any User / Employee)' : 'Assign To (My Team / Employee)'}
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', background: '#fff' }}
              >
                <option value={user?.id}>Assign to Myself ({user?.username} - {user?.role})</option>
                {usersList
                  .filter((u) => u._id !== user?.id)
                  .map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.username} ({u.email}) — [{u.role.toUpperCase()}]
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Priority & Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', background: '#fff' }}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', background: '#fff' }}
              >
                <option value="pending" disabled={isEditing && currentRank > 1}>
                  Pending {isEditing && currentRank > 1 ? '(Locked)' : ''}
                </option>
                <option value="in-progress" disabled={isEditing && currentRank > 2}>
                  In Progress {isEditing && currentRank > 2 ? '(Locked)' : ''}
                </option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : isEditing ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
