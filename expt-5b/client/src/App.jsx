import React, { useEffect, useMemo, useState } from "react";

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
  const [message, setMessage] = useState("Loading users...");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
      await fetchUsers();
    } catch (error) {
      setIsError(true);
      setMessage(error.message || "Create request failed");
      setIsLoading(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm("Delete this user?");
    if (!confirmed) {
      return;
    }

    try {
      setIsLoading(true);
      setIsError(false);
      setMessage("Deleting user...");

      const response = await fetch(`${API_BASE}/api/users/${id}`, {
        method: "DELETE"
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Unable to delete user");
      }

      setMessage("User deleted");
      await fetchUsers();
    } catch (error) {
      setIsError(true);
      setMessage(error.message || "Delete request failed");
      setIsLoading(false);
    }
  }

  async function handleQuickEdit(user) {
    const name = window.prompt("Updated name", user.name || "");
    if (name === null) {
      return;
    }

    const age = window.prompt("Updated age", String(user.age ?? ""));
    if (age === null) {
      return;
    }

    try {
      setIsLoading(true);
      setIsError(false);
      setMessage("Updating user...");

      const response = await fetch(`${API_BASE}/api/users/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), age: Number(age) })
      });

      const result = await response.json();
      if (!response.ok) {
        const updateMessage = Array.isArray(result.errors) ? result.errors.join(" | ") : result.message;
        throw new Error(updateMessage || "Unable to update user");
      }

      setMessage("User updated");
      await fetchUsers();
    } catch (error) {
      setIsError(true);
      setMessage(error.message || "Update request failed");
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

      <main className="app-layout">
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
            <p className="meta">Total {meta.total} | Page {meta.page}</p>
          </div>
          <p className={statusClass}>{message}</p>

          {users.length === 0 ? (
            <div className="empty">No students found for current filter.</div>
          ) : (
            <div className="card-grid">
              {users.map((user) => (
                <article key={user._id} className="user-card">
                  <div className="card-top">
                    <h3>{user.name}</h3>
                    <span className="age-pill">Age {user.age ?? "N/A"}</span>
                  </div>

                  <p className="minor">{user.email}</p>
                  <p className="minor">User ID: {user.userId}</p>
                  <p className="bio">{user.bio || "No bio"}</p>

                  <div className="tags">
                    {(user.hobbies?.length ? user.hobbies : ["none"]).map((hobby) => (
                      <span key={`${user._id}-${hobby}`} className="tag">
                        {hobby}
                      </span>
                    ))}
                  </div>

                  <div className="button-row">
                    <button className="btn btn-muted" onClick={() => handleQuickEdit(user)} disabled={isLoading}>
                      Edit
                    </button>
                    <button className="btn btn-danger" onClick={() => handleDelete(user._id)} disabled={isLoading}>
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
