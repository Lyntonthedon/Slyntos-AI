// FIX: Provide content for authService.ts to resolve module not found error.
import { User } from '../types';

// This is a mock authentication service.
// In a real application, this would involve API calls to a backend.
export const login = async (username: string, password?: string): Promise<User> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  if (!username) {
    throw new Error('Username is required.');
  }

  // Mock validation: In a real app, you'd validate password, etc.
  // For this demo, any non-empty username is considered valid.
  
  // Create a mock user object. The ID could be generated more robustly.
  const user: User = {
    id: `user_${Date.now()}`,
    username: username,
  };

  return user;
};
