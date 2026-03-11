'use client';
import { useEffect } from 'react';
import { useFormik } from 'formik';
import { useDispatch, useSelector } from 'react-redux';
import { User, CheckCircle } from 'lucide-react';
import { RootState } from '@/store';
import { updateProfileSchema, UpdateProfileInput } from '@/schemas';
import { zodValidate, formatDate } from '@/utils/helpers';
import { updateProfileRequest } from '@/store/actions/userActions';
import { clearErrors } from '@/store/slices/authSlice';
import PrivateLayout from '@/components/layout/PrivateLayout';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function ProfilePage() {
  const dispatch = useDispatch();
  const { user, isLoading, error, fieldErrors, successMessage } = useSelector((s: RootState) => s.auth);

  useEffect(() => () => { dispatch(clearErrors()); }, [dispatch]);

  const formik = useFormik<UpdateProfileInput>({
    initialValues: {
      current_username: user?.username || '',
      current_password: '',
      new_username: '',
      new_password: '',
    },
    validate: zodValidate(updateProfileSchema),
    enableReinitialize: true,
    onSubmit: (values) => {
      dispatch(clearErrors());
      const payload: Record<string, string> = {
        current_username: values.current_username,
        current_password: values.current_password,
      };
      if (values.new_username) payload.new_username = values.new_username;
      if (values.new_password) payload.new_password = values.new_password;
      dispatch(updateProfileRequest(payload as unknown as UpdateProfileInput));
    },
  });

  // Only clear sensitive fields once the update succeeds.
  // Clearing them synchronously in onSubmit causes Formik to re-validate
  // immediately, producing its own "Required" error that shadows the API
  // field error coming back from Redux (fieldErrors.current_password).
  useEffect(() => {
    if (successMessage) {
      formik.setFieldValue('current_password', '');
      formik.setFieldValue('new_password', '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successMessage]);

  return (
    <PrivateLayout>
      <div className="p-8 max-w-lg mx-auto">
        <h1 className="font-display text-3xl font-bold text-ink-900 dark:text-cream-100 mb-8">Profile</h1>

        <div className="bg-white dark:bg-ink-800 rounded-2xl shadow-card p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-accent/10 flex items-center justify-center">
              <User className="w-7 h-7 text-amber-accent" />
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold text-ink-900 dark:text-cream-100">{user?.username}</h2>
              <p className="text-sm text-ink-400">Member since {user ? formatDate(user.date_joined) : ''}</p>
            </div>
          </div>

          <form onSubmit={formik.handleSubmit} className="space-y-5">
            <Input label="Username" name="current_username" value={formik.values.current_username} readOnly
              disabled
              onBlur={formik.handleBlur}
              error={formik.touched.current_username ? (formik.errors.current_username || fieldErrors?.current_username) : undefined}
            />
            <Input label="Current Password" name="current_password" type="password"
              value={formik.values.current_password} onChange={formik.handleChange} onBlur={formik.handleBlur}
              error={fieldErrors?.current_password || formik.errors.current_password}
              placeholder="Required to make changes" />

            <div className="border-t border-cream-200 dark:border-ink-700 pt-5">
              <p className="text-xs text-ink-400 mb-4 uppercase tracking-wider font-medium">Change (optional)</p>
              <div className="space-y-4">
                <Input label="New Username" name="new_username"
                  value={formik.values.new_username} onChange={formik.handleChange} onBlur={formik.handleBlur}
                  error={formik.touched.new_username ? (formik.errors.new_username || fieldErrors?.new_username) : undefined}
                  placeholder="Leave empty to keep current" />
                <Input label="New Password" name="new_password" type="password"
                  value={formik.values.new_password} onChange={formik.handleChange} onBlur={formik.handleBlur}
                  error={formik.touched.new_password ? formik.errors.new_password : undefined}
                  placeholder="Leave empty to keep current" />
              </div>
            </div>

            {successMessage && (
              <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-4 py-3 rounded-xl">
                <CheckCircle className="w-4 h-4 shrink-0" />
                {successMessage}
              </div>
            )}

            {error && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl">{error}</p>
            )}

            <Button type="submit" isLoading={isLoading} className="w-full">Save Changes</Button>
          </form>
        </div>
      </div>
    </PrivateLayout>
  );
}
