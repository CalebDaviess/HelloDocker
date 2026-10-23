package org.example.product.resource;

import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.example.product.dto.ProductRequest;
import org.example.product.entity.Product;
import org.example.product.service.ProductService;

import java.util.List;

@Path("/api/products")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@Tag(name = "Products", description = "Manage product catalog entries")
public class ProductResource {

    @Inject
    ProductService service;

    @GET
    @Operation(summary = "List all products")
    public List<Product> list() {
        return service.findAll();
    }

    @GET
    @Path("/{id}")
    @Operation(summary = "Get a product by ID")
    public Response get(@PathParam("id") long id) {
        Product product = service.findById(id);
        return product != null
                ? Response.ok(product).build()
                : Response.status(Response.Status.NOT_FOUND).build();
    }

    @POST
    @Operation(summary = "Create a product")
    public Response create(@Valid ProductRequest request, @Context UriInfo uriInfo) {
        Product product = service.create(request);
        return Response.created(uriInfo.getAbsolutePathBuilder().path(Long.toString(product.getId())).build())
                .entity(product)
                .build();
    }

    @PUT
    @Path("/{id}")
    @Operation(summary = "Replace a product")
    public Response update(@PathParam("id") long id, @Valid ProductRequest request) {
        Product product = service.update(id, request);
        return product != null
                ? Response.ok(product).build()
                : Response.status(Response.Status.NOT_FOUND).build();
    }

    @DELETE
    @Path("/{id}")
    @Operation(summary = "Delete a product")
    public Response delete(@PathParam("id") long id) {
        return service.delete(id)
                ? Response.noContent().build()
                : Response.status(Response.Status.NOT_FOUND).build();
    }
}
