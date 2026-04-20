import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginBody from "../components/LoginBody";
import {
  mockLoginSuccess,
  mockLoginFailure,
  mockLoginSuspended,
  resetFetchMocks,
} from "./mocks";

describe("LoginBody Component", () => {
  beforeEach(() => {
    resetFetchMocks();
    vi.clearAllMocks();
  });

  it("renders login form", () => {
    const mockOnRegisterClick = vi.fn();
    const mockOnLoginSuccess = vi.fn();

    render(
      <LoginBody
        onRegisterClick={mockOnRegisterClick}
        onLoginSuccess={mockOnLoginSuccess}
      />,
    );

    expect(screen.getByText("Bejelentkezés")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("E-mail")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Jelszó")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /belépés/i }),
    ).toBeInTheDocument();
  });

  it("displays remember me checkbox", () => {
    const mockOnRegisterClick = vi.fn();
    const mockOnLoginSuccess = vi.fn();

    render(
      <LoginBody
        onRegisterClick={mockOnRegisterClick}
        onLoginSuccess={mockOnLoginSuccess}
      />,
    );

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeInTheDocument();
    expect(screen.getByText("Bejelentkezve maradok")).toBeInTheDocument();
  });

  it("shows register link", () => {
    const mockOnRegisterClick = vi.fn();
    const mockOnLoginSuccess = vi.fn();

    render(
      <LoginBody
        onRegisterClick={mockOnRegisterClick}
        onLoginSuccess={mockOnLoginSuccess}
      />,
    );

    const registerLink = screen.getByText("Nincs még fiókod? Regisztrálj!");
    expect(registerLink).toBeInTheDocument();
  });

  it("calls onRegisterClick when register link is clicked", async () => {
    const mockOnRegisterClick = vi.fn();
    const mockOnLoginSuccess = vi.fn();

    render(
      <LoginBody
        onRegisterClick={mockOnRegisterClick}
        onLoginSuccess={mockOnLoginSuccess}
      />,
    );

    const registerLink = screen.getByText("Nincs még fiókod? Regisztrálj!");
    fireEvent.click(registerLink);

    expect(mockOnRegisterClick).toHaveBeenCalledOnce();
  });

  it("submits form with email and password", async () => {
    const user = userEvent.setup();
    const mockOnRegisterClick = vi.fn();
    const mockOnLoginSuccess = vi.fn();
    mockLoginSuccess();

    render(
      <LoginBody
        onRegisterClick={mockOnRegisterClick}
        onLoginSuccess={mockOnLoginSuccess}
      />,
    );

    const emailInput = screen.getByPlaceholderText("E-mail");
    const passwordInput = screen.getByPlaceholderText("Jelszó");
    const submitButton = screen.getByRole("button", { name: /belépés/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/login",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "test@example.com",
            password: "password123",
          }),
        }),
      );
    });
  });

  it("calls onLoginSuccess on successful login", async () => {
    const user = userEvent.setup();
    const mockOnRegisterClick = vi.fn();
    const mockOnLoginSuccess = vi.fn();
    mockLoginSuccess();

    render(
      <LoginBody
        onRegisterClick={mockOnRegisterClick}
        onLoginSuccess={mockOnLoginSuccess}
      />,
    );

    await user.type(screen.getByPlaceholderText("E-mail"), "test@example.com");
    await user.type(screen.getByPlaceholderText("Jelszó"), "password123");
    await user.click(screen.getByRole("button", { name: /belépés/i }));

    await waitFor(() => {
      expect(mockOnLoginSuccess).toHaveBeenCalledWith(
        "testuser",
        false,
        false,
        "test-jwt-token-12345",
      );
    });
  });

  it("shows alert on login failure", async () => {
    const user = userEvent.setup();
    const mockOnRegisterClick = vi.fn();
    const mockOnLoginSuccess = vi.fn();
    mockLoginFailure("Hibás email vagy jelszó");

    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    render(
      <LoginBody
        onRegisterClick={mockOnRegisterClick}
        onLoginSuccess={mockOnLoginSuccess}
      />,
    );

    await user.type(screen.getByPlaceholderText("E-mail"), "wrong@example.com");
    await user.type(screen.getByPlaceholderText("Jelszó"), "wrongpass");
    await user.click(screen.getByRole("button", { name: /belépés/i }));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Hibás email vagy jelszó");
    });

    alertSpy.mockRestore();
  });

  it("handles suspended user account", async () => {
    const user = userEvent.setup();
    const mockOnRegisterClick = vi.fn();
    const mockOnLoginSuccess = vi.fn();
    mockLoginSuspended(3);

    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    render(
      <LoginBody
        onRegisterClick={mockOnRegisterClick}
        onLoginSuccess={mockOnLoginSuccess}
      />,
    );

    await user.type(
      screen.getByPlaceholderText("E-mail"),
      "suspended@example.com",
    );
    await user.type(screen.getByPlaceholderText("Jelszó"), "password123");
    await user.click(screen.getByRole("button", { name: /belépés/i }));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringContaining("A felhasználód ideiglenesen letiltva van"),
      );
    });

    alertSpy.mockRestore();
  });

  it("handles remember me checkbox", async () => {
    const user = userEvent.setup();
    const mockOnRegisterClick = vi.fn();
    const mockOnLoginSuccess = vi.fn();
    mockLoginSuccess();

    render(
      <LoginBody
        onRegisterClick={mockOnRegisterClick}
        onLoginSuccess={mockOnLoginSuccess}
      />,
    );

    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);

    await user.type(screen.getByPlaceholderText("E-mail"), "test@example.com");
    await user.type(screen.getByPlaceholderText("Jelszó"), "password123");
    await user.click(screen.getByRole("button", { name: /belépés/i }));

    await waitFor(() => {
      expect(mockOnLoginSuccess).toHaveBeenCalledWith(
        "testuser",
        true,
        false,
        "test-jwt-token-12345",
      );
    });
  });

  it("requires email input", async () => {
    const mockOnRegisterClick = vi.fn();
    const mockOnLoginSuccess = vi.fn();

    render(
      <LoginBody
        onRegisterClick={mockOnRegisterClick}
        onLoginSuccess={mockOnLoginSuccess}
      />,
    );

    const emailInput = screen.getByPlaceholderText("E-mail");
    expect(emailInput).toHaveAttribute("required");
  });

  it("requires password input", async () => {
    const mockOnRegisterClick = vi.fn();
    const mockOnLoginSuccess = vi.fn();

    render(
      <LoginBody
        onRegisterClick={mockOnRegisterClick}
        onLoginSuccess={mockOnLoginSuccess}
      />,
    );

    const passwordInput = screen.getByPlaceholderText("Jelszó");
    expect(passwordInput).toHaveAttribute("required");
  });
});
