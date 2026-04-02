import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccountDropdown } from "./account-dropdown";
import { LanguageProvider } from "./language-provider";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

describe("AccountDropdown", () => {
  it("toggles the dropdown and shows compte/admin links", async () => {
    render(
      <LanguageProvider>
        <AccountDropdown adminVisible={true} />
      </LanguageProvider>,
    );

    const button = screen.getByRole("button", { name: /compte/i });
    expect(button).toBeTruthy();

    await userEvent.click(button);

    const compteLink = screen.getByRole("link", { name: /compte/i });
    const adminLink = screen.getByRole("link", { name: /admin/i });
    expect(compteLink).toBeTruthy();
    expect(adminLink).toBeTruthy();

    await userEvent.click(compteLink);
    expect(screen.queryByRole("link", { name: /admin/i })).toBeNull();
  });
});
