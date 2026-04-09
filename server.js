// ========================================
// Vanmilo - Product Management Server
// Node.js + Express API
// ========================================

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'products.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Read products from JSON file
function readProducts() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading products:', error);
        return [];
    }
}

// Write products to JSON file
function writeProducts(products) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error writing products:', error);
        return false;
    }
}

// ========================================
// API Routes
// ========================================

// GET - Lấy tất cả sản phẩm
app.get('/api/products', (req, res) => {
    const products = readProducts();
    res.json(products);
});

// GET - Lấy sản phẩm theo ID
app.get('/api/products/:id', (req, res) => {
    const products = readProducts();
    const product = products.find(p => p.id === parseInt(req.params.id));
    
    if (!product) {
        return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    }
    
    res.json(product);
});

// POST - Thêm sản phẩm mới
app.post('/api/products', (req, res) => {
    const products = readProducts();
    const newProduct = req.body;
    
    // Validate dữ liệu
    if (!newProduct.name || newProduct.price === undefined || newProduct.quantity === undefined) {
        return res.status(400).json({ error: 'Thiếu thông tin sản phẩm' });
    }
    
    // Tạo ID mới (lấy max ID hiện tại + 1)
    const maxId = products.length > 0 ? Math.max(...products.map(p => p.id)) : 0;
    newProduct.id = maxId + 1;
    
    // Thêm vào mảng
    products.push(newProduct);
    
    // Lưu vào file
    if (writeProducts(products)) {
        res.status(201).json(newProduct);
    } else {
        res.status(500).json({ error: 'Lỗi khi lưu sản phẩm' });
    }
});

// PUT - Cập nhật sản phẩm
app.put('/api/products/:id', (req, res) => {
    const products = readProducts();
    const id = parseInt(req.params.id);
    const index = products.findIndex(p => p.id === id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    }
    
    const updatedProduct = {
        ...products[index],
        ...req.body,
        id: id // Giữ nguyên ID
    };
    
    products[index] = updatedProduct;
    
    if (writeProducts(products)) {
        res.json(updatedProduct);
    } else {
        res.status(500).json({ error: 'Lỗi khi cập nhật sản phẩm' });
    }
});

// DELETE - Xóa sản phẩm
app.delete('/api/products/:id', (req, res) => {
    const products = readProducts();
    const id = parseInt(req.params.id);
    const index = products.findIndex(p => p.id === id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    }
    
    const deletedProduct = products[index];
    products.splice(index, 1);
    
    if (writeProducts(products)) {
        res.json({ message: 'Xóa sản phẩm thành công', product: deletedProduct });
    } else {
        res.status(500).json({ error: 'Lỗi khi xóa sản phẩm' });
    }
});

// Serve index.html for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ========================================
// Start Server
// ========================================
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 Vanmilo Product Management Server               ║
║                                                       ║
║   Server running at: http://localhost:${PORT}           ║
║                                                       ║
║   API Endpoints:                                      ║
║   • GET    /api/products      - Lấy danh sách        ║
║   • GET    /api/products/:id  - Lấy 1 sản phẩm       ║
║   • POST   /api/products      - Thêm sản phẩm        ║
║   • PUT    /api/products/:id  - Cập nhật sản phẩm    ║
║   • DELETE /api/products/:id  - Xóa sản phẩm         ║
║                                                       ║
║   Press Ctrl+C to stop server                        ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
    `);
});
