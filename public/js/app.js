// ========================================
// Vanmilo - Product Management App
// Ứng dụng quản lý sản phẩm với Firebase
// ========================================

// Collection name
const PRODUCTS_COLLECTION = 'products';
const SALES_COLLECTION = 'sales';

// State Management
let products = [];
let filteredProducts = [];
let currentPage = 1;
const itemsPerPage = 10;
let editingProductId = null;
let isAuthenticated = false;

// Sell Modal Elements
const sellModal = document.getElementById('sellModal');
const sellForm = document.getElementById('sellForm');
const closeSellModalBtn = document.getElementById('closeSellModal');
const cancelSellBtn = document.getElementById('cancelSellBtn');
const sellProductIdEl = document.getElementById('sellProductId');
const sellProductNameEl = document.getElementById('sellProductName');
const sellQuantityEl = document.getElementById('sellQuantity');
const sellPriceEl = document.getElementById('sellPrice');
const sellTotalEl = document.getElementById('sellTotal');

// DOM Elements
const productTableBody = document.getElementById('productTableBody');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const stockFilter = document.getElementById('stockFilter');
const pagination = document.getElementById('pagination');
const productModal = document.getElementById('productModal');
const productForm = document.getElementById('productForm');
const modalTitle = document.getElementById('modalTitle');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// Stats Elements
const totalProductsEl = document.getElementById('totalProducts');
const inStockProductsEl = document.getElementById('inStockProducts');
const allTimeRevenueEl = document.getElementById('allTimeRevenue');
const todayRevenueEl = document.getElementById('todayRevenue');
const dateFilterEl = document.getElementById('dateFilter');

// Daily Revenue Elements
const dailyRevenueSection = document.getElementById('dailyRevenueSection');
const dailyRevenueToggle = document.getElementById('dailyRevenueToggle');
const dailyRevenueIcon = document.getElementById('dailyRevenueIcon');
const dailyRevenueContent = document.getElementById('dailyRevenueContent');
const dailyRevenueBody = document.getElementById('dailyRevenueBody');

// Buttons & auth UI
const addProductBtn = document.getElementById('addProductBtn');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const authGuest = document.getElementById('authGuest');
const authUser = document.getElementById('authUser');
const userEmailEl = document.getElementById('userEmail');
const tableContainer = document.getElementById('tableContainer');
const loginModal = document.getElementById('loginModal');
const loginForm = document.getElementById('loginForm');
const closeLoginModalBtn = document.getElementById('closeLoginModal');
const cancelLoginBtn = document.getElementById('cancelLoginBtn');

// Format Currency (VNĐ)
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
}

// Show Toast Notification
function showToast(message, isError = false) {
    toastMessage.textContent = message;
    toast.classList.toggle('error', isError);
    toast.classList.add('active');
    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}

// ========================================
// Authentication
// ========================================

function updateAuthUI(user) {
    if (user) {
        authGuest.classList.add('hidden');
        authUser.classList.remove('hidden');
        const email = user.email || '';
        userEmailEl.textContent = email;
        userEmailEl.title = email;
    } else {
        authGuest.classList.remove('hidden');
        authUser.classList.add('hidden');
        userEmailEl.textContent = '';
        userEmailEl.title = '';
    }
    if (tableContainer) {
        tableContainer.classList.toggle('guest-view', !user);
    }
    renderTable();
    renderPagination();
}

function openLoginModal() {
    loginModal.classList.add('active');
    loginForm.reset();
}

function closeLoginModal() {
    loginModal.classList.remove('active');
    loginForm.reset();
}

async function handleLoginSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    try {
        await auth.signInWithEmailAndPassword(email, password);
        closeLoginModal();
        showToast('Đăng nhập thành công!');
    } catch (err) {
        const msg = err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found'
            ? 'Email hoặc mật khẩu không đúng.'
            : (err.message || 'Đăng nhập thất bại.');
        showToast(msg, true);
    }
}

