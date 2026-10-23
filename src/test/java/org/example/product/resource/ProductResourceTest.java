package org.example.product.resource;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@QuarkusTest
class ProductResourceTest {

    @Test
    void supportsProductCrudLifecycle() {
        String request = """
                {
                  "name": "Desk lamp",
                  "description": "Adjustable LED desk lamp",
                  "price": 29.99,
                  "stockQuantity": 12
                }
                """;

        var created = given()
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/api/products")
                .then()
                .statusCode(201)
                .extract()
                .response();

        long id = created.jsonPath().getLong("id");
        assertTrue(id > 0);
        assertEquals("Desk lamp", created.jsonPath().getString("name"));

        given()
                .when()
                .get("/api/products/{id}", id)
                .then()
                .statusCode(200)
                .body("name", org.hamcrest.Matchers.equalTo("Desk lamp"));

        List<Map<String, Object>> products = given()
                .when()
                .get("/api/products")
                .then()
                .statusCode(200)
                .extract()
                .jsonPath()
                .getList(".");
        assertTrue(products.stream().anyMatch(product ->
                ((Number) product.get("id")).longValue() == id));

        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "Updated desk lamp",
                          "description": "Updated description",
                          "price": 34.50,
                          "stockQuantity": 7
                        }
                        """)
                .when()
                .put("/api/products/{id}", id)
                .then()
                .statusCode(200)
                .body("name", org.hamcrest.Matchers.equalTo("Updated desk lamp"))
                .body("stockQuantity", org.hamcrest.Matchers.equalTo(7));

        given()
                .when()
                .delete("/api/products/{id}", id)
                .then()
                .statusCode(204);

        given()
                .when()
                .get("/api/products/{id}", id)
                .then()
                .statusCode(404);
    }

    @Test
    void rejectsInvalidProductAndReportsMissingIds() {
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": " ",
                          "description": "Invalid product",
                          "price": 0,
                          "stockQuantity": -1
                        }
                        """)
                .when()
                .post("/api/products")
                .then()
                .statusCode(400);

        given()
                .when()
                .get("/api/products/0")
                .then()
                .statusCode(404);

        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "Missing product",
                          "description": "",
                          "price": 10.00,
                          "stockQuantity": 1
                        }
                        """)
                .when()
                .put("/api/products/0")
                .then()
                .statusCode(404);

        given()
                .when()
                .delete("/api/products/0")
                .then()
                .statusCode(404);
    }
}
