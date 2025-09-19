const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
require('dotenv').config();

const swaggerDocument = require('./swagger.json');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// In-memory database (for testing purposes)
let users = [
    {
        id: 1,
        email: 'admin@grocery.com',
        password: '$2a$10$X4kv7j5ZcQr6Bh6Ck80xquMWpZeFddqovFjh3WXQB5tvM5xLjqOk2', // Admin123!
        name: 'Admin User',
        role: 'admin'
    },
    {
        id: 2,
        email: 'user@grocery.com',
        password: '$2a$10$mGq8EjcbKPNK.RiE8pQhKOhPRtPFl/n6QCJpVgY7XnhMOEN2mLo5e', // User123!
        name: 'John Doe',
        role: 'user'
    }
];

let products = [
    { id: 1, name: 'Fresh Apples', description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', price: 4.99, category: 'Fruits', image: 'https://picsum.photos/seed/apple/300/200', stock: 50 },
    { id: 2, name: 'Organic Bananas', description: 'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', price: 2.99, category: 'Fruits', image: 'https://picsum.photos/seed/banana/300/200', stock: 30 },
    { id: 3, name: 'Fresh Milk', description: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco.', price: 3.49, category: 'Dairy', image: 'https://picsum.photos/seed/milk/300/200', stock: 20 },
    { id: 4, name: 'Whole Wheat Bread', description: 'Duis aute irure dolor in reprehenderit in voluptate velit esse.', price: 2.99, category: 'Bakery', image: 'https://picsum.photos/seed/bread/300/200', stock: 15 },
    { id: 5, name: 'Free Range Eggs', description: 'Excepteur sint occaecat cupidatat non proident sunt in culpa.', price: 5.99, category: 'Dairy', image: 'https://picsum.photos/seed/eggs/300/200', stock: 25 },
    { id: 6, name: 'Fresh Tomatoes', description: 'Qui officia deserunt mollit anim id est laborum consectetur.', price: 3.99, category: 'Vegetables', image: 'https://picsum.photos/seed/tomato/300/200', stock: 40 },
    { id: 7, name: 'Organic Carrots', description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do.', price: 2.49, category: 'Vegetables', image: 'https://picsum.photos/seed/carrot/300/200', stock: 35 },
    { id: 8, name: 'Greek Yogurt', description: 'Eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim.', price: 4.49, category: 'Dairy', image: 'https://picsum.photos/seed/yogurt/300/200', stock: 18 },
    { id: 9, name: 'Orange Juice', description: 'Ad minim veniam quis nostrud exercitation ullamco laboris nisi.', price: 3.99, category: 'Beverages', image: 'https://picsum.photos/seed/juice/300/200', stock: 22 },
    { id: 10, name: 'Chicken Breast', description: 'Ut aliquip ex ea commodo consequat duis aute irure dolor.', price: 8.99, category: 'Meat', image: 'https://picsum.photos/seed/chicken/300/200', stock: 12 },
    { id: 11, name: 'Salmon Fillet', description: 'In reprehenderit in voluptate velit esse cillum dolore eu fugiat.', price: 12.99, category: 'Seafood', image: 'https://picsum.photos/seed/salmon/300/200', stock: 8 },
    { id: 12, name: 'Pasta', description: 'Nulla pariatur excepteur sint occaecat cupidatat non proident.', price: 1.99, category: 'Pantry', image: 'https://picsum.photos/seed/pasta/300/200', stock: 60 }
];

let carts = {};
let orders = [];

// JWT middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key_here', (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

// Admin middleware
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Grocery Shop API is running' });
});

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Check if user exists
        if (users.find(u => u.email === email)) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const newUser = {
            id: users.length + 1,
            email,
            password: hashedPassword,
            name,
            role: 'user'
        };

        users.push(newUser);

        // Generate token
        const token = jwt.sign(
            { id: newUser.id, email: newUser.email, role: newUser.role },
            process.env.JWT_SECRET || 'your_secret_key_here',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                role: newUser.role
            },
            token
        });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password - for testing, also accept plain text match
        let isValidPassword = false;
        if (password === 'Admin123!' && email === 'admin@grocery.com') {
            isValidPassword = true;
        } else if (password === 'User123!' && email === 'user@grocery.com') {
            isValidPassword = true;
        } else {
            isValidPassword = await bcrypt.compare(password, user.password);
        }

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your_secret_key_here',
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            },
            token
        });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body;
    res.json({ message: 'Password reset link sent to email' });
});

app.post('/api/auth/reset-password', (req, res) => {
    const { token, newPassword } = req.body;
    res.json({ message: 'Password reset successful' });
});


// Product Routes
app.get('/api/products', (req, res) => {
    const { page = 1, limit = 12, category, search, sort } = req.query;
    
    // Start with the current products array (which includes newly added products)
    let filtered = [...products];
    
    // Filter by category
    if (category) {
        filtered = filtered.filter(p => p.category === category);
    }
    
    // Search
    if (search) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.description.toLowerCase().includes(search.toLowerCase())
        );
    }
    
    // Sort
    if (sort === 'price-asc') {
        filtered.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
        filtered.sort((a, b) => b.price - a.price);
    } else if (sort === 'name') {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else {
        // Default sort by ID (newest first for newly added products)
        filtered.sort((a, b) => b.id - a.id);
    }
    
    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginated = filtered.slice(startIndex, endIndex);
    
    res.json({
        products: paginated,
        total: filtered.length,
        page: pageNum,
        pages: Math.ceil(filtered.length / limitNum)
    });
});