async function handleLogout() {
    try {
        await auth.signOut();
        showToast('Đã đăng xuất');
    } catch (err) {
        showToast(err.message || 'Đăng xuất thất bại', true);
    }
}

// ========================================
// Firebase Functions
// ========================================

// Fetch all products from Firestore (Real-time)
function subscribeToProducts() {
    db.collection(PRODUCTS_COLLECTION)
        .orderBy('id', 'asc')
        .onSnapshot((snapshot) => {
            products = snapshot.docs.map(doc => ({
                id: doc.data().id,
                name: doc.data().name,
                price: doc.data().price,
                quantity: doc.data().quantity,
                category: doc.data().category
            }));

            filteredProducts = [...products];
            applyFilters();
            updateStats();
        }, (error) => {
            console.error('Error fetching products:', error);
            showToast('Lỗi khi tải dữ liệu từ Firebase!', true);
        });
}

// Sales data for date filtering
let salesData = [];

// Fetch all sales from Firestore (Real-time)
function subscribeToSales() {
    db.collection(SALES_COLLECTION)
        .onSnapshot((snapshot) => {
            salesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            updateStats();
        }, (error) => {
            console.error('Error fetching sales:', error);
            showToast('Không thể tải doanh thu! Kiểm tra Firestore Rules.', true);
        });
}

// Add new product to Firestore
async function addProduct(productData) {
    try {
        // Tạo ID mới (lấy max ID hiện tại + 1)
        const maxId = products.length > 0 ? Math.max(...products.map(p => p.id)) : 0;
        productData.id = maxId + 1;
        
        await db.collection(PRODUCTS_COLLECTION).add(productData);
        
        showToast('Thêm sản phẩm mới thành công!');
        return true;
    } catch (error) {
        console.error('Error adding product:', error);
        showToast('Lỗi khi thêm sản phẩm!', true);
        return false;
    }
}

// Update product in Firestore
async function updateProduct(id, productData) {
    try {
        // Tìm document ID tương ứng với product id
        const snapshot = await db.collection(PRODUCTS_COLLECTION)
            .where('id', '==', id)
            .get();
        
        if (snapshot.empty) {
            showToast('Không tìm thấy sản phẩm!', true);
            return false;
        }
        
        const docId = snapshot.docs[0].id;
        await db.collection(PRODUCTS_COLLECTION).doc(docId).update(productData);
        
        showToast('Cập nhật sản phẩm thành công!');
        return true;
    } catch (error) {
        console.error('Error updating product:', error);
        showToast('Lỗi khi cập nhật sản phẩm!', true);
        return false;
    }
}

// Delete product from Firestore
async function deleteProductAPI(id) {
    try {
        // Tìm document ID tương ứng với product id
        const snapshot = await db.collection(PRODUCTS_COLLECTION)
            .where('id', '==', id)
            .get();
        
        if (snapshot.empty) {
            showToast('Không tìm thấy sản phẩm!', true);
            return false;
        }
        
        const docId = snapshot.docs[0].id;
        await db.collection(PRODUCTS_COLLECTION).doc(docId).delete();
        
        showToast('Xóa sản phẩm thành công!');
        return true;
    } catch (error) {
        console.error('Error deleting product:', error);
        showToast('Lỗi khi xóa sản phẩm!', true);
        return false;
    }
}

// ========================================
// Update Statistics
// ========================================
function updateStats() {
    // Hoa hồng = tổng (đơn giá × số lượng bán) của tất cả sản phẩm trong danh sách
    const commission = products.reduce((sum, p) => {
        const price = Number(p.price) || 0;
        const qty = Number(p.quantity) || 0;
        return sum + price * qty;
    }, 0);

    // Hoa hồng hôm nay (từ sales có cùng ngày)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCommission = salesData.reduce((sum, sale) => {
        const saleDate = sale.soldAt ? new Date(sale.soldAt) : null;
        if (!saleDate) return sum;
        saleDate.setHours(0, 0, 0, 0);
        return saleDate.getTime() === today.getTime() ? sum + (sale.totalAmount || 0) : sum;
    }, 0);

    totalProductsEl.textContent = products.length;
    allTimeRevenueEl.textContent = formatCurrency(commission);
    todayRevenueEl.textContent = formatCurrency(todayCommission);
    renderDailyRevenue();
}

