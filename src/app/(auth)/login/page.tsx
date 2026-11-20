import { LoginForm } from "@/components/auth/login-form";
import { AUTH_MESSAGES } from "@/lib/auth/oauth";
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const message = error && Object.hasOwn(AUTH_MESSAGES, error) ? AUTH_MESSAGES[error] : undefined;
  return <LoginForm callbackError={message} />;
}
