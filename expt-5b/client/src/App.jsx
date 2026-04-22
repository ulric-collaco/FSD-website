// Custom Switch
function Switch({ checked, onChange, label }) {
  return (
    <label className="switch">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="slider" />
      {label && <span className="switch-label">{label}</span>}
    </label>
  );
}
import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
// Toast system
function Toast({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>{t.message}</div>
      ))}
    </div>
  );
}

// Animated Progress Bar (for multi-step, demo only)
function ProgressBar({ step, total }) {
  const percent = Math.round((step / total) * 100);
  return (
    <div className="progress-bar-shell">
      <div className="progress-bar" style={{ width: percent + "%" }} />
      <span className="progress-label">Step {step} of {total}</span>
    </div>
  );
}
// Avatar color palette
const AVATAR_COLORS = ["#1f8a7a", "#dc6f53", "#b95137", "#4e6377", "#c43636", "#f3b13b", "#5e60ce", "#3a86ff"];

function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name) {
  return name.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
}

function Avatar({ name }) {
  const color = getAvatarColor(name || "?");
  const initials = getInitials(name || "?");
  return (
    <span className="avatar" style={{ background: color }} title={name} aria-label={name}>
      {initials}
    </span>
  );
}

// Highlight search matches
function highlight(text, query) {
  if (!query) return text;
  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = String(text).split(re);
  return parts.map((part, i) =>
    re.test(part) ? <mark key={i}>{part}</mark> : part
  );
}

// Animated counter
function AnimatedNumber({ value, duration = 800 }) {
  const ref = useRef();
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    let start = ref.current || value;
    let startTime;
    function animate(ts) {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      setDisplay(Math.round(start + (value - start) * progress));
      if (progress < 1) requestAnimationFrame(animate);
      else ref.current = value;
    }
    requestAnimationFrame(animate);
    // eslint-disable-next-line
  }, [value]);
  return <span>{display}</span>;
}

function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {children}
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
      </div>
    </div>
  );
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

const initialForm = {
  name: "",
  email: "",
  age: "",
  userId: "",
  hobbies: "",
  bio: ""
};

const initialFilters = {
  name: "",
  minAge: "",
  maxAge: "",
  text: "",
  sortBy: "createdAt",
  order: "desc"
};

