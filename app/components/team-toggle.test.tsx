import { act, fireEvent, render, screen } from "@testing-library/react";
import { createRoutesStub, useLoaderData } from "react-router";

import { TeamToggle } from "./team-toggle";

/**
 * Mirrors the real route: the action changes the team, then React Router
 * re-runs the loader, which passes the new `onTeam` value back down.
 */
function setup({ onTeam = false, teamFull = false } = {}) {
  const team = { onTeam, teamFull };
  const action = vi.fn(async ({ request }: { request: Request }) => {
    const form = await request.formData();
    team.onTeam = form.get("intent") === "add";
    return { ok: true, error: null };
  });

  const Stub = createRoutesStub([
    {
      path: "/pokemon/pikachu",
      loader: () => ({ ...team }),
      action,
      Component: () => {
        const data = useLoaderData<typeof team>();
        return (
          <TeamToggle
            id={25}
            name="Pikachu"
            onTeam={data.onTeam}
            teamFull={data.teamFull}
          />
        );
      },
    },
  ]);
  render(<Stub initialEntries={["/pokemon/pikachu"]} />);
  return { action };
}

test("adds to the team via the route action", async () => {
  const { action } = setup();

  const button = await screen.findByRole("button", {
    name: "Add Pikachu to team",
  });
  await act(async () => fireEvent.click(button));

  expect(
    await screen.findByRole("button", { name: "Remove Pikachu from team" }),
  ).toBeInTheDocument();
  expect(action).toHaveBeenCalledOnce();
});

test("removes from the team via the route action", async () => {
  setup({ onTeam: true });

  const button = await screen.findByRole("button", {
    name: "Remove Pikachu from team",
  });
  await act(async () => fireEvent.click(button));

  expect(
    await screen.findByRole("button", { name: "Add Pikachu to team" }),
  ).toBeInTheDocument();
});

test("disables adding when the team is full", async () => {
  setup({ teamFull: true });

  expect(
    await screen.findByRole("button", { name: "Add Pikachu to team" }),
  ).toBeDisabled();
  expect(screen.getByRole("status")).toHaveTextContent("Your team is full");
});

test("still allows removing when the team is full", async () => {
  setup({ onTeam: true, teamFull: true });

  expect(
    await screen.findByRole("button", { name: "Remove Pikachu from team" }),
  ).toBeEnabled();
});