// ========================================
// Apply Filters
// ========================================
function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const category = categoryFilter.value;
    const stock = stockFilter.value;

    filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm);
        const matchesCategory = !category || product.category === category;
        
        let matchesStock = true;
        if (stock === 'in-stock') matchesStock = product.quantity > 0;
        if (stock === 'out-of-stock') matchesStock = product.quantity === 0;

        return matchesSearch && matchesCategory && matchesStock;
    });

    currentPage = 1;
    renderTable();
    renderPagination();
}

// ========================================
// Render Product Table
// ========================================
function renderTable() {
    isAuthenticated = !!(auth && auth.currentUser);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageProducts = filteredProducts.slice(start, end);

    if (pageProducts.length === 0) {
        productTableBody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <i class="fas fa-box-open"></i>
                        <h3>Không tìm thấy sản phẩm</h3>
                        <p>Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    productTableBody.innerHTML = pageProducts.map((product, index) => {
        const stt = start + index + 1;
        const total = product.price * product.quantity;
        const stockClass = product.quantity > 0 ? 'in-stock' : 'out-of-stock';
        const stockText = product.quantity > 0 ? product.quantity : 'Chưa';

        return `
            <tr data-id="${product.id}">
                <td class="col-stt">${stt}</td>
                <td class="col-name">
                    <span class="product-name">${product.name}</span>
                </td>
                <td class="col-price">
                    <span class="product-price">${formatCurrency(product.price)}</span>
                </td>
                <td class="col-quantity">
                    <span class="product-quantity ${stockClass}">${stockText}</span>
                </td>
                <td class="col-total">
                    <span class="product-total">${total > 0 ? formatCurrency(total) : '-'}</span>
                </td>
                <td class="col-actions">
                    ${isAuthenticated ? `
                    <div class="action-buttons">
                        <button class="action-btn sell" onclick="openSellModal(${product.id})" title="Bán">
                            <i class="fas fa-shopping-cart"></i>
                        </button>
                        <button class="action-btn edit" onclick="editProduct(${product.id})" title="Sửa">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="handleDeleteProduct(${product.id})" title="Xóa">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    ` : '<span class="guest-actions-hint">—</span>'}
                </td>
            </tr>
        `;
    }).join('');
}

// ========================================
// Render Pagination
// ========================================
function renderPagination() {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let paginationHTML = `
        <button ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            paginationHTML += `
                <button class="${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">
                    ${i}
                </button>
            `;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            paginationHTML += `<span style="padding: 8px;">...</span>`;
        }
    }

    paginationHTML += `
        <button ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

    pagination.innerHTML = paginationHTML;
}

// ========================================
// Change Page
// ========================================
function changePage(page) {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderTable();
    renderPagination();
}

// ========================================
// Modal Functions
// ========================================
function openModal(isEdit = false) {
    productModal.classList.add('active');
    modalTitle.textContent = isEdit ? 'Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới';
    
    if (!isEdit) {
        productForm.reset();
        document.getElementById('productId').value = '';
    }
}

function closeProductModal() {
    productModal.classList.remove('active');
    editingProductId = null;
    productForm.reset();
}

// ========================================
// Edit Product
// ========================================
function editProduct(id) {
    if (!isAuthenticated) {
        showToast('Vui lòng đăng nhập để sửa sản phẩm.', true);
        return;
    }
    const product = products.find(p => p.id === id);
    if (!product) return;

    editingProductId = id;
    document.getElementById('productId').value = product.id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productQuantity').value = product.quantity;
    document.getElementById('productCategory').value = product.category;

    openModal(true);
}

// ========================================
// Delete Product
// ========================================
async function handleDeleteProduct(id) {
    if (!isAuthenticated) {
        showToast('Vui lòng đăng nhập để xóa sản phẩm.', true);
        return;
    }
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
    await deleteProductAPI(id);
}

// ========================================
// Save Product (Add/Edit)
// ========================================
async function handleSaveProduct(e) {
    e.preventDefault();
    if (!isAuthenticated) {
        showToast('Vui lòng đăng nhập để lưu sản phẩm.', true);
        return;
    }

    const productData = {
        name: document.getElementById('productName').value.trim(),
        price: parseInt(document.getElementById('productPrice').value),
        quantity: parseInt(document.getElementById('productQuantity').value),
        category: document.getElementById('productCategory').value
    };

    if (!productData.name || isNaN(productData.price) || isNaN(productData.quantity)) {
        showToast('Vui lòng điền đầy đủ thông tin!', true);
        return;
    }

    let result;
    
    if (editingProductId) {
        result = await updateProduct(editingProductId, productData);
    } else {
        result = await addProduct(productData);
    }

    if (result) {
        closeProductModal();
        // Dữ liệu tự động cập nhật qua Firebase real-time listener
    }
}

// ========================================
// Sell Modal Functions
// ========================================
function openSellModal(productId) {
    if (!isAuthenticated) {
        showToast('Vui lòng đăng nhập để bán sản phẩm.', true);
        return;
    }
    const product = products.find(p => p.id === productId);
    if (!product) return;

    sellProductIdEl.value = product.id;
    sellProductNameEl.value = product.name;
    sellPriceEl.value = product.price;
    sellQuantityEl.value = 1;
    updateSellTotal();

    sellModal.classList.add('active');
}

function closeSellModal() {
    sellModal.classList.remove('active');
    sellForm.reset();
}

function updateSellTotal() {
    const qty = parseInt(sellQuantityEl.value) || 0;
    const price = parseInt(sellPriceEl.value) || 0;
    const total = qty * price;
    sellTotalEl.textContent = total > 0 ? formatCurrency(total) : '—';
}

async function handleSellSubmit(e) {
    e.preventDefault();
    if (!isAuthenticated) {
        showToast('Vui lòng đăng nhập để bán sản phẩm.', true);
        return;
    }

    const productId = parseInt(sellProductIdEl.value);
    const quantitySold = parseInt(sellQuantityEl.value);
    const pricePerUnit = parseInt(sellPriceEl.value);
    const product = products.find(p => p.id === productId);

    if (!product) {
        showToast('Không tìm thấy sản phẩm!', true);
        return;
    }
    if (quantitySold <= 0) {
        showToast('Số lượng bán phải lớn hơn 0!', true);
        return;
    }
    // Không giới hạn số lượng bán - cứ bán bao nhiêu cũng được

    const totalAmount = quantitySold * pricePerUnit;
    const soldAt = new Date().toISOString();

    try {
        // Ghi vào collection sales
        await db.collection(SALES_COLLECTION).add({
            productId,
            productName: product.name,
            quantitySold,
            pricePerUnit,
            totalAmount,
            soldAt
        });

        // Cập nhật số lượng bán trong products (cộng thêm, không trừ)
        const snapshot = await db.collection(PRODUCTS_COLLECTION)
            .where('id', '==', productId)
            .get();
        if (!snapshot.empty) {
            const newQty = product.quantity + quantitySold;
            await db.collection(PRODUCTS_COLLECTION).doc(snapshot.docs[0].id).update({
                quantity: newQty
            });
        }

        closeSellModal();
        showToast(`Bán thành công ${quantitySold} x ${product.name}!`);
    } catch (err) {
        console.error('Lỗi khi bán:', err);
        showToast('Lỗi khi bán sản phẩm!', true);
    }
}

// ========================================
// Event Listeners
// ========================================
closeSellModalBtn.addEventListener('click', closeSellModal);
cancelSellBtn.addEventListener('click', closeSellModal);
sellForm.addEventListener('submit', handleSellSubmit);
sellModal.addEventListener('click', (e) => {
    if (e.target === sellModal) closeSellModal();
});
sellQuantityEl.addEventListener('input', updateSellTotal);
sellPriceEl.addEventListener('input', updateSellTotal);

loginBtn.addEventListener('click', openLoginModal);
logoutBtn.addEventListener('click', handleLogout);
loginForm.addEventListener('submit', handleLoginSubmit);
closeLoginModalBtn.addEventListener('click', closeLoginModal);
cancelLoginBtn.addEventListener('click', closeLoginModal);
loginModal.addEventListener('click', (e) => {
    if (e.target === loginModal) closeLoginModal();
});

addProductBtn.addEventListener('click', () => openModal(false));
closeModal.addEventListener('click', closeProductModal);
cancelBtn.addEventListener('click', closeProductModal);
productForm.addEventListener('submit', handleSaveProduct);

productModal.addEventListener('click', (e) => {
    if (e.target === productModal) {
        closeProductModal();
    }
});

// Search and Filter
searchInput.addEventListener('input', debounce(applyFilters, 300));
categoryFilter.addEventListener('change', applyFilters);
stockFilter.addEventListener('change', applyFilters);

// Debounce helper
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ========================================
// Initialize App
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged((user) => {
        updateAuthUI(user);
    });
    subscribeToProducts();
    subscribeToSales();
});

