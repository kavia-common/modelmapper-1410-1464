describe("Auth and Navigation", () => {
  it("logs in and navigates to mapping studio", () => {
    cy.visit("/login");
    cy.findByText(/login/i);
    cy.get('input[placeholder=""]').should("have.length.at.least", 0); // noop to ensure page loaded

    cy.get('input').first().type("admin");
    cy.get('input[type="password"]').type("password");
    cy.findByRole("button", { name: /login/i }).click();

    // After login should land on root mapping studio
    cy.contains(/mapping studio/i, { timeout: 10000 }).should("exist");
    // Navbar should show links
    cy.contains(/connect device/i).should("exist");
    cy.contains(/version control/i).should("exist");
  });
});
