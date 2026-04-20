import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterBody from "../components/RegisterBody";
import {
  mockRegisterSuccess,
  mockRegisterFailure,
  resetFetchMocks,
} from "./mocks";

describe("RegisterBody Component", () => {
  beforeEach(() => {
    resetFetchMocks();
    vi.clearAllMocks();
  });

  it("renders registration form", () => {
    const mockOnLoginClick = vi.fn();

    render(<RegisterBody onLoginClick={mockOnLoginClick} />);

    expect(screen.getByText("Regisztráció")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Felhasználónév")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email cím")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Jelszó")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /regisztráció/i }),
    ).toBeInTheDocument();
  });

  it("shows login link", () => {
    const mockOnLoginClick = vi.fn();

    render(<RegisterBody onLoginClick={mockOnLoginClick} />);

    const loginLink = screen.getByText("Van már fiókod? Jelentkezz be!");
    expect(loginLink).toBeInTheDocument();
  });

  it("calls onLoginClick when login link is clicked", async () => {
    const mockOnLoginClick = vi.fn();

    render(<RegisterBody onLoginClick={mockOnLoginClick} />);

    const loginLink = screen.getByText("Van már fiókod? Jelentkezz be!");
    fireEvent.click(loginLink);

    expect(mockOnLoginClick).toHaveBeenCalledOnce();
  });

  it("submits form with username, email, and password", async () => {
    const user = userEvent.setup();
    const mockOnLoginClick = vi.fn();
    mockRegisterSuccess();

    render(<RegisterBody onLoginClick={mockOnLoginClick} />);

    const usernameInput = screen.getByPlaceholderText("Felhasználónév");
    const emailInput = screen.getByPlaceholderText("Email cím");
    const passwordInput = screen.getByPlaceholderText("Jelszó");
    const submitButton = screen.getByRole("button", { name: /regisztráció/i });

    await user.type(usernameInput, "newuser");
    await user.type(emailInput, "newuser@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/register",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "newuser",
            email: "newuser@example.com",
            password: "password123",
          }),
        }),
      );
    });
  });

  it("shows success alert and calls onLoginClick on successful registration", async () => {
    const user = userEvent.setup();
    const mockOnLoginClick = vi.fn();
    mockRegisterSuccess();

    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    render(<RegisterBody onLoginClick={mockOnLoginClick} />);

    await user.type(screen.getByPlaceholderText("Felhasználónév"), "newuser");
    await user.type(
      screen.getByPlaceholderText("Email cím"),
      "newuser@example.com",
    );
    await user.type(screen.getByPlaceholderText("Jelszó"), "password123");
    await user.click(screen.getByRole("button", { name: /regisztráció/i }));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "Sikeres regisztráció! Most már bejelentkezhetsz.",
      );
      expect(mockOnLoginClick).toHaveBeenCalledOnce();
    });

    alertSpy.mockRestore();
  });

  it("shows error alert on registration failure", async () => {
    const user = userEvent.setup();
    const mockOnLoginClick = vi.fn();
    mockRegisterFailure("Ez az email már használatban van");

    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    render(<RegisterBody onLoginClick={mockOnLoginClick} />);

    await user.type(
      screen.getByPlaceholderText("Felhasználónév"),
      "existinguser",
    );
    await user.type(
      screen.getByPlaceholderText("Email cím"),
      "existing@example.com",
    );
    await user.type(screen.getByPlaceholderText("Jelszó"), "password123");
    await user.click(screen.getByRole("button", { name: /regisztráció/i }));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Ez az email már használatban van");
    });

    alertSpy.mockRestore();
  });

  it("requires username input", () => {
    const mockOnLoginClick = vi.fn();

    render(<RegisterBody onLoginClick={mockOnLoginClick} />);

    const usernameInput = screen.getByPlaceholderText("Felhasználónév");
    expect(usernameInput).toHaveAttribute("required");
  });

  it("requires email input", () => {
    const mockOnLoginClick = vi.fn();

    render(<RegisterBody onLoginClick={mockOnLoginClick} />);

    const emailInput = screen.getByPlaceholderText("Email cím");
    expect(emailInput).toHaveAttribute("required");
  });

  it("requires password input", () => {
    const mockOnLoginClick = vi.fn();

    render(<RegisterBody onLoginClick={mockOnLoginClick} />);

    const passwordInput = screen.getByPlaceholderText("Jelszó");
    expect(passwordInput).toHaveAttribute("required");
  });

  it("handles network errors gracefully", async () => {
    const user = userEvent.setup();
    const mockOnLoginClick = vi.fn();

    global.fetch.mockRejectedValueOnce(new Error("Network error"));
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    render(<RegisterBody onLoginClick={mockOnLoginClick} />);

    await user.type(screen.getByPlaceholderText("Felhasználónév"), "newuser");
    await user.type(
      screen.getByPlaceholderText("Email cím"),
      "newuser@example.com",
    );
    await user.type(screen.getByPlaceholderText("Jelszó"), "password123");
    await user.click(screen.getByRole("button", { name: /regisztráció/i }));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Hiba a regisztráció során!");
    });

    alertSpy.mockRestore();
  });
});