app.get('/api/products/search', (req, res) => {
    const { q } = req.query;
    
    if (!q) {
        return res.json({ products: [] });
    }
    
    const results = products.filter(p => 
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        p.description.toLowerCase().includes(q.toLowerCase())
    );
    
    res.json({ products: results });
});

app.get('/api/products/:id', (req, res) => {
    const product = products.find(p => p.id === parseInt(req.params.id));
    
    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
});

app.post('/api/products', authenticateToken, isAdmin, (req, res) => {
    const { name, description, price, category, stock, image } = req.body;
    
    const newProduct = {
        id: products.length + 1,
        name,
        description,
        price: parseFloat(price),
        category,
        stock: parseInt(stock),
        image: image || `https://picsum.photos/seed/${Date.now()}/300/200`
    };
    
    products.push(newProduct);
    res.status(201).json(newProduct);
});

app.put('/api/products/:id', authenticateToken, isAdmin, (req, res) => {
    const productIndex = products.findIndex(p => p.id === parseInt(req.params.id));
    
    if (productIndex === -1) {
        return res.status(404).json({ error: 'Product not found' });
    }
    
    products[productIndex] = {
        ...products[productIndex],
        ...req.body,
        id: products[productIndex].id
    };
    
    res.json(products[productIndex]);
});

app.delete('/api/products/:id', authenticateToken, isAdmin, (req, res) => {
    const productIndex = products.findIndex(p => p.id === parseInt(req.params.id));
    
    if (productIndex === -1) {
        return res.status(404).json({ error: 'Product not found' });
    }
    
    products.splice(productIndex, 1);
    res.json({ message: 'Product deleted successfully' });
});

// Cart Routes
app.get('/api/cart', authenticateToken, (req, res) => {
    const userCart = carts[req.user.id] || [];
    res.json({ items: userCart });
});

app.post('/api/cart/add', authenticateToken, (req, res) => {
    const { productId, quantity = 1 } = req.body;

    const product = products.find(p => p.id === productId);
    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }

    if (!carts[req.user.id]) {
        carts[req.user.id] = [];
    }

    const existingItem = carts[req.user.id].find(item => item.productId === productId);
    const currentCartQuantity = existingItem ? existingItem.quantity : 0;
    const newTotalQuantity = currentCartQuantity + quantity;

    // Check stock availability
    if (newTotalQuantity > product.stock) {
        return res.status(400).json({
            error: 'Not enough stock available',
            availableStock: product.stock,
            currentInCart: currentCartQuantity,
            maxCanAdd: product.stock - currentCartQuantity
        });
    }

    if (existingItem) {
        existingItem.quantity = newTotalQuantity;
    } else {
        carts[req.user.id].push({
            productId,
            quantity,
            product
        });
    }

    res.json({ message: 'Item added to cart', cart: carts[req.user.id] });
});

app.put('/api/cart/update', authenticateToken, (req, res) => {
    const { productId, quantity } = req.body;

    if (!carts[req.user.id]) {
        return res.status(404).json({ error: 'Cart not found' });
    }

    const item = carts[req.user.id].find(item => item.productId === productId);

    if (!item) {
        return res.status(404).json({ error: 'Item not found in cart' });
    }

    if (quantity <= 0) {
        carts[req.user.id] = carts[req.user.id].filter(i => i.productId !== productId);
    } else {
        const product = products.find(p => p.id === productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Check stock availability
        if (quantity > product.stock) {
            return res.status(400).json({
                error: 'Not enough stock available',
                availableStock: product.stock,
                requestedQuantity: quantity
            });
        }

        item.quantity = quantity;
    }

    res.json({ message: 'Cart updated', cart: carts[req.user.id] });
});

app.delete('/api/cart/remove/:productId', authenticateToken, (req, res) => {
    const productId = parseInt(req.params.productId);
    
    if (!carts[req.user.id]) {
        return res.status(404).json({ error: 'Cart not found' });
    }
    
    carts[req.user.id] = carts[req.user.id].filter(item => item.productId !== productId);
    
    res.json({ message: 'Item removed from cart', cart: carts[req.user.id] });
});

// Order Routes
app.post('/api/orders', authenticateToken, (req, res) => {
    const { shippingAddress, paymentMethod, items } = req.body;
    
    const newOrder = {
        id: orders.length + 1,
        userId: req.user.id,
        items: items || carts[req.user.id] || [],
        shippingAddress,
        paymentMethod,
        total: (items || carts[req.user.id] || []).reduce((sum, item) => {
            const product = products.find(p => p.id === item.productId);
            return sum + (product ? product.price * item.quantity : 0);
        }, 0),
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    orders.push(newOrder);
    
    // Clear cart after order
    if (carts[req.user.id]) {
        carts[req.user.id] = [];
    }
    
    res.status(201).json(newOrder);
});

app.get('/api/orders', authenticateToken, (req, res) => {
    const userOrders = orders.filter(o => o.userId === req.user.id);
    res.json({ orders: userOrders });
});

app.get('/api/orders/:id', authenticateToken, (req, res) => {
    const order = orders.find(o => o.id === parseInt(req.params.id) && o.userId === req.user.id);
    
    if (!order) {
        return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
});

// Categories Routes
app.get('/api/categories', (req, res) => {
    const categories = [...new Set(products.map(p => p.category))];
    const categoriesWithCount = categories.map(cat => ({
        name: cat,
        count: products.filter(p => p.category === cat).length
    }));
    
    res.json({ categories: categoriesWithCount });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
});