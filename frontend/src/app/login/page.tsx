'use client';
import { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginRequest, clearErrors } from '@/store/slices/authSlice';
import { RootState } from '@/store';
import { loginSchema, LoginInput } from '@/schemas';
import { zodValidate } from '@/utils/helpers';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function LoginPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { isLoading, error, fieldErrors, user } = useSelector((s: RootState) => s.auth);

  useEffect(() => { if (user) router.replace('/notes'); }, [user, router]);
  useEffect(() => { return () => { dispatch(clearErrors()); }; }, [dispatch]);

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);

  const formik = useFormik<LoginInput>({
    initialValues: { username: '', password: '' },
    validate: zodValidate(loginSchema),
    onSubmit: (values) => {
      dispatch(loginRequest(values));
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50 dark:bg-ink-900 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl font-bold text-ink-900 dark:text-cream-100 mb-2">Noted.</h1>
          <p className="text-ink-500 dark:text-ink-400">Welcome back</p>
        </div>

        <div className="bg-white dark:bg-ink-800 rounded-2xl shadow-card p-8 space-y-5">
          <form onSubmit={formik.handleSubmit} className="space-y-4" data-hydrated={hydrated ? "true" : undefined}>
            <Input
              label="Username"
              name="username"
              value={formik.values.username}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.username ? (formik.errors.username || fieldErrors?.username) : undefined}
              placeholder="your_username"
              autoComplete="username"
              autoFocus
            />
            <Input
              label="Password"
              name="password"
              type="password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password ? (formik.errors.password || fieldErrors?.password) : undefined}
              placeholder="••••••••"
              autoComplete="current-password"
            />

            {(error || fieldErrors?.non_field_errors) && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl">
                {fieldErrors?.non_field_errors || error}
              </p>
            )}

            <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-ink-500 dark:text-ink-400">
            No account?{' '}
            <Link href="/register" className="text-amber-accent hover:underline font-medium">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
