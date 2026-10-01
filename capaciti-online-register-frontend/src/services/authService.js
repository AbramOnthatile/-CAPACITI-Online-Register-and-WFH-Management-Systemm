import { mockUsers } from '../data/mockUsers';

export const login = async (email, password) => {
  await new Promise((resolve) => setTimeout(resolve, 600));

  const user = mockUsers.find(
    (entry) => entry.email.toLowerCase() === email.toLowerCase() && entry.password === password
  );

  if (!user) {
    return {
      success: false,
      message: 'Invalid email or password',
    };
  }

  return {
    success: true,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      cohort: user.cohort,
      candidateId: user.candId,
      avatar: user.avatar,
    },
  };
};

export const getCurrentUser = () => {
  const stored = localStorage.getItem('capaciti-user');
  return stored ? JSON.parse(stored) : null;
};