// Export functions for global access
window.editProduct = editProduct;
window.handleDeleteProduct = handleDeleteProduct;
window.changePage = changePage;
window.openSellModal = openSellModal;

// Event: Date Filter
dateFilterEl.addEventListener('change', () => {
    const selectedDate = dateFilterEl.value;
    if (!selectedDate) {
        filteredProducts = [...products];
    } else {
        const targetDate = new Date(selectedDate);
        targetDate.setHours(0, 0, 0, 0);
        const nextDate = new Date(targetDate);
        nextDate.setDate(nextDate.getDate() + 1);

        // Lọc sản phẩm có sales trong ngày đã chọn
        filteredProducts = products.filter(p => {
            return salesData.some(sale => {
                if (sale.productId !== p.id) return false;
                const saleDate = sale.soldAt ? new Date(sale.soldAt) : null;
                if (!saleDate) return false;
                return saleDate >= targetDate && saleDate < nextDate;
            });
        });
    }
    currentPage = 1;
    renderTable();
    renderPagination();
});

// ========================================
// Toggle Daily Revenue Section
// ========================================
dailyRevenueToggle.addEventListener('click', () => {
    const isOpen = dailyRevenueContent.classList.toggle('open');
    dailyRevenueIcon.classList.toggle('rotated', isOpen);
});