function parseHobbies(value) {
  if (!value.trim()) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function App() {
  const [form, setForm] = useState(initialForm);
  const [filters, setFilters] = useState(initialFilters);
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1 });
  const [allHobbies, setAllHobbies] = useState([]);
  const [message, setMessage] = useState("Loading users...");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editUser, setEditUser] = useState(null); // user object or null
  const [editForm, setEditForm] = useState(initialForm);
  const [deletingId, setDeletingId] = useState(null); // user id being deleted
  // Toast state
  const [toasts, setToasts] = useState([]);
  // Demo: progress bar state (simulate multi-step)
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  // Demo: switch state
  const [switchOn, setSwitchOn] = useState(false);
  // Toast helpers
  const showToast = useCallback((message, type = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts(ts => [...ts, { id, message, type }]);
    setTimeout(() => setToasts(ts => ts.filter(t => t.id !== id)), 2600);
  }, []);

  const statusClass = useMemo(() => (isError ? "status error" : "status"), [isError]);

  async function fetchUsers(activeFilters = filters) {
    const params = new URLSearchParams();

    if (activeFilters.name.trim()) {
      params.set("name", activeFilters.name.trim());
    }

    if (activeFilters.minAge.trim()) {
      params.set("minAge", activeFilters.minAge.trim());
    }

    if (activeFilters.maxAge.trim()) {
      params.set("maxAge", activeFilters.maxAge.trim());
    }

    if (activeFilters.text.trim()) {
      params.set("text", activeFilters.text.trim());
    }

    params.set("sortBy", activeFilters.sortBy);
    params.set("order", activeFilters.order);
    params.set("limit", "25");

    try {
      setIsLoading(true);
      setMessage("Loading users...");
      setIsError(false);

      const response = await fetch(`${API_BASE}/api/users?${params.toString()}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "Unable to fetch users");
      }

      setUsers(payload.data || []);
      setMeta({ total: payload.total || 0, page: payload.page || 1 });
      // Collect all hobbies for filter chips
      const hobbiesSet = new Set();
      (payload.data || []).forEach(u => (u.hobbies||[]).forEach(h => hobbiesSet.add(h)));
      setAllHobbies(Array.from(hobbiesSet).sort());
      setMessage("Users loaded");
    } catch (error) {
      setIsError(true);
      setMessage(error.message || "Unexpected error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateUser(event) {
    event.preventDefault();

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      age: form.age.trim() ? Number(form.age) : undefined,
      userId: form.userId.trim(),
      hobbies: parseHobbies(form.hobbies),
      bio: form.bio.trim()
    };

    try {
      setIsLoading(true);
      setIsError(false);
      setMessage("Creating user...");

      const response = await fetch(`${API_BASE}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        const validationMessage = Array.isArray(result.errors)
          ? result.errors.join(" | ")
          : result.message;
        throw new Error(validationMessage || "Unable to create user");
      }

      setForm(initialForm);
      setMessage("User created successfully");
      showToast("User created!", "success");
      await fetchUsers();
    } catch (error) {
      setIsError(true);
      setMessage(error.message || "Create request failed");
      showToast(error.message || "Create failed", "error");
      setIsLoading(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm("Delete this user?");
    if (!confirmed) return;
    setDeletingId(id);
    try {
      setIsError(false);
      setMessage("Deleting user...");
      const response = await fetch(`${API_BASE}/api/users/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to delete user");
      setMessage("User deleted");
      showToast("User deleted", "success");
      await fetchUsers();
    } catch (error) {
      setIsError(true);
      setMessage(error.message || "Delete request failed");
      showToast(error.message || "Delete failed", "error");
    } finally {
      setDeletingId(null);
    }
  }

  function handleQuickEdit(user) {
    setEditUser(user);
    setEditForm({
      name: user.name || "",
      email: user.email || "",
      age: user.age || "",
      userId: user.userId || "",
      hobbies: (user.hobbies || []).join(", "),
      bio: user.bio || ""
    });
  }

  async function handleEditSubmit(event) {
    event.preventDefault();
    try {
      setIsLoading(true);
      setIsError(false);
      setMessage("Updating user...");
      const payload = {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        age: editForm.age.trim() ? Number(editForm.age) : undefined,
        userId: editForm.userId.trim(),
        hobbies: parseHobbies(editForm.hobbies),
        bio: editForm.bio.trim()
      };
      const response = await fetch(`${API_BASE}/api/users/${editUser._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) {
        const updateMessage = Array.isArray(result.errors) ? result.errors.join(" | ") : result.message;
        throw new Error(updateMessage || "Unable to update user");
      }
      setMessage("User updated");
      setEditUser(null);
      showToast("User updated!", "success");
      await fetchUsers();
    } catch (error) {
      setIsError(true);
      setMessage(error.message || "Update request failed");
      showToast(error.message || "Update failed", "error");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page-shell">
      <div className="orb orb-coral" aria-hidden="true" />
      <div className="orb orb-teal" aria-hidden="true" />

      <Toast toasts={toasts} />
      <main className="app-layout">
        {/* Demo: Animated progress bar for multi-step */}
        <ProgressBar step={step} total={totalSteps} />
        <div className="progress-demo-row">
          <button className="btn btn-accent ripple" onClick={() => setStep(s => Math.max(1, s-1))} disabled={step===1}>Prev</button>
          <button className="btn btn-accent ripple" onClick={() => setStep(s => Math.min(totalSteps, s+1))} disabled={step===totalSteps}>Next</button>
          <Switch checked={switchOn} onChange={setSwitchOn} label={switchOn ? "On" : "Off"} />
        </div>
        <header className="hero panel">
          <p className="eyebrow">SE Computer Engineering | Experiment 5B</p>
          <h1>React User Management Console</h1>
          <p className="subtitle">
            Full-stack MongoDB lab UI for create, search, update, and delete operations.
          </p>
        </header>

        <section className="panel">
          <h2>Create Student</h2>
          <form className="grid" onSubmit={handleCreateUser}>
            <label>
              Name
              <input
                required
                minLength={3}
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </label>

            <label>
              Email
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              />
            </label>

            <label>
              Age
              <input
                type="number"
                min="0"
                max="120"
                value={form.age}
                onChange={(event) => setForm((prev) => ({ ...prev, age: event.target.value }))}
              />
            </label>

            <label>
              User ID
              <input
                required
                value={form.userId}
                onChange={(event) => setForm((prev) => ({ ...prev, userId: event.target.value }))}
              />
            </label>

            <label className="full-width">
              Hobbies (comma separated)
              <input
                value={form.hobbies}
                onChange={(event) => setForm((prev) => ({ ...prev, hobbies: event.target.value }))}
                placeholder="coding, music"
              />
            </label>

            <label className="full-width">
              Bio
              <textarea
                rows={3}
                value={form.bio}
                onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))}
                placeholder="Short profile bio"
              />
            </label>

            <div className="button-row full-width">
              <button className="btn btn-accent" disabled={isLoading} type="submit">
                {isLoading ? "Please wait..." : "Add Student"}
              </button>
              <button
                className="btn btn-muted"
                type="button"
                onClick={() => setForm(initialForm)}
                disabled={isLoading}
              >
                Clear
              </button>
            </div>
          </form>
        </section>

        <section className="panel">
          <h2>Filter</h2>
          <form
            className="grid"
            onSubmit={(event) => {
              event.preventDefault();
              fetchUsers(filters);
            }}
          >
            <label>
              Name
              <input
                value={filters.name}
                onChange={(event) => setFilters((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Search by name"
              />
            </label>

            <label>
              Text Search
              <input
                value={filters.text}
                onChange={(event) => setFilters((prev) => ({ ...prev, text: event.target.value }))}
                placeholder="Search bio"
              />
            </label>

            <label>
              Min Age
              <input
                type="number"
                min="0"
                max="120"
                value={filters.minAge}
                onChange={(event) => setFilters((prev) => ({ ...prev, minAge: event.target.value }))}
              />
            </label>

            <label>
              Max Age
              <input
                type="number"
                min="0"
                max="120"
                value={filters.maxAge}
                onChange={(event) => setFilters((prev) => ({ ...prev, maxAge: event.target.value }))}
              />
            </label>

            <label>
              Sort By
              <select
                value={filters.sortBy}
                onChange={(event) => setFilters((prev) => ({ ...prev, sortBy: event.target.value }))}
              >
                <option value="createdAt">Created At</option>
                <option value="name">Name</option>
                <option value="age">Age</option>
                <option value="email">Email</option>
              </select>
            </label>

            <label>
              Order
              <select
                value={filters.order}
                onChange={(event) => setFilters((prev) => ({ ...prev, order: event.target.value }))}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </label>

            <div className="button-row full-width">
              <button className="btn btn-accent" type="submit" disabled={isLoading}>
                Apply
              </button>
              <button
                className="btn btn-muted"
                type="button"
                onClick={() => {
                  setFilters(initialFilters);
                  fetchUsers(initialFilters);
                }}
                disabled={isLoading}
              >
                Reset
              </button>
            </div>
          </form>
        </section>

        <section className="panel users-panel">
          <div className="users-head">
            <h2>Students</h2>
            <div className="stats-row">
              <span className="stat">Total: <AnimatedNumber value={meta.total} /></span>
              <span className="stat">Page: <AnimatedNumber value={meta.page} /></span>
              <span className="stat">Avg Age: <AnimatedNumber value={users.length ? Math.round(users.reduce((a,b)=>a+(b.age||0),0)/users.length) : 0} /></span>
            </div>
            <div className="hobby-chips">
              {allHobbies.map(hobby => (
                <button
                  key={hobby}
                  className={
                    "chip" + (filters.text.toLowerCase() === hobby.toLowerCase() ? " chip-active" : "")
                  }
                  onClick={() => setFilters(f => ({ ...f, text: hobby }))}
                  type="button"
                  aria-label={`Filter by hobby ${hobby}`}
                >
                  {hobby}
                </button>
              ))}
            </div>
          </div>
          <p className={statusClass}>{message}</p>

          {users.length === 0 ? (
            <div className="empty">No students found for current filter.</div>
          ) : (
            <div className="card-grid">
              {users.map((user) => (
                <article key={user._id} className="user-card">
                  <div className="card-top">
                    <Avatar name={user.name} />
                    <h3>{highlight(user.name, filters.name)}</h3>
                    <span className="age-pill">Age {user.age ?? "N/A"}</span>
                  </div>
                  <p className="minor">{highlight(user.email, filters.text)}</p>
                  <p className="minor">User ID: {highlight(user.userId, filters.text)}</p>
                  <p className="bio">{highlight(user.bio, filters.text)}</p>
                  <div className="tags">
                    {(user.hobbies?.length ? user.hobbies : ["none"]).map((hobby) => (
                      <span key={`${user._id}-${hobby}`} className="tag">
                        {highlight(hobby, filters.text)}
                      </span>
                    ))}
                  </div>
                  <div className="button-row">
                    <button className="btn btn-muted ripple" onClick={() => handleQuickEdit(user)} disabled={isLoading}>
                      Edit
                    </button>
                    <button
                      className={
                        "btn btn-danger ripple" + (deletingId === user._id ? " deleting" : "")
                      }
                      onClick={() => handleDelete(user._id)}
                      disabled={isLoading || deletingId === user._id}
                    >
                      {deletingId === user._id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
      <Modal open={!!editUser} onClose={() => setEditUser(null)}>
        <h2>Edit Student</h2>
        <form className="grid" onSubmit={handleEditSubmit}>
          <label>
            Name
            <input
              required
              minLength={3}
              value={editForm.name}
              onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
            />
          </label>
          <label>
            Email
            <input
              required
              type="email"
              value={editForm.email}
              onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
            />
          </label>
          <label>
            Age
            <input
              type="number"
              min="0"
              max="120"
              value={editForm.age}
              onChange={e => setEditForm(f => ({ ...f, age: e.target.value }))}
            />
          </label>
          <label>
            User ID
            <input
              required
              value={editForm.userId}
              onChange={e => setEditForm(f => ({ ...f, userId: e.target.value }))}
            />
          </label>
          <label className="full-width">
            Hobbies (comma separated)
            <input
              value={editForm.hobbies}
              onChange={e => setEditForm(f => ({ ...f, hobbies: e.target.value }))}
              placeholder="coding, music"
            />
          </label>
          <label className="full-width">
            Bio
            <textarea
              rows={3}
              value={editForm.bio}
              onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
              placeholder="Short profile bio"
            />
          </label>
          <div className="button-row full-width">
            <button className="btn btn-accent" disabled={isLoading} type="submit">
              {isLoading ? "Please wait..." : "Update"}
            </button>
            <button
              className="btn btn-muted"
              type="button"
              onClick={() => setEditUser(null)}
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default App;
