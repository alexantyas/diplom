// Имитация задержки сети
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Моковые данные
const mockData = {
  users: [
    { id: 1, name: 'Иван Иванов', email: 'ivan@example.com', role: 'admin' },
    { id: 2, name: 'Петр Петров', email: 'petr@example.com', role: 'user' },
    { id: 3, name: 'Анна Сидорова', email: 'anna@example.com', role: 'user' }
  ]
};

// API методы
export const api = {
  async getUsers() {
    await delay(500);
    return [...mockData.users];
  },

  async getUserById(id) {
    await delay(300);
    return mockData.users.find(user => user.id === id);
  },

  async createUser(userData) {
    await delay(700);
    const newUser = {
      id: mockData.users.length + 1,
      ...userData
    };
    mockData.users.push(newUser);
    return newUser;
  },

  async updateUser(id, userData) {
    await delay(500);
    const index = mockData.users.findIndex(user => user.id === id);
    if (index === -1) throw new Error('User not found');
    
    mockData.users[index] = {
      ...mockData.users[index],
      ...userData
    };
    return mockData.users[index];
  },

  async deleteUser(id) {
    await delay(600);
    const index = mockData.users.findIndex(user => user.id === id);
    if (index === -1) throw new Error('User not found');
    
    mockData.users.splice(index, 1);
    return true;
  }
}; 