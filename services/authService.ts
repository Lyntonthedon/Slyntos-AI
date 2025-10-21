import { User } from '../types';

const USERS_DB_KEY = 'slyntos_ai_users_db';

// Helper to get users from localStorage
const getUsers = (): User[] => {
  try {
    const usersJson = localStorage.getItem(USERS_DB_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
  } catch (e) {
    return [];
  }
};

// Helper to save users to localStorage
const saveUsers = (users: User[]): void => {
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
};

export const register = async (username: string, password: string, profilePicture: string): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

  const users = getUsers();

  if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
    throw new Error('Username already exists.');
  }

  // "Hash" the password using base64 for this simulation
  const hashedPassword = btoa(password);

  const newUser: User = {
    id: `user_${Date.now()}`,
    username,
    password: hashedPassword,
    profilePicture,
  };

  users.push(newUser);
  saveUsers(users);

  // Return user object without the password for security
  const { password: _, ...userToReturn } = newUser;
  return userToReturn;
};


export const login = async (username: string, password: string): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

  const users = getUsers();
  const userRecord = users.find(u => u.username.toLowerCase() === username.toLowerCase());

  // Combine checks for user existence and password validity into one clear block.
  if (!userRecord || !userRecord.password) {
    // User not found or the record is corrupted (missing password)
    throw new Error('Invalid username or password.');
  }
  
  // Use a try-catch for atob in case of corrupted data in localStorage
  let decodedPassword;
  try {
      decodedPassword = atob(userRecord.password);
  } catch (e) {
      console.error("Failed to decode password for user:", username, e);
      // Present a generic error to the user for security
      throw new Error("Invalid username or password.");
  }

  if (decodedPassword !== password) {
    // Password does not match
    throw new Error('Invalid username or password.');
  }
  
  // If all checks pass, return the user object without the password hash.
  const { password: _, ...userToReturn } = userRecord;
  return userToReturn;
};