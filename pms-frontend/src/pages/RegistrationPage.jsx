import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  KeyRound,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { register } from "../services/userService";

export default function RegistrationPage() {

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {

    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {

    event.preventDefault();

    setError("");

    if (
      !formData.name ||
      !formData.email ||
      !formData.phoneNumber ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("Please fill in all the required fields.");
      return;
    }

    if (formData.password.length < 8) {
      setError(
        "Password must contain at least 8 characters."
      );
      return;
    }

    if (
      formData.password !== formData.confirmPassword
    ) {
      setError("Passwords do not match.");
      return;
    }

    try {

      setLoading(true);

      const payload = {
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
      };

      await register(payload);

      /*
       * Registration succeeded.
       * Send the user to the login page.
       */
      navigate("/login", {
        state: {
          message:
            "Account created successfully. Please login with your credentials.",
        },
      });

    } catch (error) {

      setError(
        error.message ||
        "Registration failed. Please try again."
      );

    } finally {

      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fd] text-[#172033]">

      {/* HEADER */}

      <header className="h-[70px] border-b border-slate-200 bg-white px-8">

        <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between">

          <div className="flex items-center gap-3">

            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-700">
              <span className="text-lg font-bold text-white">
                ↗
              </span>
            </div>

            <div>
              <div className="text-sm font-bold">
                <span className="text-blue-600">
                  PMS
                </span>
              </div>

              <div className="text-[9px] font-semibold tracking-[0.15em] text-slate-500">
                INSTITUTIONAL
              </div>
            </div>

          </div>

          <div className="hidden items-center gap-3 text-xs font-semibold md:flex">

            <div className="flex items-center gap-2 rounded-md bg-[#eef4ff] px-4 py-2 text-slate-600">
              <Lock
                size={14}
                className="text-emerald-600"
              />
              SECURE ACCESS
            </div>

            <div className="flex items-center gap-2 rounded-md bg-[#eef4ff] px-4 py-2 text-slate-600">
              <ShieldCheck
                size={14}
                className="text-blue-600"
              />
              INSTITUTIONAL GATEWAY
            </div>

          </div>

        </div>

      </header>

      {/* MAIN */}

      <main className="mx-auto flex max-w-[700px] flex-col items-center px-5 py-10">

        <div className="mb-5 flex items-center gap-2 rounded-full bg-blue-50 px-5 py-2 text-xs font-semibold tracking-wider text-slate-600">

          <span className="h-2 w-2 rounded-full bg-emerald-500" />

          INSTITUTIONAL REGISTRATION PORTAL

        </div>

        <div className="w-full rounded-xl border border-slate-200 border-t-4 border-t-blue-700 bg-white px-8 py-9 shadow-sm">

          {/* LOGO */}

          <div className="mb-6 flex justify-center">

            <div className="flex items-center gap-2">

              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-700">
                <span className="font-bold text-white">
                  ↗
                </span>
              </div>

              <span className="font-semibold">
                <span className="text-blue-600">
                  PMS
                </span>
              </span>

            </div>

          </div>

          <div className="mb-7 text-center">

            <h1 className="text-3xl font-bold text-slate-900">
              Create your account
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Register to access the Portfolio Management System
            </p>

          </div>

          {/* ERROR */}

          {error && (

            <div className="mb-5 flex items-start gap-3 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">

              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0"
              />

              <span>{error}</span>

            </div>

          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* NAME */}

            <FormInput
              label="FULL NAME"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
              icon={<User size={18} />}
            />

            {/* EMAIL */}

            <FormInput
              label="EMAIL"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              icon={<Mail size={18} />}
            />

            {/* PHONE */}

            <div>

              <div className="mb-2 flex justify-between">

                <label className="text-xs font-semibold tracking-wide text-slate-600">
                  PHONE NUMBER
                </label>

                <span className="text-[10px] font-semibold text-slate-500">
                  DIRECT MOBILE
                </span>

              </div>

              <div className="flex gap-2">

                <div className="flex items-center rounded-md bg-[#edf2fb] px-4 text-sm text-slate-600">
                  +91
                </div>

                <div className="flex flex-1 items-center gap-3 rounded-md bg-[#edf2fb] px-4">

                  <Phone
                    size={18}
                    className="text-slate-500"
                  />

                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-slate-400"
                  />

                </div>

              </div>

            </div>

            {/* PASSWORD */}

            <PasswordInput
                label="PASSWORD"
                name="password"
                placeholder="Create a password"
                value={formData.password}
                show={showPassword}
                setShow={setShowPassword}
                onChange={handleChange}
            />

            <PasswordInput
                label="CONFIRM PASSWORD"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                show={showConfirmPassword}
                setShow={setShowConfirmPassword}
                onChange={handleChange}
            />
            {/* SUBMIT */}

            <button
              type="submit"
              disabled={loading}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-blue-800 py-3.5 font-semibold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
            >

              {loading
                ? "Creating Account..."
                : "Create Account"}

              {!loading && <span>→</span>}

            </button>

          </form>

          {/* LOGIN */}

          <div className="mt-6 text-center text-sm text-slate-500">

            Already have an account?{" "}

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="font-semibold text-blue-700 hover:underline"
            >
              Login
            </button>

          </div>

        </div>

        {/* SECURITY FOOTER */}

        <div className="mt-6 flex gap-5 text-xs text-slate-500">

          <span className="flex items-center gap-1">
            <CheckCircle
              size={13}
              className="text-emerald-700"
            />
            Secure Access
          </span>

          <span>•</span>

          <span className="flex items-center gap-1">
            <KeyRound
              size={13}
              className="text-blue-700"
            />
            BCrypt Protected
          </span>

        </div>

        <p className="mt-3 text-center text-[10px] font-semibold tracking-wider text-slate-500">
          ENTERPRISE FUND MANAGEMENT GATEWAY
        </p>

      </main>

      <footer className="border-t border-slate-200 bg-blue-50 px-8 py-5">

        <div className="mx-auto flex max-w-[1400px] justify-center text-xs text-slate-500">

          <span>
            PORTFOLIO MANAGEMENT SYSTEM • SECURE INSTITUTIONAL ACCESS
          </span>

        </div>

      </footer>

    </div>
  );
}


/* -------------------------------------------------- */
/* FORM INPUT */
/* -------------------------------------------------- */

function FormInput({
  label,
  name,
  type,
  value,
  onChange,
  placeholder,
  icon,
}) {

  return (

    <div>

      <label className="mb-2 block text-xs font-semibold tracking-wide text-slate-600">
        {label}
      </label>

      <div className="flex items-center gap-3 rounded-md bg-[#edf2fb] px-4">

        <span className="text-slate-500">
          {icon}
        </span>

        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-slate-400"
        />

      </div>

    </div>
  );
}


/* -------------------------------------------------- */
/* PASSWORD INPUT */
/* -------------------------------------------------- */

function PasswordInput({
  label,
  name,
  placeholder,
  value,
  show,
  setShow,
  onChange,
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold tracking-wide text-slate-600">
        {label}
      </label>

      <div className="flex items-center gap-3 rounded-md bg-[#edf2fb] px-4">

        <Lock
          size={18}
          className="text-slate-500"
        />

        <input
          id={name}
          name={name}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-slate-400"
        />

        <button
          type="button"
          onClick={() => setShow(!show)}
          className="text-slate-500"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>

      </div>
    </div>
  );
}

