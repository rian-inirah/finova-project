const request = require('supertest');
const app = require('../server');
const db = require('../models');
const bcrypt = require('bcryptjs');

describe('Items Management', () => {
  let token;
  let testUser;

  beforeAll(async () => {
    // Setup test database
    await db.sequelize.sync({ force: true });
    
    // Create test user
    const hashedPassword = await bcrypt.hash('testpassword', 10);
    testUser = await db.User.create({
      username: 'testuser',
      password: hashedPassword,
      role: 'operator',
      isActive: true
    });

    // Get authentication token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'testuser',
        password: 'testpassword'
      });
    
    token = loginResponse.body.token;
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe('POST /api/items', () => {
    it('should create a new item', async () => {
      const response = await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Item',
          price: 25.50
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('item');
      expect(response.body.item.name).toBe('Test Item');
      expect(response.body.item.price).toBe('25.50');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: '',
          price: -10
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({
          name: 'Test Item',
          price: 25.50
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/items', () => {
    beforeEach(async () => {
      // Create test items
      await db.Item.bulkCreate([
        {
          userId: testUser.id,
          name: 'Item 1',
          price: 10.00,
          isActive: true
        },
        {
          userId: testUser.id,
          name: 'Item 2',
          price: 20.00,
          isActive: true
        },
        {
          userId: testUser.id,
          name: 'Special Item',
          price: 30.00,
          isActive: true
        }
      ]);
    });

    afterEach(async () => {
      // Clean up test items
      await db.Item.destroy({ where: { userId: testUser.id } });
    });

    it('should get all items', async () => {
      const response = await request(app)
        .get('/api/items')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
      expect(response.body.items.length).toBe(3);
    });

    it('should search items by name', async () => {
      const response = await request(app)
        .get('/api/items?search=Special')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.items.length).toBe(1);
      expect(response.body.items[0].name).toBe('Special Item');
    });
  });

  describe('PUT /api/items/:id', () => {
    let testItem;

    beforeEach(async () => {
      testItem = await db.Item.create({
        userId: testUser.id,
        name: 'Original Item',
        price: 15.00,
        isActive: true
      });
    });

    afterEach(async () => {
      await db.Item.destroy({ where: { id: testItem.id } });
    });

    it('should update an existing item', async () => {
      const response = await request(app)
        .put(`/api/items/${testItem.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Item',
          price: 25.00
        });

      expect(response.status).toBe(200);
      expect(response.body.item.name).toBe('Updated Item');
      expect(response.body.item.price).toBe('25.00');
    });

    it('should reject update for non-existent item', async () => {
      const response = await request(app)
        .put('/api/items/99999')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Item',
          price: 25.00
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/items/:id', () => {
    let testItem;

    beforeEach(async () => {
      testItem = await db.Item.create({
        userId: testUser.id,
        name: 'Item to Delete',
        price: 15.00,
        isActive: true
      });
    });

    it('should delete an item with confirmation', async () => {
      const response = await request(app)
        .delete(`/api/items/${testItem.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          confirm: true
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');

      // Verify item is soft deleted
      const deletedItem = await db.Item.findByPk(testItem.id);
      expect(deletedItem.isActive).toBe(false);
    });

    it('should reject deletion without confirmation', async () => {
      const response = await request(app)
        .delete(`/api/items/${testItem.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          confirm: false
        });

      expect(response.status).toBe(400);
    });
  });
});
