describe("BST", () => {
    beforeEach(() => {
        cy.visit("collections.html?algorithm=BST");
    });

    it("Canvas only contains information text on load", () => {
        cy.get("svg").first().children().not("text").should("have.length", 0);
        cy.get("svg")
            .first()
            .children()
            .filter("text")
            .then((texts) => {
                cy.wrap(texts.filter(".message")).should("have.text", "\u00A0");
                cy.wrap(texts.filter(".title")).should(
                    "have.text",
                    "Select an action from the menu above"
                );
                cy.wrap(texts.filter(".printer")).should("have.text", "\u00A0");
                cy.wrap(texts.filter(".status-report")).should(
                    "have.text",
                    "Idle"
                );
            });
    });
});
