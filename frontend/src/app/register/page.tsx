'use client';
import { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { registerRequest, clearErrors } from '@/store/slices/authSlice';
import { RootState } from '@/store';
import { registerSchema, RegisterInput } from '@/schemas';
import { zodValidate } from '@/utils/helpers';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function RegisterPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { isLoading, error, fieldErrors, user } = useSelector((s: RootState) => s.auth);

  useEffect(() => { if (user) router.replace('/notes'); }, [user, router]);
  useEffect(() => { return () => { dispatch(clearErrors()); }; }, [dispatch]);

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);

  const formik = useFormik<RegisterInput>({
    initialValues: { username: '', password: '', password2: '' },
    validate: zodValidate(registerSchema),
    onSubmit: (values) => {
      dispatch(registerRequest(values));
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50 dark:bg-ink-900 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl font-bold text-ink-900 dark:text-cream-100 mb-2">Noted.</h1>
          <p className="text-ink-500 dark:text-ink-400">Start organizing your thoughts</p>
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
              placeholder="choose_a_username"
              autoFocus
            />
            <Input
              label="Password"
              name="password"
              type="password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password ? formik.errors.password : undefined}
              placeholder="Min. 8 characters"
            />
            <Input
              label="Confirm Password"
              name="password2"
              type="password"
              value={formik.values.password2}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password2 ? formik.errors.password2 : undefined}
              placeholder="Repeat your password"
            />

            {error && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl">{error}</p>
            )}

            <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-ink-500 dark:text-ink-400">
            Already have an account?{' '}
            <Link href="/login" className="text-amber-accent hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
