const User = require("../models/User");

const ALLOWED_SORT_FIELDS = new Set(["name", "email", "age", "createdAt", "userId"]);

function toPositiveInt(value, fallbackValue) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallbackValue;
  }
  return parsed;
}

function toOptionalNumber(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function buildFilters(query) {
  const filters = {};

  if (query.name) {
    filters.name = { $regex: query.name, $options: "i" };
  }

  if (query.email) {
    filters.email = String(query.email).toLowerCase();
  }

  const minAge = toOptionalNumber(query.minAge);
  const maxAge = toOptionalNumber(query.maxAge);

  if (minAge !== undefined || maxAge !== undefined) {
    filters.age = {};

    if (minAge !== undefined) {
      filters.age.$gte = minAge;
    }

    if (maxAge !== undefined) {
      filters.age.$lte = maxAge;
    }
  }

  if (query.hobby) {
    filters.hobbies = query.hobby;
  }

  if (query.text) {
    filters.$text = { $search: query.text };
  }

  return filters;
}

function buildSort(sortByParam, orderParam) {
  const sortBy = ALLOWED_SORT_FIELDS.has(sortByParam) ? sortByParam : "createdAt";
  const direction = String(orderParam).toLowerCase() === "asc" ? 1 : -1;

  return { [sortBy]: direction };
}

async function createUser(req, res, next) {
  try {
    const user = await User.create(req.body);
    res.status(201).json({ message: "User created successfully", data: user });
  } catch (error) {
    next(error);
  }
}

async function getUsers(req, res, next) {
  try {
    const filters = buildFilters(req.query);
    const page = toPositiveInt(req.query.page, 1);
    const limit = toPositiveInt(req.query.limit, 10);
    const skip = (page - 1) * limit;
    const sort = buildSort(req.query.sortBy, req.query.order);

    if (req.query.explain === "true") {
      const explainResult = await User.find(filters)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .explain("executionStats");

      return res.status(200).json({
        message: "Explain output generated",
        executionStats: {
          totalKeysExamined: explainResult.executionStats.totalKeysExamined,
          totalDocsExamined: explainResult.executionStats.totalDocsExamined,
          executionTimeMillis: explainResult.executionStats.executionTimeMillis
        },
        winningPlan: explainResult.queryPlanner.winningPlan
      });
    }

    const [users, total] = await Promise.all([
      User.find(filters).sort(sort).skip(skip).limit(limit),
      User.countDocuments(filters)
    ]);

    return res.status(200).json({
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      data: users
    });
  } catch (error) {
    next(error);
  }
}

async function getUserById(req, res, next) {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ data: user });
  } catch (error) {
    next(error);
  }
}

async function updateUserById(req, res, next) {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User updated successfully", data: user });
  } catch (error) {
    next(error);
  }
}

async function deleteUserById(req, res, next) {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User deleted successfully", data: user });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUserById,
  deleteUserById
};
