package org.example.product.repository;

import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import org.example.product.entity.Product;

@ApplicationScoped
public class ProductRepository implements PanacheRepository<Product> {
}
