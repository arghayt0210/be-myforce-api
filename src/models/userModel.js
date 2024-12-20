export class User {
  constructor(name) {
    this.name = name;
  }
  static findAll() {
    // Simulate database query
    return Promise.resolve([
      { id: 1, name: 'John Doe' },
      { id: 2, name: 'Jane Doe' },
    ]);
  }
}
