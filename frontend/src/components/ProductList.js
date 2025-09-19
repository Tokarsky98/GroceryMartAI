import React, { useState, useEffect } from 'react';
import { productsAPI } from '../services/api';
import { useCart } from '../App';
import Toast from './Toast';

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [category, setCategory] = useState('');
    const [search, setSearch] = useState('');
    const [showToast, setShowToast] = useState(null);
    const { addToCart } = useCart();

    useEffect(() => {
        loadProducts();
    }, [page, category]);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: 12,
                ...(category && { category }),
                ...(search && { search })
            };
            
            const data = await productsAPI.getProducts(params);
            setProducts(data.products);
            setTotalPages(data.pages);
        } catch (error) {
            console.error('Failed to load products:', error);
            setShowToast({ message: 'Failed to load products', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = async (product) => {
        try {
            await addToCart(product);
            setShowToast({ message: `${product.name} added to cart!`, type: 'success' });
        } catch (error) {
            console.error('Failed to add to cart:', error);
            // Show specific error message from backend or local validation
            const errorMessage = error.response?.data?.error || error.message || 'Failed to add item to cart';
            setShowToast({ message: errorMessage, type: 'error' });
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        loadProducts();
    };

    return (
        <>
            <div className="hero">
                <div className="container">
                    <h1>Fresh Groceries Delivered</h1>
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit</p>
                    <form onSubmit={handleSearch} className="search-bar">
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search for products..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <button type="submit" className="search-btn">Search</button>
                    </form>
                </div>
            </div>

            <div className="products">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Our Products</h2>
                        <select 
                            className="filter-dropdown"
                            value={category}
                            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                        >
                            <option value="">All Categories</option>
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

                    {loading ? (
                        <div className="spinner"></div>
                    ) : (
                        <>
                            <div className="product-grid">
                                {products.map(product => (
                                    <div key={product.id} className="product-card">
                                        <img src={product.image} alt={product.name} className="product-image" />
                                        <div className="product-info">
                                            <h3 className="product-name">{product.name}</h3>
                                            <p className="product-description">{product.description}</p>
                                            <div className="product-footer">
                                                <span className="product-price">${product.price}</span>
                                                <button 
                                                    className="add-to-cart"
                                                    onClick={() => handleAddToCart(product)}
                                                    disabled={product.stock === 0}
                                                >
                                                    {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className="pagination">
                                    <button 
                                        className="page-btn" 
                                        onClick={() => setPage(page - 1)}
                                        disabled={page === 1}
                                    >
                                        Previous
                                    </button>
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i + 1}
                                            className={`page-btn ${page === i + 1 ? 'active' : ''}`}
                                            onClick={() => setPage(i + 1)}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                    <button 
                                        className="page-btn" 
                                        onClick={() => setPage(page + 1)}
                                        disabled={page === totalPages}
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
            {showToast && (
                <Toast 
                    message={showToast.message} 
                    type={showToast.type} 
                    onClose={() => setShowToast(null)} 
                />
            )}
        </>
    );
};

export default ProductList;