import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { productsAPI } from '../services/api';
import Toast from './Toast';

const AdminPanel = () => {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [showToast, setShowToast] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        stock: '',
        image: null
    });

    useEffect(() => {
        if (user?.role !== 'admin') {
            window.location.hash = '#home';
            return;
        }
        loadProducts();
    }, [user]);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const data = await productsAPI.getProducts({ page: 1, limit: 100 });
            setProducts(data.products);
        } catch (error) {
            console.error('Failed to load products:', error);
            setShowToast({ message: 'Failed to load products', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingProduct) {
                await productsAPI.updateProduct(editingProduct.id, formData);
                setShowToast({ message: 'Product updated successfully!', type: 'success' });
            } else {
                await productsAPI.createProduct(formData);
                setShowToast({ message: 'Product created successfully!', type: 'success' });
            }
            setShowModal(false);
            setEditingProduct(null);
            setFormData({ name: '', description: '', price: '', category: '', stock: '', image: null });
            loadProducts();
        } catch (error) {
            console.error('Operation failed:', error);
            setShowToast({ message: error.response?.data?.error || 'Operation failed', type: 'error' });
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description,
            price: product.price,
            category: product.category,
            stock: product.stock,
            image: null
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await productsAPI.deleteProduct(id);
                setShowToast({ message: 'Product deleted successfully!', type: 'success' });
                loadProducts();
            } catch (error) {
                console.error('Failed to delete product:', error);
                setShowToast({ message: error.response?.data?.error || 'Failed to delete product', type: 'error' });
            }
        }
    };

    return (
        <div className="admin-panel">
            <div className="container">
                <div className="section-header">
                    <h2 className="section-title">Admin Panel - Product Management</h2>
                    <button className="submit-btn" style={{ width: 'auto' }} onClick={() => setShowModal(true)}>
                        Add New Product
                    </button>
                </div>

                {loading ? (
                    <div className="spinner"></div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Image</th>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(product => (
                                <tr key={product.id}>
                                    <td>{product.id}</td>
                                    <td>
                                        <img src={product.image} alt={product.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '5px' }} />
                                    </td>
                                    <td>{product.name}</td>
                                    <td>{product.category}</td>
                                    <td>${product.price}</td>
                                    <td>{product.stock}</td>
                                    <td>
                                        <div className="action-btns">
                                            <button className="edit-btn" onClick={() => handleEdit(product)}>Edit</button>
                                            <button className="delete-btn" onClick={() => handleDelete(product.id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                                <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
                            </div>
                            <div className="modal-body">
                                <form onSubmit={handleSubmit}>
                                    <div className="form-group">
                                        <label className="form-label">Product Name</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Description</label>
                                        <textarea
                                            className="form-input"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows="3"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Category</label>
                                        <select
                                            className="form-input"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            required
                                        >
                                            <option value="">Select Category</option>
                                            <option value="Fruits">Fruits</option>
                                            <option value="Vegetables">Vegetables</option>
                                            <option value="Dairy">Dairy</option>
                                            <option value="Meat">Meat</option>
                                            <option value="Bakery">Bakery</option>
                                            <option value="Beverages">Beverages</option>
                                            <option value="Seafood">Seafood</option>
                                            <option value="Pantry">Pantry</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Price</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            min="0"
                                            step="0.01"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Stock</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={formData.stock}
                                            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                            min="0"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <div className="file-upload">
                                            <input
                                                type="file"
                                                id="product-image"
                                                accept="image/*"
                                                onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                                            />
                                            <label htmlFor="product-image" className="file-upload-label">
                                                {formData.image ? formData.image.name : 'Choose Product Image'}
                                            </label>
                                        </div>
                                    </div>

                                    <button type="submit" className="submit-btn">
                                        {editingProduct ? 'Update Product' : 'Add Product'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {showToast && (
                <Toast 
                    message={showToast.message} 
                    type={showToast.type} 
                    onClose={() => setShowToast(null)} 
                />
            )}
        </div>
    );
};

export default AdminPanel;