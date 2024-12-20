export const getUsers = (req, res) => {
  res.json({
    users: [
      { id: 1, name: 'John Doe' },
      { id: 2, name: 'Jane Doe' },
    ],
  });
};
export const createUser = (req, res) => {
  const { name } = req.body;
  res.json({ message: 'User created successfully', user: { name } });
};
