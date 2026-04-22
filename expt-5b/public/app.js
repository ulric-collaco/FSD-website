const userForm = document.getElementById("user-form");
const filterForm = document.getElementById("filter-form");
const clearFiltersButton = document.getElementById("clearFilters");
const refreshButton = document.getElementById("loadUsers");
const userList = document.getElementById("user-list");
const statusElement = document.getElementById("status");
const metaElement = document.getElementById("meta");

function setStatus(message, isError = false) {
  statusElement.textContent = message;
  statusElement.style.color = isError ? "#a92f2f" : "#1b6d63";
}

function parseHobbies(value) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function getFilterParams() {
  const params = new URLSearchParams();

  const name = document.getElementById("searchName").value.trim();
  const minAge = document.getElementById("minAge").value.trim();
  const maxAge = document.getElementById("maxAge").value.trim();
  const text = document.getElementById("textSearch").value.trim();
  const sortBy = document.getElementById("sortBy").value;
  const order = document.getElementById("order").value;

  if (name) {
    params.set("name", name);
  }
  if (minAge) {
    params.set("minAge", minAge);
  }
  if (maxAge) {
    params.set("maxAge", maxAge);
  }
  if (text) {
    params.set("text", text);
  }

  params.set("sortBy", sortBy);
  params.set("order", order);
  params.set("limit", "25");

  return params;
}

function formatDate(rawValue) {
  if (!rawValue) {
    return "N/A";
  }

  const value = new Date(rawValue);
  if (Number.isNaN(value.getTime())) {
    return "N/A";
  }

  return value.toLocaleString();
}

function createUserCard(user) {
  const card = document.createElement("article");
  card.className = "user-card";

  const hobbies = Array.isArray(user.hobbies) && user.hobbies.length > 0
    ? user.hobbies
    : ["none"];

  const tags = hobbies.map((hobby) => `<span class="tag">${hobby}</span>`).join("");

  card.innerHTML = `
    <div class="user-head">
      <h3>${user.name}</h3>
      <span class="pill">Age ${user.age ?? "N/A"}</span>
    </div>
    <p class="user-meta">${user.email} | User ID: ${user.userId}</p>
    <p class="user-meta">Created: ${formatDate(user.createdAt)}</p>
    <p class="user-bio">${user.bio || "No bio"}</p>
    <div class="tags">${tags}</div>
    <div class="card-actions">
      <button type="button" class="btn btn-secondary" data-action="edit" data-id="${user._id}">Edit</button>
      <button type="button" class="btn btn-danger" data-action="delete" data-id="${user._id}">Delete</button>
    </div>
  `;

  return card;
}

function renderUsers(users) {
  userList.innerHTML = "";

  if (!users || users.length === 0) {
    userList.innerHTML = '<div class="empty">No users found for current filters.</div>';
    return;
  }

  users.forEach((user) => {
    userList.appendChild(createUserCard(user));
  });
}

async function loadUsers() {
  try {
    setStatus("Loading users...");

    const params = getFilterParams();
    params.set("_t", String(Date.now()));
    const response = await fetch(`/api/users?${params.toString()}`, {
      cache: "no-store"
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message || "Failed to fetch users");
    }

    renderUsers(payload.data || []);
    metaElement.textContent = `Total: ${payload.total ?? 0} | Page: ${payload.page ?? 1}`;
    setStatus("Users loaded successfully.");
  } catch (error) {
    setStatus(error.message || "Something went wrong", true);
  }
}

async function createUser(event) {
  event.preventDefault();

  const payload = {
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    age: document.getElementById("age").value ? Number(document.getElementById("age").value) : undefined,
    userId: document.getElementById("userId").value.trim(),
    hobbies: parseHobbies(document.getElementById("hobbies").value),
    bio: document.getElementById("bio").value.trim()
  };

  try {
    setStatus("Creating user...");

    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      const serverErrors = Array.isArray(result.errors) ? result.errors.join(" | ") : result.message;
      throw new Error(serverErrors || "Failed to create user");
    }

    userForm.reset();
    setStatus("User created successfully.");
    await loadUsers();
  } catch (error) {
    setStatus(error.message || "Unable to create user", true);
  }
}

async function deleteUser(userId) {
  const confirmed = window.confirm("Delete this user?");
  if (!confirmed) {
    return;
  }

  try {
    setStatus("Deleting user...");

    const response = await fetch(`/api/users/${userId}`, { method: "DELETE" });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Delete failed");
    }

    setStatus("User deleted.");
    await loadUsers();
  } catch (error) {
    setStatus(error.message || "Unable to delete user", true);
  }
}

async function editUser(userId) {
  const newName = window.prompt("Enter updated name (minimum 3 characters):");
  if (newName === null) {
    return;
  }

  const newAge = window.prompt("Enter updated age (0-120):");
  if (newAge === null) {
    return;
  }

  const payload = {
    name: newName.trim(),
    age: Number(newAge)
  };

  try {
    setStatus("Updating user...");

    const response = await fetch(`/api/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      const serverErrors = Array.isArray(result.errors) ? result.errors.join(" | ") : result.message;
      throw new Error(serverErrors || "Update failed");
    }

    setStatus("User updated.");
    await loadUsers();
  } catch (error) {
    setStatus(error.message || "Unable to update user", true);
  }
}

userForm.addEventListener("submit", createUser);
filterForm.addEventListener("submit", (event) => {
  event.preventDefault();
  loadUsers();
});

clearFiltersButton.addEventListener("click", () => {
  filterForm.reset();
  loadUsers();
});

refreshButton.addEventListener("click", loadUsers);

userList.addEventListener("click", (event) => {
  const target = event.target.closest("button");
  if (!target) {
    return;
  }

  const action = target.dataset.action;
  const userId = target.dataset.id;

  if (!userId) {
    return;
  }

  if (action === "delete") {
    deleteUser(userId);
  }

  if (action === "edit") {
    editUser(userId);
  }
});

loadUsers();
