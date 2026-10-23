package org.example.product.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.example.product.dto.ProductRequest;
import org.example.product.entity.Product;
import org.example.product.repository.ProductRepository;

import java.util.List;

@ApplicationScoped
public class ProductService {

    @Inject
    ProductRepository products;

    public List<Product> findAll() {
        return products.listAll();
    }

    public Product findById(long id) {
        return products.findById(id);
    }

    @Transactional
    public Product create(ProductRequest request) {
        Product product = new Product();
        apply(product, request);
        products.persist(product);
        return product;
    }

    @Transactional
    public Product update(long id, ProductRequest request) {
        Product product = products.findById(id);
        if (product == null) {
            return null;
        }

        apply(product, request);
        return product;
    }

    @Transactional
    public boolean delete(long id) {
        Product product = products.findById(id);
        if (product == null) {
            return false;
        }

        products.delete(product);
        return true;
    }

    private void apply(Product product, ProductRequest request) {
        product.setName(request.name());
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setStockQuantity(request.stockQuantity());
    }
}
