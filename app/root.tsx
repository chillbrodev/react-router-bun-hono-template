import type { ReactNode } from "react";
import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useNavigation,
} from "react-router";

import type { Route } from "./+types/root";
import stylesheet from "./app.css?url";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/gaming.ico", sizes: "32x32" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  { rel: "preconnect", href: "https://raw.githubusercontent.com" },
  { rel: "stylesheet", href: stylesheet },
];

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
        <Meta />
        <Links />
      </head>
      <body className="flex min-h-dvh flex-col bg-gray-50 text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-100">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:font-semibold focus:text-gray-900 focus:shadow-lg"
        >
          Skip to content
        </a>
        <header className="sticky top-0 z-40 border-b border-red-800 bg-red-600 text-white shadow">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
            <Link
              to="/"
              className="flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              <PokeballIcon />
              <span className="text-xl font-bold tracking-tight">Pokédex</span>
            </Link>
          </div>
          <NavigationProgress />
        </header>
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 focus:outline-none sm:px-6"
        >
          {children}
        </main>
        <footer className="border-t border-gray-200 py-6 text-center text-sm text-gray-600 dark:border-gray-800 dark:text-gray-400">
          Data from{" "}
          <a
            href="https://pokeapi.co"
            className="font-medium underline hover:text-gray-900 dark:hover:text-white"
          >
            PokéAPI
          </a>
          . Pokémon and Pokémon character names are trademarks of Nintendo.
        </footer>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function NavigationProgress() {
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";

  return (
    <div
      aria-hidden="true"
      className={`absolute inset-x-0 bottom-0 h-0.5 origin-left bg-amber-300 transition-transform duration-500 motion-reduce:transition-none ${busy ? "scale-x-75" : "scale-x-0"}`}
    />
  );
}

function PokeballIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" className="size-8">
      <circle
        cx="16"
        cy="16"
        r="15"
        fill="white"
        stroke="#111827"
        strokeWidth="2"
      />
      <path
        d="M1 16a15 15 0 0 1 30 0Z"
        fill="#dc2626"
        stroke="#111827"
        strokeWidth="2"
      />
      <circle
        cx="16"
        cy="16"
        r="5"
        fill="white"
        stroke="#111827"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <div className="space-y-4 py-16 text-center">
      <h1 className="text-3xl font-bold">{message}</h1>
      <p>{details}</p>
      <Link
        to="/"
        className="font-medium text-red-700 underline dark:text-red-400"
      >
        Back to Pokédex
      </Link>
      {stack && (
        <pre className="w-full overflow-x-auto p-4 text-left">
          <code>{stack}</code>
        </pre>
      )}
    </div>
  );
}
