import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  ShieldCheck,
  KeyRound,
  X,
} from "lucide-react";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(true);

  return (
    <div className="min-h-screen bg-[#f7f9ff] text-[#172033]">


      <header className="h-[70px] border-b border-slate-200 bg-white px-8">
        <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between">

          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-700">
              <span className="text-lg font-bold text-white">↗</span>
            </div>

            <div>
              <div className="text-sm font-bold">
                <span className="text-blue-600">PMS</span>
              </div>

              <div className="text-[10px] font-semibold tracking-[0.15em] text-slate-500">
                INSTITUTIONAL GATEWAY
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <div className="flex items-center gap-2 rounded-md bg-blue-50 px-4 py-2 text-slate-600">
              <Lock size={14} className="text-emerald-600" />
              256-BIT ENCRYPTED
            </div>

            <div className="flex items-center gap-2 rounded-md bg-blue-50 px-4 py-2 text-slate-600">
              <ShieldCheck size={14} className="text-blue-600" />
              TLS 1.3 ACTIVE
            </div>
          </div>

        </div>
      </header>

      
      <main className="mx-auto flex max-w-[700px] flex-col items-center px-5 py-12">

     
        <div className="mb-6 flex items-center gap-2 rounded-full bg-blue-50 px-5 py-2 text-xs font-semibold tracking-wider text-slate-600">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          INSTITUTIONAL REGISTRATION PORTAL
          <span>•</span>
          v4.8.2 Live
        </div>

        
        {success && (
          <div className="mb-0 flex w-full items-start justify-between rounded-t-lg bg-emerald-100 px-5 py-4">

            <div className="flex gap-3">
              <CheckCircle
                size={20}
                className="mt-0.5 text-emerald-800"
              />

              <div>
                <p className="font-semibold text-slate-800">
                  Account created successfully
                </p>

                <p className="text-sm text-slate-600">
                  Your institutional profile is provisioned.
                </p>

                <p className="text-sm text-slate-600">
                  Please login with your credentials.
                </p>
              </div>
            </div>

            <button onClick={() => setSuccess(false)}>
              <X size={18} className="text-slate-600" />
            </button>

          </div>
        )}


        <div className="w-full rounded-b-lg border-t-4 border-blue-700 bg-white px-8 py-10 shadow-xl">

          <div className="mb-6 flex justify-center">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-blue-700">
                <span className="font-bold text-white">↗</span>
              </div>

              <span className="font-semibold">
                <span className="text-blue-600">PMS</span>
              </span>
            </div>
          </div>

    
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold">
              Create your account
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Register to access the Portfolio Management System
            </p>
          </div>

          <form className="space-y-5">

    
            <FormInput
              label="FULL NAME"
              placeholder="Enter your name"
              icon={<User size={18} />}
            />

            <FormInput
              label="EMAIL"
              placeholder="Enter your email"
              icon={<Mail size={18} />}
              badge="REQUIRED FIELD"
              helper="Work or corporate domain preferred"
            />

            
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
                <div className="flex items-center rounded-md bg-blue-50 px-4 text-sm">
                  +91 (IN)
                </div>

                <div className="flex flex-1 items-center gap-3 rounded-md bg-blue-50 px-4">
                  <Phone size={18} className="text-slate-500" />

                  <input
                    type="tel"
                    placeholder="Enter your phone number"
                    className="w-full bg-transparent py-3 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>


            <PasswordInput
              label="PASSWORD"
              placeholder="Create a password"
              show={showPassword}
              setShow={setShowPassword}
              helper="Use 8+ alphanumeric characters & symbols"
            />


            <PasswordInput
              label="CONFIRM PASSWORD"
              placeholder="Confirm your password"
              show={showConfirmPassword}
              setShow={setShowConfirmPassword}
            />

           
            <button
              type="submit"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-blue-800 py-3.5 font-semibold text-white transition hover:bg-blue-900"
            >
              Create Account
              <span>→</span>
            </button>

          </form>

          
          <div className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <button className="font-semibold text-blue-700 hover:underline">
              Login
            </button>
          </div>

        </div>

        <div className="mt-7 flex gap-5 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <CheckCircle size={13} className="text-emerald-700" />
            Zero-Trust Access
          </span>

          <span>•</span>

          <span className="flex items-center gap-1">
            <KeyRound size={13} className="text-blue-700" />
            Hardware MFA Capable
          </span>
        </div>

        <p className="mt-3 text-center text-[10px] font-semibold tracking-wider text-slate-500">
          ENTERPRISE FUND MANAGEMENT GATEWAY • REGULATED BY SEBI &
          <br />
          GLOBAL INSTITUTIONAL STANDARDS
        </p>

      </main>

      {/* Footer */}
      <footer className="mt-10 border-t border-slate-200 bg-blue-50 px-8 py-5">
        <div className="mx-auto flex max-w-[1400px] justify-between text-xs text-slate-500">

          <div className="flex gap-5">
            <span>SOC2 TYPE II CERTIFIED</span>
            <span>FCA / SEC TIER 1 ACCESS</span>
            <span>ISO/IEC 27001</span>
          </div>

          <span>
            © 2024  Portfolio Management Systems LLC.
          </span>

        </div>
      </footer>

    </div>
  );
}

function FormInput({
  label,
  placeholder,
  icon,
  badge,
  helper,
}) {
  return (
    <div>
      <div className="mb-2 flex justify-between">
        <label className="text-xs font-semibold tracking-wide text-slate-600">
          {label}
        </label>

        {badge && (
          <span className="rounded bg-blue-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
            {badge}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 rounded-md bg-blue-50 px-4">
        <span className="text-slate-500">
          {icon}
        </span>

        <input
          type="text"
          placeholder={placeholder}
          className="w-full bg-transparent py-3 outline-none placeholder:text-slate-400"
        />
      </div>

      {helper && (
        <p className="mt-1 text-[11px] text-slate-500">
          {helper}
        </p>
      )}
    </div>
  );
}

function PasswordInput({
  label,
  placeholder,
  show,
  setShow,
  helper,
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold tracking-wide text-slate-600">
        {label}
      </label>

      <div className="flex items-center gap-3 rounded-md bg-blue-50 px-4">
        <Lock size={18} className="text-slate-500" />

        <input
          type={show ? "text" : "password"}
          placeholder={placeholder}
          className="w-full bg-transparent py-3 outline-none placeholder:text-slate-400"
        />

        <button
          type="button"
          onClick={() => setShow(!show)}
          className="text-slate-500"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {helper && (
        <p className="mt-1 text-[11px] text-slate-500">
          {helper}
        </p>
      )}
    </div>
  );
}