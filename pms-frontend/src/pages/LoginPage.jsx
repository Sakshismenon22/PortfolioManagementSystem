import { useState } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  KeyRound,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { login } from "../services/userService";

export default function LoginPage() {

  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  const registrationMessage =
    location.state?.message || "";

  const handleSubmit = async (event) => {

    event.preventDefault();

    setError("");

    if (!email || !password) {
      setError(
        "Please enter your email and password."
      );
      return;
    }

    try {

      setLoading(true);

      const response = await login({
        email,
        password,
      });

      /*
       * Backend Response structure:
       *
       * {
       *   success: true,
       *   data: {
       *      userId,
       *      name,
       *      email,
       *      role,
       *      message
       *   }
       * }
       */

      const user = response.data;

      if (!user) {
        throw new Error("Invalid login response.");
      }

      localStorage.setItem(
        "userId",
        String(user.userId)
      );

      localStorage.setItem(
        "userName",
        user.name
      );

      localStorage.setItem(
        "userEmail",
        user.email
      );

      localStorage.setItem(
        "userRole",
        user.role
      );

      /*
       * Successful login → Dashboard
       */
      navigate("/home", {
        replace: true,
      });

    } catch (error) {

      setError(
        error.message ||
        "Invalid email or password."
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

      <main className="mx-auto flex max-w-[520px] flex-col items-center px-5 py-14">

        <div className="mb-5 flex items-center gap-2 rounded-full bg-blue-50 px-5 py-2 text-xs font-semibold tracking-wider text-slate-600">

          <span className="h-2 w-2 rounded-full bg-emerald-500" />

          INSTITUTIONAL LOGIN PORTAL

        </div>

        <div className="w-full rounded-xl border border-slate-200 border-t-4 border-t-blue-700 bg-white px-8 py-10 shadow-sm">

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
              Welcome back
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Sign in to access your portfolio dashboard
            </p>

          </div>

          {/* REGISTRATION SUCCESS */}

          {registrationMessage && (

            <div className="mb-5 flex items-start gap-3 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-700">

              <CheckCircle
                size={18}
                className="mt-0.5 shrink-0"
              />

              <span>
                {registrationMessage}
              </span>

            </div>

          )}

          {/* ERROR */}

          {error && (

            <div className="mb-5 flex items-start gap-3 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">

              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0"
              />

              <span>
                {error}
              </span>

            </div>

          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* EMAIL */}

            <div>

              <label className="mb-2 block text-xs font-semibold tracking-wide text-slate-600">
                EMAIL
              </label>

              <div className="flex items-center gap-3 rounded-md bg-[#edf2fb] px-4">

                <Mail
                  size={18}
                  className="text-slate-500"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="Enter your email"
                  autoComplete="email"
                  className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-slate-400"
                />

              </div>

            </div>

            {/* PASSWORD */}

            <div>

              <label className="mb-2 block text-xs font-semibold tracking-wide text-slate-600">
                PASSWORD
              </label>

              <div className="flex items-center gap-3 rounded-md bg-[#edf2fb] px-4">

                <Lock
                  size={18}
                  className="text-slate-500"
                />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-slate-400"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  className="text-slate-500"
                >

                  {showPassword
                    ? <EyeOff size={18} />
                    : <Eye size={18} />
                  }

                </button>

              </div>

            </div>

            {/* LOGIN */}

            <button
              type="submit"
              disabled={loading}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-blue-800 py-3.5 font-semibold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
            >

              {loading
                ? "Signing In..."
                : "Sign In"}

              {!loading && (
                <span>→</span>
              )}

            </button>

          </form>

          {/* REGISTER */}

          <div className="mt-6 text-center text-sm text-slate-500">

            Don't have an account?{" "}

            <button
              type="button"
              onClick={() =>
                navigate("/register")
              }
              className="font-semibold text-blue-700 hover:underline"
            >
              Create Account
            </button>

          </div>

        </div>

        {/* SECURITY */}

        <div className="mt-7 flex gap-5 text-xs text-slate-500">

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

    </div>
  );
}