import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders ModelMapper navbar", () => {
  render(<App />);
  const title = screen.getByText(/ModelMapper/i);
  expect(title).toBeInTheDocument();
});
