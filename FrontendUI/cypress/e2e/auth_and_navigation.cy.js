describe("Auth and Navigation", () => {
  it("logs in and navigates to mapping studio", () => {
    cy.visit("/login");
    // Use a specific role-based query to avoid ambiguous matches on "login"
    cy.findByRole("heading", { name: /login/i }).should("exist");
    cy.get('input[placeholder=""]').should("have.length.at.least", 0); // noop to ensure page loaded

    cy.get("input").first().type("admin");
    cy.get('input[type="password"]').type("password");
    // Click the Login form's submit button explicitly to avoid ambiguity with Navbar Login button
    cy.get('form button[type="submit"]').click();

    // After login should land on root mapping studio
    cy.contains(/mapping studio/i, { timeout: 10000 }).should("exist");
    // Navbar should show links
    cy.contains(/connect device/i).should("exist");
    cy.contains(/version control/i).should("exist");
  });
});
