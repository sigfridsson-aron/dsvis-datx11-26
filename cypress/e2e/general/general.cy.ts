const pages: string[] = ["collections.html", "prioqueues.html", "sorting.html"];

describe("Index.html", () => {
    it("Navigates to correct page when clicking link", () => {
        cy.visit("/");
        cy.get("a").contains("Collections").click();
        cy.url().should("include", "collections.html");

        cy.visit("/");
        cy.get("a").contains("Priority queues").click();
        cy.url().should("include", "prioqueues.html");

        cy.visit("/");
        cy.get("a").contains("Sorting").click();
        cy.url().should("include", "sorting.html");
    });
});

describe("General controls", () => {
    it("Node size and animation speed has values", () => {
        cy.visit("/");
        cy.get("ul")
            .find("a")
            .each((a) => {
                cy.wrap(a)
                    .invoke("attr", "href")
                    .then((href: string | undefined) => {
                        if (href) {
                            cy.visit(`localhost:8080/${href}`);
                            cy.get(".objectSize").should("not.have.value", "");
                            cy.get(".animationSpeed").should(
                                "not.have.value",
                                ""
                            );
                        }
                    });
            });
    });
});
