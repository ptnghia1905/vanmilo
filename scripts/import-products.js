/**
 * Script đẩy dữ liệu từ data/products.json lên Firestore
 * 
 * Cách 1 (khuyên dùng): Dùng Service Account
 *   1. Firebase Console > Project Settings > Service Accounts > "Generate new private key"
 *   2. Lưu file JSON vào scripts/service-account.json
 * 
 * Cách 2: Dùng API Key (không cần service account, nhưng cần mở rules)
 *   - Đặt USE_REST_API = true và cung cấp API_KEY
 */

const fs = require('fs');
const path = require('path');

// =============================================
// CÁCH 1: Service Account (khuyên dùng)
// =============================================
const USE_REST_API = true;  // ✅ Đổi thành true để dùng REST API
const API_KEY = 'AIzaSyABcECzCy-SFKJ6r8rHQ7VaH2bFwpzgRWk'; // Thay bằng API key từ Firebase Console
const PROJECT_ID = 'vanmilo';
const PRODUCTS_COLLECTION = 'products';

async function importWithServiceAccount() {
    const admin = require('firebase-admin');
    const serviceAccount = require('./service-account.json');

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });

    const db = admin.firestore();
    await importToFirestore(db);
    process.exit(0);
}

// =============================================
// CÁCH 2: Firestore REST API (không cần service account)
// =============================================
async function importWithRestApi() {
    const jsonPath = path.join(__dirname, '../data/products.json');
    const products = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    console.log(`Tìm thấy ${products.length} sản phẩm trong JSON`);

    // Xóa hết documents cũ trong collection
    console.log('Xóa collection cũ...');
    const existing = await fetch(
        `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${PRODUCTS_COLLECTION}?key=${API_KEY}`
    ).then(r => r.json()).catch(() => ({ documents: [] }));

    for (const doc of (existing.documents || [])) {
        await fetch(`${doc.name}?key=${API_KEY}`, { method: 'DELETE' });
    }

    console.log(`Bắt đầu đẩy ${products.length} sản phẩm lên Firestore...\n`);

    let success = 0;
    for (const product of products) {
        const docPath = `${PRODUCTS_COLLECTION}/${product.id}`;
        const res = await fetch(
            `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${PRODUCTS_COLLECTION}?documentId=${product.id}&key=${API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fields: {
                        id: { integerValue: product.id },
                        name: { stringValue: product.name },
                        price: { integerValue: product.price },
                        quantity: { integerValue: product.quantity },
                        category: { stringValue: product.category }
                    }
                })
            }
        );

        if (res.ok) {
            success++;
            process.stdout.write(`  [OK] ID ${product.id} - ${product.name}\n`);
        } else {
            const err = await res.text();
            console.error(`  [LỖI] ID ${product.id}: ${err}`);
        }
    }

    console.log(`\n=== Kết quả ===`);
    console.log(`  Thành công: ${success} / ${products.length}`);
}

async function importToFirestore(db) {
    const jsonPath = path.join(__dirname, '../data/products.json');
    const products = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    console.log(`Tìm thấy ${products.length} sản phẩm trong JSON`);

    // Xóa collection cũ trước
    console.log('Xóa collection cũ...');
    const batch = db.batch();
    const existing = await db.collection(PRODUCTS_COLLECTION).get();
    existing.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    console.log(`Đã xóa ${existing.size} document(s)\n`);

    console.log('Bắt đầu đẩy lên Firestore...\n');

    let success = 0;
    const errors = [];

    for (const product of products) {
        try {
            await db.collection(PRODUCTS_COLLECTION).doc(String(product.id)).set(product);
            success++;
            process.stdout.write(`  [OK] ID ${product.id} - ${product.name}\n`);
        } catch (err) {
            errors.push({ id: product.id, name: product.name, error: err.message });
            console.error(`  [LỖI] ID ${product.id}: ${err.message}`);
        }
    }

    console.log(`\n=== Kết quả ===`);
    console.log(`  Thành công: ${success} / ${products.length}`);
    if (errors.length > 0) {
        console.log(`  Thất bại: ${errors.length}`);
    }
}

// =============================================
// RUN
// =============================================
(async () => {
    try {
        if (USE_REST_API) {
            await importWithRestApi();
        } else {
            await importWithServiceAccount();
        }
    } catch (err) {
        console.error('Lỗi nghiêm trọng:', err.message);
        if (err.message.includes('service-account.json')) {
            console.error('\nChưa có service-account.json. Làm theo bước sau:');
            console.error('  1. Firebase Console > Project Settings > Service Accounts');
            console.error('  2. Bấm "Generate new private key" để tải file JSON');
            console.error('  3. Lưu file vào scripts/service-account.json');
            console.error('\nHoặc đổi USE_REST_API = true trong script để dùng REST API (cần mở Firestore rules tạm thời).');
        }
        process.exit(1);
    }
})();