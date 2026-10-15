import { render, screen } from "@testing-library/react";
import { createRoutesStub } from "react-router";

import { TypeBadge } from "./type-badge";

test("renders a plain badge", () => {
  render(<TypeBadge type="fire" />);

  expect(screen.getByText("Fire")).toBeInTheDocument();
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
});

test("renders an accessible link to the type filter", async () => {
  const Stub = createRoutesStub([
    { path: "/", Component: () => <TypeBadge type="water" linked /> },
  ]);
  render(<Stub />);

  const link = await screen.findByRole("link", {
    name: "Browse Water type Pokémon",
  });
  expect(link).toHaveAttribute("href", "/?type=water");
});
