import { User } from '../types';
import { addUser, getUserByUsername } from './dbService';

const PAID_ACCESS_CODE = 'SLYNTOS@2025';

export const register = async (username: string, password: string, profilePicture: string, accessCode?: string): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

  const existingUser = await getUserByUsername(username);
  if (existingUser) {
    throw new Error('Username already exists.');
  }

  // "Hash" the password using base64 for this simulation
  const hashedPassword = btoa(password);
  
  // Determine plan based on code, trimming whitespace for better UX
  const plan = accessCode?.trim() === PAID_ACCESS_CODE ? 'paid' : 'free';

  const newUser: User = {
    id: `user_${Date.now()}`,
    username,
    password: hashedPassword,
    profilePicture,
    plan,
  };

  await addUser(newUser);

  // Return user object without the password for security
  const { password: _, ...userToReturn } = newUser;
  return userToReturn;
};


export const login = async (username: string, password: string): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

  const userRecord = await getUserByUsername(username);

  // Combine checks for user existence and password validity into one clear block.
  if (!userRecord || !userRecord.password) {
    // User not found or the record is corrupted (missing password)
    throw new Error('Invalid username or password.');
  }
  
  // Use a try-catch for atob in case of corrupted data
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
  // Ensure backward compatibility for users created before plans existed
  if (!userToReturn.plan) {
      userToReturn.plan = 'free';
  }
  return userToReturn;
};