import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { sendSignUp } from "./client";
import { Alert, SuccessAlert } from "../alert";
import { Button } from "../button";
import { PasswordInput } from "../password";

const SuccessSignUp = (): JSX.Element => {
  return (
    <div className="mx-auto flex min-h-full w-96 flex-1 flex-col items-center justify-center px-6 py-12 lg:px-8">
      <SuccessAlert
        title="Registro exitoso."
        text="Te hemos enviado un correo electrónico de verificación para que confirmes tu cuenta y puedas hacer login."
      />
    </div>
  );
};

export default function SignUp(): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [successSignUp, setSuccessSignUp] = useState(false);

  if (successSignUp) {
    return <SuccessSignUp />;
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    setError(null);

    const data = new FormData(event.currentTarget);
    const email = data.get("email")?.toString();
    const password = data.get("password")?.toString();
    const confirmPassword = data.get("confirmPassword")?.toString();
    if (email == null || password == null || confirmPassword == null) {
      setError(new Error("Todos los campos son requeridos"));
      return;
    }
    if (password !== confirmPassword) {
      setError(new Error("Las contraseñas no coinciden."));
      return;
    }

    setLoading(true);
    const response = await sendSignUp({ email, password });
    if (!response.success) {
      setError(response.error);
    } else {
      setSuccessSignUp(true);
    }
    setLoading(false);
  }

  return (
    <>
      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <Image
            className="mx-auto my-8 h-28 w-auto"
            src="/lightLogo.svg"
            alt="OFMI"
            height={112}
            width={112}
          />
          <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
            Crea una cuenta
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form
            className="space-y-6"
            method="POST"
            onSubmit={(ev) => handleSubmit(ev)}
          >
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Correo electrónico
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Contraseña
                </label>
              </div>
              <div className="mt-2">
                <PasswordInput
                  id="password"
                  name="password"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Confirmar contraseña
                </label>
              </div>
              <div className="mt-2">
                <PasswordInput
                  id="confirmPassword"
                  name="confirmPassword"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                buttonType="primary"
                className="w-full"
                disabled={loading}
              >
                Crear cuenta
              </Button>
            </div>

            <div className="text-sm">
              <p className="font-light text-gray-700">
                ¿Ya tienes una cuenta?{" "}
                <Link
                  href="/login"
                  className="font-medium text-blue-500 hover:text-blue-700 hover:underline"
                >
                  Inicia sesión
                </Link>
              </p>
            </div>
          </form>
          {error != null && <Alert errorMsg={error.message} />}
        </div>
      </div>
    </>
  );
}