// ========================================
// Render Daily Revenue Table
// ========================================
function renderDailyRevenue() {
    // Group sales by date
    const dailyMap = {};
    salesData.forEach(sale => {
        if (!sale.soldAt) return;
        const dateStr = sale.soldAt.split('T')[0]; // YYYY-MM-DD
        if (!dailyMap[dateStr]) {
            dailyMap[dateStr] = { total: 0, count: 0 };
        }
        dailyMap[dateStr].total += sale.totalAmount || 0;
        dailyMap[dateStr].count += 1;
    });

    // Sort by date descending (newest first)
    const sortedDates = Object.keys(dailyMap).sort((a, b) => b.localeCompare(a));

    if (sortedDates.length === 0) {
        dailyRevenueBody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align:center; color: var(--gray-400); padding: 20px;">
                    Chưa có doanh thu nào
                </td>
            </tr>
        `;
        return;
    }

    dailyRevenueBody.innerHTML = sortedDates.map(dateStr => {
        const data = dailyMap[dateStr];
        // Format date to Vietnamese
        const dateObj = new Date(dateStr + 'T00:00:00');
        const formattedDate = dateObj.toLocaleDateString('vi-VN', {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        return `
            <tr>
                <td><strong>${formattedDate}</strong></td>
                <td style="text-align:center;">${data.count} đơn</td>
                <td style="text-align:right; color: var(--success-color); font-weight: 600;">
                    ${formatCurrency(data.total)}
                </td>
            </tr>
        `;
    }).join('');
}

// Export functions for global access
