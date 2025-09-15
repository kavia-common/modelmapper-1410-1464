describe("Mapping Studio - Drag and Drop", () => {
  beforeEach(() => {
    // Set a token to bypass login flow for test
    window.localStorage.setItem("mm_token", "fake");
    window.localStorage.setItem("mm_user", JSON.stringify({ username: "tester", roles: ["user"] }));
  });

  it("adds items to mapping using keyboard and maps service", () => {
    cy.visit("/");
    cy.contains(/mapping studio/i).should("exist");

    // select vendor
    cy.findByLabelText(/vendor selector/i).select("Cisco");
    cy.findByLabelText(/service id/i).type("svc-1");

    // keyboard add first item (Enter)
    cy.get('[aria-label="Available YANG modules and submodules"] li').first().focus().type("{enter}");

    // ensure target updated then click map
    cy.contains(/mapping target/i).should("exist");
    cy.contains("Map Service").click();
  });
});
