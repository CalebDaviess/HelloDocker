package org.example.product.resource;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;

@Path("/")
public class RootResource {

    @GET
    public Response redirectToApiDocumentation(@Context UriInfo uriInfo) {
        return Response.seeOther(uriInfo.getBaseUriBuilder().path("q/swagger-ui/").build()).build();
    }
}
